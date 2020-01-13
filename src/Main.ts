// Responsive Image Builder - Main
// The main starting point of the program, after the entry point
import boxen from "boxen";
import chalk from "chalk";

import { IConfig } from "./Config";
import { PREPARATION_ERRORS, WRAP_WIDTH } from "./Constants";
import { Controller } from "./Controller";
import { IResult, PreparationError } from "./Interfaces";
import { Logger } from "./Logger";
import { IFile, Preparation } from "./Preparation";
import { centreText } from "./Utility";

// tslint:disable:no-var-requires
const gradient =
  require("os").platform === "win32"
    ? require("gradient-string")([
        { color: "#2193b0", pos: 0 },
        { color: "#6dd5ed", pos: 1 }
      ]).multiline
    : chalk.bold.white;

export async function main(config: IConfig): Promise<IResult> {
  const logger = new Logger(config.verbosity);
  try {
    // Display the program banner
    showBanner(logger);

    // Check for the required dependencies
    // Search for images files to process
    const files = await prepare(config);

    const converted = await processImages(config, files);

    if (converted.failed.length === 0) {
      logSuccess(logger);
    } else {
      logWarning(logger);
    }

    // Return the final program state
    return {
      success: true,
      exports: converted.completed
    };
  } catch (err) {
    logFailed(logger);
    throw err;
  }
}

function showBanner(logger: Logger) {
  logger.log(
    gradient(`
   ______   _____ _______
  (, /   ) (, /  (, /    )
    /__ /    /     /---(
 ) /   \\____/__ ) / ____)
(_/    (__ /   (_/ (`),
    10
  );
  logger.log(
    centreText("\n\n  A WebP build pipeline\n  https://git.io/fjvL7\n", WRAP_WIDTH),
    Logger.VERBOSE
  );
}

async function prepare(config: IConfig): Promise<IFile[]> {
  // Run the preparation. This may throw a PreparationError
  const files = await new Preparation(config).prepare();

  // Throw an error, a message has already been printed to terminal
  if (files.length === 0) {
    throw new PreparationError(PREPARATION_ERRORS.noImagesError, "No images were found to process");
  }

  return files;
}

async function processImages(config: IConfig, files: IFile[]) {
  const controller = new Controller(config, files);
  return controller.processImages();
}

function logSuccess(logger: Logger) {
  logger.log(
    centreText(
      boxen(chalk.bold.green("SUCCESS"), {
        margin: { top: 1, left: 0, right: 0, bottom: 0 },
        padding: { top: 0, left: 2, right: 2, bottom: 0 },
        borderColor: "greenBright"
      }) + "\n",
      WRAP_WIDTH
    ),
    Logger.VERBOSE
  );
}

function logWarning(logger: Logger) {
  logger.log(
    centreText(
      boxen(chalk.bold.hex("#FF851B")("WARNINGS"), {
        margin: { top: 1, left: 0, right: 0, bottom: 0 },
        padding: { top: 0, left: 2, right: 2, bottom: 0 },
        borderColor: "#FF851B"
      }) + "\n",
      WRAP_WIDTH
    ),
    Logger.VERBOSE
  );
}

function logFailed(logger: Logger) {
  logger.log(
    centreText(
      boxen(chalk.bold.red("FAILED"), {
        margin: { top: 1, left: 0, right: 0, bottom: 0 },
        padding: { top: 0, left: 2, right: 2, bottom: 0 },
        borderColor: "redBright"
      }) + "\n",
      WRAP_WIDTH
    ),
    Logger.VERBOSE
  );
}
