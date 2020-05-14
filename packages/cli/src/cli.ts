import { Config, ConfigError, ResponsiveImageBuilder } from "@rib/core";
import chalk from "chalk";
import { cosmiconfig } from "cosmiconfig";
import { constants, promises } from "fs";
import { resolve } from "path";
import PrettyError from "pretty-error";
import { options } from "yargs";

import { getVersion } from "./constants";
import { runTerminal } from "./terminal";

const MODULE_NAME = "rib";

class ConfigLoadError extends Error {
  public name = "ConfigLoadError";

  constructor(message?: string) {
    super(message);
  }
}

export async function startCLI() {
  const { argv } = options({
    input: { type: "string", alias: "i", description: "The folder containing source images" },
    output: { type: "string", alias: "o", description: "The folder to output images to" },
    config: { type: "string", alias: "c", description: "The path to the RIB config file" },
    silent: { type: "boolean", alias: "s", description: "Suppress program output" },
  });

  if (!argv.silent) await showBanner();
  const path = argv.config ? resolve(argv.config) : void 0;

  try {
    await loadAndStart(path, argv.input, argv.output, argv.silent);
  } catch (err) {
    if (err instanceof ConfigLoadError) {
      return printConfigLoadError(err);
    } else if (err instanceof ConfigError) {
      return printConfigError(err);
    }
    throw err;
  }
}

async function showBanner() {
  printPadded(
    "\n",
    chalk.bold("Responsive Image Builder"),
    chalk.bold(`Version: ${(await getVersion()) || "<unknown>"}\n`)
  );
}

async function loadAndStart(path?: string, input?: string, output?: string, silent?: boolean) {
  const loadedConfig = await loadConfig(path);

  // Override input and output if specified as flags
  const config: Config = {
    ...loadedConfig,
    options: {
      ...(loadedConfig.options || {}),
      input: input || loadedConfig.options?.input,
      output: output || loadedConfig.options?.output,
    },
  };

  const rib = new ResponsiveImageBuilder(config);
  const observable = rib.run();

  // Wait for the program to finish, and the UI to close
  await Promise.all([
    new Promise((res, rej) => {
      observable.subscribe(() => {}, rej, res);
    }),
    silent ? null : runTerminal(observable),
  ]);

  printPadded(chalk.green("Done"));
}

async function loadConfig(path?: string): Promise<Config> {
  const config: Partial<Config> = {};

  // Attempt to load an explicit configuration file
  if (path) {
    try {
      await promises.access(path, constants.F_OK);
    } catch (err) {
      throw new ConfigLoadError("The provided config path does not exist at:\n  " + path);
    }

    let contents: Buffer;
    try {
      contents = await promises.readFile(path);
    } catch (err) {
      throw new ConfigLoadError("Unable to read the provided config path at:\n  " + path);
    }

    try {
      Object.assign(config, JSON.parse(contents.toString()));
    } catch (err) {
      throw new ConfigLoadError("JSON error: could not understand the file at:\n  " + path);
    }
  } else {
    // Collect configuration keys from well known locations
    const configExporer = cosmiconfig(MODULE_NAME);
    const loadedConfig = (await configExporer.search())?.config as Config;
    if (loadedConfig) Object.assign(config, loadedConfig);
  }

  return config as Config;
}

function printConfigLoadError(error: any) {
  printPadded(
    chalk.bold.red("Configuration Load Error"),
    "Unable to open/read/parse the configuration file.",
    "The following error may help you:\n",
    new PrettyError().render(error)
  );
}

function printConfigError(error: any) {
  printPadded(
    chalk.bold.red("Configuration Load Error"),
    "The configuration file is not valid.",
    "For help, visit the project's documentation on valid configuration.",
    "The following error may help you:\n",
    new PrettyError().render(error)
  );
}

function printPadded(...text: string[]): void {
  for (const item of text) process.stdout.write("  " + item + "\n");
}
