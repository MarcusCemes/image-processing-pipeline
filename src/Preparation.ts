// Responsive Image Builder - Preparation
// Runs pre-processing checks and fetches images
import chalk from "chalk";
import { DynamicTerminal, ILine } from "dynamic-terminal";
import { prompt } from "enquirer";
import { warning } from "figures";
import { access, constants, emptyDir, ensureDir, pathExists, stat } from "fs-extra";
import { platform } from "os";
import { isAbsolute, posix } from "path";
import glob from "tiny-glob";

import { IConfig } from "./Config";
import { PREPARATION_ERRORS, SUPPORTED_EXTENSIONS, WRAP_WIDTH } from "./Constants";
import { PreparationError } from "./Interfaces";
import { Logger } from "./Logger";
import { centreText, cleanUpPath } from "./Utility";

export interface IFile {
  /** The input path root directory */
  base: string;
  /** The path to the image file inside of input path directory */
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
  public terminal: DynamicTerminal;
  public logger: Logger;
  public config: IConfig;

  constructor(config: IConfig) {
    this.config = config;
    this.logger = new Logger(config.verbosity);
    this.terminal = config.verbosity === "verbose" ? new DynamicTerminal() : null;
  }

  public async prepare(): Promise<IFile[]> {
    try {
      if (this.terminal) {
        await this.terminal.start();
      }

      // Clean the input and output paths for cross/compatibility on Windows and Linux
      // A bit of a dirty hack, but its more DRY
      this.config.in = this.config.in.map(cleanUpPath);
      this.config.out = cleanUpPath(this.config.out);

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

      if (this.terminal) {
        await this.terminal.stop();
        this.terminal.destroy();
      }

      // Build an error list if something failed
      let errors = "";
      for (const promise of promises) {
        if (promise.error) {
          errors += "\n\n " + DynamicTerminal.CROSS + " " + promise.error + "\n";
        }
      }

      if (errors !== "") {
        throw new PreparationError(PREPARATION_ERRORS.generalError, errors);
      }

      // Resolve the promise
      return promises[2].files;
    } catch (err) {
      if (this.terminal) {
        await this.terminal.stop(false);
        this.terminal.destroy();
      }

      this.logger.error(
        "\r\n" + // Cursor is at position 1 for some reason
          centreText(
            chalk.bold.red(`${warning} START FAILURE ${warning}`) +
              "\n\n" +
              err.message.trim() +
              (err.userMessage ? "\n\n" + err.userMessage.trim() : "") || err,
            WRAP_WIDTH
          ) +
          "\n",
        2,
        false
      );
      throw new PreparationError(PREPARATION_ERRORS.fatalError, err.message || err);
    }
  }

  /**
   * Clean the output directory. If the directory contains important files, the
   * user will be prompted to confirm the clean. This can be overridden with the force option.
   *
   * If verbosity is set bellow verbose, the program will fail.
   */
  public async cleanOutput() {
    if (!(await pathExists(this.config.out))) {
      await ensureDir(this.config.out);
    } else if (this.config.cleanBeforeExport) {
      // Don't require prompt if force is true
      if (!this.config.force) {
        // Scan the output directory for important files, and prompt confirmation if yes
        if (this.terminal) {
          this.terminal.update({ text: `${DynamicTerminal.SPINNER} Checking output directory` });
        }

        // tiny-glob works with UNIX-style paths, even on Windows
        const cwd = isAbsolute(this.config.out) && platform() !== "win32" ? "/" : "";
        const files = await glob(posix.join(this.config.out, "/**/*"), {
          absolute: true,
          filesOnly: true,
          cwd
        });
        const knownExtensions = SUPPORTED_EXTENSIONS.map(ext => `.${ext}`).concat(".json");

        for (const file of files) {
          if (
            knownExtensions.indexOf(posix.parse(file).ext) === -1 &&
            !RegExp(/.rib-[0-9a-zA-Z]*/).test(file)
          ) {
            // Unknown file extension found, prompt clean
            if (this.terminal) {
              await this.terminal.stop(false);
              this.terminal.destroy(); // Worker would block program termination
            }

            const response: boolean =
              this.config.verbosity === "silent"
                ? false
                : ((await prompt({
                    type: "confirm",
                    name: "cleanConfirmation",
                    message: `${chalk.red(
                      "Warning!"
                    )} The output directory contains non-image files.\n  Are you sure you want to delete it?`
                  })) as any).cleanConfirmation;

            if (!response) {
              throw new PreparationError(PREPARATION_ERRORS.outputNotEmptyError);
            }

            // Clean was accepted, remove the prompt and restart terminal writing
            if (process.stdout.isTTY) {
              process.stdout.write("\x1b[2A\r\x1b[J"); // remove the prompt
            }
            if (this.terminal) {
              this.terminal.startWorker();
              await this.terminal.start(); // All ok, start a new terminal write session
            }
            break;
          }
        }
      }

      if (this.terminal) {
        this.terminal.update({
          text: DynamicTerminal.SPINNER + " Cleaning the output directory",
          indent: 6
        });
      }
      await emptyDir(this.config.out);
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
    const writeAccess = access(this.config.out, constants.W_OK);

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
      require("sharp");
      this.update(line, DynamicTerminal.TICK + " SHARP is warmed up");
      return response;
    } catch (err) {
      if (RegExp(/binaries cannot be used/).test(err.message || err)) {
        this.update(line, DynamicTerminal.CROSS + " Incompatible SHARP binaries");
        response.error =
          chalk.red("RIB has detected that you have the incorrect SHARP binaries installed:\n") +
          chalk.white(err.message);
      } else {
        this.update(line, DynamicTerminal.CROSS + " SHARP is not installed.");
        response.error =
          "SHARP is not installed. This is a required dependency.\n" +
          chalk.white("Try running ") +
          chalk.keyword("orange")("npm i sharp");
      }
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
      if (!(await pathExists(dir))) {
        this.update(line, DynamicTerminal.CROSS + " Input directory does not exist");
        result.error = 'The input directory "' + dir + '" does not exist';
        return result;
      }

      const readAccess = new Promise(resolve => {
        access(dir, constants.R_OK, err => {
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
        if ((await stat(dir)).isFile()) {
          result.files.push({ base: posix.parse(dir).dir, path: dir });
        } else {
          const cwd = isAbsolute(dir) && platform() !== "win32" ? "/" : "";
          const files = await glob(
            posix.join(dir, "/**/*.{" + SUPPORTED_EXTENSIONS.join(",") + "}"),
            { absolute: true, cwd }
          );
          result.files.push(...files.map(p => ({ base: dir, path: cleanUpPath(p) })));
        }
        this.update(
          line,
          DynamicTerminal.SPINNER + " Searching for images (found " + result.files.length + ")"
        );
      } catch (err) {
        this.update(line, DynamicTerminal.CROSS + " Failed to search for images");
        result.error = "Failed to search for images\n" + chalk.white(err.message || err);
        return result;
      }
    }

    if (result.files.length === 0) {
      result.error =
        "No image files found\n" + chalk.white("Check that the input paths are correct");
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
      if (this.terminal) {
        this.terminal.update(this.lines);
      }
    }
  }
}
