import ansiAlign from "ansi-align";
import chalk from "chalk";
import { DynamicTerminal, ILine } from "dynamic-terminal";
import { prompt } from "enquirer";
import figures from "figures";
import fs from "fs-extra";
import os from "os";
import path from "path";
import slash from "slash";
import glob from "tiny-glob";

import { IConfig } from "./Config";
import { SUPPORTED_EXTENSIONS } from "./Constants";
import { PreparationError } from "./Interfaces";
import { Logger } from "./Logger";

export interface IFile {
  base: string;
  path: string;
}

interface ITaskError {
  error?: string;
}

interface IFileTask extends ITaskError {
  files: IFile[];
}

export class Preparation {
  public lines: ILine[] = [];
  public output: DynamicTerminal;
  public logger: Logger;
  public config: IConfig;

  constructor(configuration: IConfig) {
    this.config = configuration;
    this.logger = new Logger(configuration.verbosity);
    this.output = new DynamicTerminal();
  }

  public async prepare(): Promise<IFile[]> {
    try {
      await this.output.start();

      // Clean the input and output paths for cross/compatibility on Windows and Linux
      // A bit of a dirty hack, but its more DRY
      this.config.in = this.config.in.map(this.cleanUpPath);
      this.config.out = this.cleanUpPath(this.config.out);

      // Clean the output directory
      await this.cleanOutput();

      this.update(0, "", 6);
      this.update(1, "", 6);
      this.update(2, "", 6);

      const promises = await Promise.all([
        this.checkRequirements(0),
        this.checkAccess(1),
        this.getFiles(2)
      ]);

      await this.output.stop();
      this.output.destroy();

      // Build an error list if something failed
      let errors = "";
      for (const promise of promises) {
        if (promise.error) {
          errors += "\n" + promise.error + "\n";
        }
      }

      if (errors !== "") {
        throw new PreparationError(errors, "Preparation failed");
      }

      // Resolve the promise
      return promises[2].files;
    } catch (err) {
      await this.output.stop(false);
      this.output.destroy();
      this.logger.error(
        "\r\n" + // Cursor is at position 1 for some reason
          ansiAlign(
            chalk.bold.red(`${figures.warning} START FAILURE ${figures.warning}`) +
              "\n\n" +
              err.message.trim() || err
          ) +
          "\n",
        2,
        false
      );
      throw new PreparationError(err.message || err, "Preparation failed");
    }
  }

  /**
   * Clean the output directory. If the directory contains important files, the
   * user will be prompted to confirm the clean. This can be overridden with the force option.
   *
   * If verbosity is set bellow verbose, the program will fail.
   */
  public async cleanOutput() {
    if (!(await fs.pathExists(this.config.out))) {
      await fs.ensureDir(this.config.out);
    } else if (this.config.cleanBeforeExport) {
      // Don't require prompt if force is true
      if (!this.config.force) {
        // Scan the output directory for important files, and prompt confirmation if yes
        this.output.update({ text: `${DynamicTerminal.SPINNER} Checking output directory` });

        // tiny-glob works with UNIX-style paths, even on Windows
        const files = await glob(path.posix.join(this.config.out, "/**/*"), {
          cwd: path.isAbsolute(this.config.out) ? "/" : ".",
          absolute: true,
          filesOnly: true
        });
        const knownExtensions = SUPPORTED_EXTENSIONS.map(ext => `.${ext}`).concat(".json");

        for (const file of files) {
          if (knownExtensions.indexOf(path.posix.parse(file).ext) === -1) {
            // Unknown file extension found, prompt clean
            await this.output.stop(false);
            this.output.destroy(); // Worker would block program termination

            const response: true | { cleanConfirmation: boolean } = this.config.force
              ? true
              : await prompt({
                  type: "confirm",
                  name: "cleanConfirmation",
                  message: `${chalk.red(
                    "Warning!"
                  )} The output directory contains non-image files.\n  Are you sure you want to delete it?`
                });

            if (typeof response === "object" && !response.cleanConfirmation) {
              throw new PreparationError(
                "Output directory not empty",
                "The output directory may have contained important files, and you aborted the clean"
              );
            }

            // Clean was accepted, remove the prompt and restart terminal writing
            this.output.startWorker();
            if (process.stdout.isTTY) {
              process.stdout.write("\x1b[2A\r\x1b[J");
            }
            await this.output.start(); // All ok, start a new terminal write session
            break;
          }
        }
      }

      this.output.update({
        text: DynamicTerminal.SPINNER + " Cleaning the output directory",
        indent: 6
      });
      await fs.emptyDir(this.config.out);
    }
  }

  /**
   * Check the write permissions for the output directory
   */
  public async checkAccess(line: number): Promise<ITaskError> {
    const response: ITaskError = {
      error: null
    };

    this.update(line, DynamicTerminal.SPINNER + " Verifying write permissions");

    // Check write access for output path
    const writeAccess = fs.access(this.config.out, fs.constants.W_OK);

    try {
      await writeAccess;
    } catch (err) {
      this.update(line, DynamicTerminal.CROSS + " Write permissions problem");
      response.error = `No write access for output path "${this.config.out}"`;
      return response;
    }

    this.update(line, DynamicTerminal.TICK + " Write permissions are OK");
    return response;
  }

  /**
   * Verify that SHARP is installed.
   * This is here for legacy reasons, when SHARP was part of the peerDependencies list.
   * This, however, made it very difficult to allow the module to be installed globally.
   * @legacy
   */
  public async checkRequirements(line: number): Promise<ITaskError> {
    const response = {
      error: null
    };

    try {
      this.update(line, DynamicTerminal.SPINNER + " Checking for SHARP dependency");
      require.resolve("sharp");
      this.update(line, DynamicTerminal.TICK + " SHARP is warmed up");
      return response;
    } catch {
      this.update(line, DynamicTerminal.CROSS + " SHARP is not installed.");
      response.error =
        "SHARP is not installed. This is a required dependency.\n" +
        chalk.reset("Try running ") +
        chalk.keyword("orange")("npm i sharp");
      return response;
    }
  }

  /**
   * Build a list of images to process using glob
   */
  public async getFiles(line: number): Promise<IFileTask> {
    const result: IFileTask = {
      error: null,
      files: []
    };

    this.update(line, DynamicTerminal.SPINNER + " Verifying input paths");

    for (const dir of this.config.in) {
      if (!(await fs.pathExists(dir))) {
        this.update(line, DynamicTerminal.CROSS + " Input directory does not exist");
        result.error = 'The input directory "' + dir + '" does not exist';
        return result;
      }

      const readAccess = new Promise(resolve => {
        fs.access(dir, fs.constants.R_OK, err => {
          if (err) {
            resolve(false);
          }
          resolve(true);
        });
      });
      if (!(await readAccess)) {
        this.update(line, DynamicTerminal.CROSS + " Read permissions problem");
        result.error = `Not enough permissions to read the directory "${dir}"`;
        return result;
      }
    }

    this.update(line, DynamicTerminal.SPINNER + " Searching for images");

    // tiny-glob requires forward slashes
    // resolve all supported files and append them to the files array as a File object
    for (const dir of this.config.in) {
      try {
        if ((await fs.stat(dir)).isFile()) {
          result.files.push({ base: path.posix.parse(dir).dir, path: dir });
        } else {
          const files = await glob(
            path.posix.join(dir, "/**/*.{" + SUPPORTED_EXTENSIONS.join(",") + "}"),
            { absolute: true, cwd: path.isAbsolute(this.config.out) ? "/" : "." }
          );
          result.files.push(...files.map(p => ({ base: dir, path: p })));
        }
        this.update(
          line,
          DynamicTerminal.SPINNER + " Searching for images (found " + result.files.length + ")"
        );
      } catch (err) {
        this.update(line, DynamicTerminal.CROSS + " Failed to search for images");
        result.error = "Failed to search for images\n" + chalk.reset(err.message || err);
        return result;
      }
    }

    if (result.files.length === 0) {
      result.error =
        "No image files found\n" + chalk.reset("Check that the input paths are correct");
      this.update(line, DynamicTerminal.CROSS + " No images found");
      return result;
    }
    this.update(
      line,
      DynamicTerminal.TICK + " Added " + result.files.length + " images to the queue"
    );
    return result;
  }

  private update(line: number, text: string, indent?: number) {
    if (this.logger.verbosity >= Logger.VERBOSE) {
      if (!this.lines[line]) {
        this.lines[line] = { text: "", indent: indent ? indent : 0 };
      }
      this.lines[line].text = text;
      if (indent) {
        this.lines[line].indent = indent;
      }
      this.output.update(this.lines);
    }
  }

  /**
   * Resolve the path to an absolute path on Windows and Linux based systems.
   *
   * On Windows, single backslashes "\\" AND double backslashes "\\\\"
   * will be converted to a single forward slash "/". This makes Linux and
   * Windows easier to manage at the same time, and helps some libraries behave
   * who hate Windows.
   *
   * Node.js tends to handle forward slashes on Windows fairly well.
   */
  private cleanUpPath(pathToClean: string): string {
    let newPath = pathToClean;
    if (os.platform() === "win32") {
      newPath = newPath.replace(/(?<!\\)\\(?!\\)/g, "\\");
      newPath = slash(path.resolve(newPath));
    } else {
      newPath = path.resolve(newPath);
    }
    return newPath;
  }
}
