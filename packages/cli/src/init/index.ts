/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { grey, red } from "chalk";
import { Config } from "cosmiconfig/dist/types";
import { stdout } from "process";
import { startCli } from "../cli";
import { REPOSITORY_SHORT } from "../constants";
import { CliException } from "../lib/exception";
import { BULLET, pad, prettifyError } from "../lib/utils";
import { TextUi } from "../ui";
import { Args, parseArgs, validateArgs } from "./args";
import { getConfig } from "./config";

export async function init(concurrency: number): Promise<void> {
  try {
    const { args, config } = await load(concurrency);

    const ui = args.text ? TextUi : void 0;

    await startCli(config, ui);
  } catch (err) {
    stdout.write(err instanceof Array ? err.map(formatError).join("") : formatError(err as Error));
    stdout.write("\n" + pad(grey("Learn more at " + REPOSITORY_SHORT)) + "\n\n");
    process.exitCode = 1;
  }
}

/** Parses CLI flags and loads the configuration */
async function load(concurrency: number): Promise<{ args: Args; config: Config }> {
  const args = await parseArgs();
  validateArgs(args);

  const initialConfig: Partial<Config> = {
    concurrency,
  };

  if (args.input) initialConfig.input = args.input;
  if (args.output) initialConfig.output = args.output;

  const config = await getConfig(initialConfig, args.config);

  return { args, config };
}

function formatError(err: Error): string {
  if (err instanceof CliException) {
    const { title, comment } = err as CliException;

    const heading = "\n" + red.bold(`${BULLET} ${title ? title : "CLI Exception"}`) + "\n\n";
    const body = comment ? pad(red(comment)) + "\n\n" : "";

    return pad(heading + body);
  }

  const error =
    red(err instanceof Error ? prettifyError(err) : "A non-Error like object was thrown") + "\n";
  const message =
    "This should not have happened.\nIf you feel that this was in error, consider opening a new issue\n";

  return pad(error + message);
}
