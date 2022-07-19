/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ManifestMappings, Pipeline, PipelineSchema } from "@ipp/common";
import Ajv, { ErrorObject } from "ajv";
import chalk from "chalk";
import { cosmiconfig } from "cosmiconfig";
import { CliException, CliExceptionCode } from "../lib/exception";
import { ExceptionFn } from "../operators/exceptions";
import configSchema from "../schema/config.json";
import defaultConfig from "./default_config.json";

const MODULE_NAME = "ipp";

export interface Config {
  input: string | string[];
  output: string;
  pipeline: Pipeline;

  concurrency: number;
  clean?: boolean;
  flat?: boolean;
  manifest?: ManifestMappings;
  /** Suppress the output of any image processing errors. */
  suppressErrors?: boolean;
  /**
   * Specify a different filename to output processing errors to
   * (in JSON format), or a callback function that receives the
   * exception as its first parameter.
   */
  errorOutput?: string | ExceptionFn;
}

export async function getConfig(initial: Partial<Config>, path?: string): Promise<Config> {
  const config = await loadConfig(path);
  return validateConfig({ ...config, ...initial });
}

/** Attempts to load a config from a path, or by looking in well known locations */
async function loadConfig(path?: string): Promise<Partial<Config>> {
  try {
    const configExplorer = cosmiconfig(MODULE_NAME);
    const explorerResult = await (path ? configExplorer.load(path) : configExplorer.search());

    if (!explorerResult?.config) {
      return defaultConfig;
    }

    return explorerResult.config;
  } catch (err) {
    throw new CliException(
      "Configuration load failure",
      CliExceptionCode.CONFIG_LOAD,
      `Configuration load error -> ${(err as Error).name}`,
      (err as Error).message
    ).extend(err as Error);
  }
}

/** Validate the configuration  */
function validateConfig(config: Partial<Config>): Config {
  friendlyParse(config);

  const filteredConfig = { ...config };

  const ajv = new Ajv({ allErrors: true });
  ajv.addSchema(PipelineSchema);

  const valid = ajv.validate(configSchema, filteredConfig);

  if (!valid)
    throw new CliException(
      "Invalid config",
      CliExceptionCode.CONFIG_PARSE,
      "Configuration validation failed",
      ajv.errors?.map(parseAjvError).join("\n")
    );

  return filteredConfig as Config;
}

/** Check for some easy mistakes and supply user-friendly errors */
function friendlyParse(config: Partial<Config> = {}): void {
  const errors = [] as string[];

  const criteria: [any, string][] = [
    [config.input, "An input directory containing images must be specified"],
    [config.output, "An output directory for generated formats must be specified"],
    [config.pipeline, "A processing pipeline must be specified"],
  ];

  for (const [key, message] of criteria) {
    if (!key) errors.push(message);
  }

  if (errors.length > 0)
    throw new CliException(
      "Invalid configuration",
      CliExceptionCode.CONFIG_PARSE,
      "Invalid configuration",
      errors.join("\n") + `\n\n${chalk.white("Did you create a configuration file?")}`
    );
}

/** Friendlier hints as to why the validation faled */
function parseAjvError({ keyword, message, params, instancePath }: ErrorObject): string {
  const property = chalk.bold(`Config${instancePath}`);

  switch (keyword) {
    case "additionalProperties":
      return `${property} has an unknown property "${chalk.bold(params.additionalProperty)}"`;

    case "required":
      return `${property} is missing property "${chalk.bold(params.missingProperty)}"`;

    default:
      return `${property} ${message}`;
  }
}
