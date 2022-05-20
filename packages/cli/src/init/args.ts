/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from "chalk";
import leven from "leven";
import yargs, { Options } from "yargs";
import { REPOSITORY, VERSION } from "../constants";
import { CliException, CliExceptionCode } from "../lib/exception";

export interface Args {
  input?: string;
  output?: string;
  config?: string;
  text?: boolean;
}

const schema = {
  input: {
    type: "string",
    alias: "i",
    description: "The folder containing source images",
  },

  output: {
    type: "string",
    alias: "o",
    description: "The folder to output images to",
  },

  config: {
    type: "string",
    alias: "c",
    description: "The path to the IPP config file",
  },

  text: {
    type: "boolean",
    description: "Use simple text output",
  },
} as const;

const usage = "Usage: ipp [--config=<pathToConfigFile>]";

/** Parse args using Yargs, check that all flags are valid and return the args */
export async function parseArgs(): Promise<Args> {
  const { argv } = yargs.options(schema).usage(usage).version(VERSION).epilogue(REPOSITORY);
  return argv;
}

/** Check that all flags appear in the options schema */
export function validateArgs(args: Args): void {
  const allowedFlags = getAllowedFlags(schema);

  for (const key of Object.keys(args)) {
    if (key === "_" || key === "$0") continue;

    if (allowedFlags.indexOf(key) !== -1) continue;

    throw new CliException(
      `Unrecognised CLI flag "${key}"`,
      CliExceptionCode.ARG_VALIDATION,
      `Unrecognised CLI flag: "${key}"`,
      `Run ${chalk.bold("ipp --help")} to get a list of allowed parameters` +
        createDidYouMeanMessage(key, allowedFlags)
    );
  }
}

/** Read allowed flags from the options schema */
function getAllowedFlags(schema: Record<string, Options>): string[] {
  const flags: string[] = [];

  for (const [key, options] of Object.entries(schema)) {
    // Add the flag itself
    flags.push(key);

    // Add alias
    if (typeof options.alias === "string") flags.push(options.alias);

    // Also add kebabCase variant, supported by yargs ("a-flag" -> "aFlag")
    if (key.indexOf("-") !== -1) flags.push(kebabToCamelCase(key));
  }

  return flags;
}

export const createDidYouMeanMessage = (unrecognised: string, allowedOptions: string[]): string => {
  const suggestion = allowedOptions.find((option) => {
    const steps: number = leven(option, unrecognised);
    return steps < 3;
  });

  return suggestion ? `\n\nDid you mean ${chalk.bold(suggestion)}?` : "";
};

function kebabToCamelCase(text: string): string {
  return text.replace(/-([a-z])/g, (match) => match[1].toUpperCase());
}
