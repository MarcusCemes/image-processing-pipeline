import boxen from "boxen";
import chalk from "chalk";

import { IConfig } from "./Config";
import { Controller } from "./Controller";
import { IResult, PreparationError } from "./Interfaces";
import { Logger } from "./Logger";
import { IFile, Preparation } from "./Preparation";

export async function main(config: IConfig): Promise<IResult> {
  const logger = new Logger(config.verbosity);
  try {
    // Display the program banner
    showBanner(logger);

    // Check for the required dependencies
    // Search for images files to process
    const files = await prepare(config);

    const converted = await process(config, files);

    if (converted.failed.length === 0) {
      logger.log(
        boxen(chalk.bold.green("SUCCESS"), {
          margin: { top: 1, left: 0, right: 0, bottom: 0 },
          padding: { top: 0, left: 2, right: 2, bottom: 0 },
          borderColor: "greenBright"
        }),
        16,
        Logger.VERBOSE
      );
    } else {
      logger.log(
        boxen(chalk.bold.hex("#FF851B")("WARNINGS"), {
          margin: { top: 1, left: 0, right: 0, bottom: 0 },
          padding: { top: 0, left: 2, right: 2, bottom: 0 },
          borderColor: "#FF851B"
        }),
        16,
        Logger.VERBOSE
      );
    }

    // Return the final program state
    return {
      success: true,
      exports: converted.completed
    };
  } catch (err) {
    logger.log(
      boxen(chalk.bold.red("FAILED"), {
        margin: { top: 1, left: 0, right: 0, bottom: 0 },
        padding: { top: 0, left: 2, right: 2, bottom: 0 },
        borderColor: "redBright"
      }),
      16,
      Logger.VERBOSE
    );
    throw err;
  }
}

function showBanner(logger: Logger) {
  logger.log(
    chalk.bold.white(`
   ______   _____ _______
  (, /   ) (, /  (, /    )
    /__ /    /     /---(
 ) /   \\____/__ ) / ____)
(_/    (__ /   (_/ (`) + "\n\n  A WebP build pipeline\n  https://git.io/fjvL7\n",
    8,
    Logger.VERBOSE
  );
}

async function prepare(config: IConfig): Promise<IFile[]> {
  // Run the preparation. This may throw a PreparationError
  const files = await new Preparation(config).prepare();

  // If there are no files to process, the program may terminate
  if (files.length === 0) {
    throw new PreparationError("No files to process", "No images were found to process");
  }

  return files;
}

async function process(config: IConfig, files: IFile[]) {
  const controller = new Controller(config, files);
  return controller.process();
}
