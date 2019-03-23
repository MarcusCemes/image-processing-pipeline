import chalk from "chalk";
import cluster from "cluster";
import { DynamicTerminal, ILine } from "dynamic-terminal";
import { hamburger } from "figures";
import { createWriteStream } from "fs";
import { constants, cpus, getPriority, setPriority } from "os";
import path from "path";
import { emitKeypressEvents } from "readline";

import { IConfig } from "./Config";
import { IExport, IFailedExport } from "./Interfaces";
import { Logger } from "./Logger";
import { IFile } from "./Preparation";
import { ICommand } from "./ProcessThread";

const cores = cpus().length;

export interface IControllerResult {
  completed: IExport[];
  failed: IFailedExport[];
}

export class Controller {
  private workers: cluster.Worker[] = [];

  private config: IConfig;
  private fileCursor = 0;
  private files: IFile[];
  private logger: Logger;
  private terminal: DynamicTerminal;
  private terminalLines: ILine[] = [];
  private updateInterval: NodeJS.Timer = null;

  private completedFiles: IExport[] = [];
  private failedFiles: IFailedExport[] = [];

  constructor(config: IConfig, files: IFile[]) {
    this.config = config;
    this.files = files;
    this.logger = new Logger(config.verbosity);
    this.terminal = new DynamicTerminal();

    cluster.setupMaster({
      exec: path.join(__dirname, "ProcessThread.js")
    });
  }

  /**
   * Processes the key asynchronously with a worker cluster
   */
  public async process(): Promise<IControllerResult> {
    try {
      this.terminal.start({ updateFrequency: 200 });
      this.prepareRender();
      this.render("Starting the cluster", false);

      // Elevate the process priority to keep up with threads
      const previousPriority = getPriority();
      try {
        if (previousPriority < constants.priority.PRIORITY_ABOVE_NORMAL) {
          setPriority(constants.priority.PRIORITY_ABOVE_NORMAL);
        }
      } catch (err) {
        /* */
      }

      // Calculate the necessary workers
      const coreLimit = this.config.threads ? this.config.threads : cores;
      const workersNeeded = Math.min(this.files.length, coreLimit);

      // Fork the workers
      for (let i = 0; i < workersNeeded; i++) {
        this.workers.push(cluster.fork({ WORKER_ID: i }));
      }

      // Setup a message listener on the cluster, and setup the termination promise
      const termination = new Promise(resolve => {
        const messageHandler = (worker, msg) => {
          this.handleMessage(worker, msg, resolve);
        };
        cluster.on("message", messageHandler);
      });

      // Initialize the workers and send an initial job
      for (const worker of Object.values(this.workers)) {
        worker.once("exit", () => {
          // Remove worker from the array
          this.workers = this.workers.splice(this.workers.indexOf(worker), 1);
        });
        const cmds: ICommand[] = [
          // get type annotations
          { cmd: "INIT", config: this.config },
          { cmd: "FILE", file: this.files[this.fileCursor] }
        ];
        for (const cmd of cmds) {
          worker.send(cmd);
        }
        this.fileCursor++;
      }

      // Start updating progress as soon as something starts happening
      cluster.once("message", () => {
        this.updateInterval = setInterval(this.render.bind(this), 200);
      });

      // Listen to Ctrl+C and "q" keypress
      this.block();
      emitKeypressEvents(process.stdin);
      process.stdin.on("keypress", this.handleKeypress.bind(this));

      // Wait for completion
      await termination;

      this.unblock();
      process.stdin.removeAllListeners("keypress");

      clearInterval(this.updateInterval);
      this.updateInterval = null;

      // Send the kill signal to the cluster
      for (const worker of Object.values(this.workers)) {
        worker.kill();
      }

      this.workers = [];

      this.terminalLines = [
        {
          text: `${DynamicTerminal.TICK} ${
            this.completedFiles.length
          } images were successfully converted`,
          indent: 6
        }
      ];
      this.terminal.update(this.terminalLines);

      if (this.config.exportManifest) {
        const manifestLine = {
          text: `${DynamicTerminal.SPINNER} Writing manifest`,
          indent: 6
        };
        this.terminalLines.push(manifestLine);
        this.terminal.update(this.terminalLines);

        // Write the manifest
        try {
          const manifest = {
            exports: this.completedFiles
          };
          const json = JSON.stringify(manifest);
          const writeStream = createWriteStream(path.join(this.config.out, "manifest.json"));
          writeStream.write(json);
          writeStream.end();
          manifestLine.text = `${
            DynamicTerminal.TICK
          } An export manifest has been written to ${chalk.keyword("orange")("manifest.json")}`;
        } catch (err) {
          manifestLine.text = `${DynamicTerminal.CROSS} Failed to write manifest file:\n${err}`;
        }
        this.terminal.update(this.terminalLines);
      }

      await this.terminal.stop();
      this.terminal.destroy();

      // Show a warning if files failed, and write the errors to errors.json in OUT DIR
      if (this.failedFiles.length > 0) {
        this.logger.warning(
          `${this.failedFiles.length} image${
            this.failedFiles.length !== 1 ? "s" : ""
          } failed during export`
        );

        try {
          const description = "See the documentation for help with error codes";
          const json = JSON.stringify({ description, errors: this.failedFiles });
          const writeStream = createWriteStream(path.join(this.config.out, "errors.json"));
          await new Promise(res => {
            writeStream.on("finish", () => res());
            writeStream.write(json);
            writeStream.end();
          });
          this.logger.warning(`See ${chalk.keyword("orange")("errors.json")} for more info`);
        } catch (err) {
          this.logger.error(`Failed to write to ${chalk.keyword("orange")("errors.json")}`);
        }
      }

      // Restore the process priority
      try {
        setPriority(previousPriority);
      } catch (err) {
        /* */
      }

      return {
        completed: this.completedFiles,
        failed: this.failedFiles
      };
    } catch (err) {
      this.terminal.stop(false);
      this.logger.error("Error while processing files:\n" + err);
      return {
        completed: [],
        failed: this.files.map(file => ({ path: file.path, reason: "Unknown: code error" }))
      };
    }
  }

  /** Sets the terminal to raw mode and emits keypress events */
  public block() {
    if (!process.stdin.isRaw) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
    }
  }

  /** Removes terminal raw mode and allows the program to exit */
  public unblock() {
    if (process.stdin.isRaw) {
      process.stdin.setRawMode(false);
      if (!process.env.CLI_MODE) {
        process.stdin.pause();
      } // Windows bug
    }
  }

  /**
   * Processes message received from workers, and hands them a new job.
   * Also resolves a callback if all jobs are complete
   */
  private handleMessage(worker: cluster.Worker, msg, completeCallback: () => void) {
    const { status } = msg;
    switch (status) {
      case "COMPLETE":
        this.completedFiles.push(msg.data);
        if (!this.giveJob(worker)) {
          const cmd = { cmd: "KILL" };
          worker.send(cmd);
          this.workers = this.workers.splice(this.workers.indexOf(worker), 1);
        }
        break;
      case "FAILED":
        this.failedFiles.push(msg.data);
        if (!this.giveJob(worker)) {
          const cmd = { cmd: "KILL" };
          worker.send(cmd);
          this.workers = this.workers.splice(this.workers.indexOf(worker), 1);
        }
        break;
    }

    // Resolve if all files have been completed
    if (this.completedFiles.length + this.failedFiles.length === this.files.length) {
      completeCallback();
    }
  }

  private giveJob(worker: cluster.Worker): boolean {
    if (this.fileCursor < this.files.length) {
      const cmd = { cmd: "FILE", file: this.files[this.fileCursor] };
      worker.send(cmd);
      this.fileCursor++;
      return true;
    }
    return false;
  }

  private prepareRender(): void {
    this.terminalLines = [];
    this.terminalLines.push({ text: "", indent: 0 });
    this.terminalLines.push({ text: "", indent: 2 });
    this.terminalLines.push({ text: "", indent: 0 });
    this.terminalLines.push({ text: "", indent: 6 });
  }

  private render(status?: string, showProgress: boolean = true): void {
    const complete = this.completedFiles.length + this.failedFiles.length;
    const barWidth = 25;
    const barFilled = Math.min(barWidth, Math.floor((complete / this.files.length) * barWidth));
    const barSpace = barWidth - barFilled;
    const bar = `${chalk.cyan(hamburger.repeat(barFilled))}${chalk.grey(
      hamburger.repeat(barSpace)
    )}`; // █

    status = status ? status : `${chalk.bold.cyan("Get a cup of coffee while I'm working")}`;

    this.terminalLines[1].text = `${DynamicTerminal.SPINNER} ${status}`;
    this.terminalLines[3].text = showProgress ? `${bar}  ${complete}/${this.files.length}` : "";
    this.terminal.update(this.terminalLines);
  }

  /** Skip the queue */
  private handleKeypress(chunk, key) {
    if (key && ((key.ctrl && key.name === "c") || key.name === "q")) {
      while (this.fileCursor < this.files.length) {
        this.failedFiles.push({
          path: this.files[this.fileCursor].path,
          reason: "The queue was cancelled"
        });
        this.fileCursor++;
      }
      this.fileCursor = this.files.length;
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
      this.render(chalk.bold.red("Waiting for threads to finish"), false);
      this.unblock();
    }
  }
}
