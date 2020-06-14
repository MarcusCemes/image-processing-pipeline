import { Exception, Pipeline } from "@ipp/common";
import Ajv from "ajv";
import { cosmiconfig } from "cosmiconfig";
import deepmerge from "deepmerge";
import { cpus } from "os";

import { DeepPartial } from "../utils";
import schema from "./schema.json";

/** The name to use when searching for configs in well-known locations */
const MODULE_NAME = "ipp";

export interface Config {
  input: string | string[];
  output: string;
  options: {
    concurrency: number;
    flat: boolean;
    manifest: boolean;
  };
  manifest: {
    source: { [key: string]: string };
    format: { [key: string]: string };
  };
  pipeline: Pipeline[];
}

const DEFAULT_CONFIG: Partial<Config> = {
  options: {
    concurrency: cpus().length,
    flat: false,
    manifest: false,
  },
  manifest: {
    source: {},
    format: {},
  },
};

export class ConfigException extends Exception {
  public name = "ConfigException";

  constructor(message?: string, stack?: string) {
    super(message, stack);
  }
}

export class ConfigLoadException extends Exception {
  public name = "ConfigLoadException";

  constructor(message?: string, stack?: string) {
    super(message, stack);
  }
}

/** Attempts to load a config from a path, or by looking in well known locations */
export async function loadConfig(path?: string): Promise<DeepPartial<Config>> {
  try {
    const configExplorer = cosmiconfig(MODULE_NAME);
    const explorerResult = await (path ? configExplorer.load(path) : configExplorer.search());

    return explorerResult?.config || {};
  } catch (err) {
    throw new ConfigLoadException(`${err.name}: ${err.message}`, err.stack);
  }
}

export function parseConfig(config: DeepPartial<Config>): Config {
  const completeConfig: Config = deepmerge(DEFAULT_CONFIG, config);

  friendlyParse(completeConfig);

  // Perform a rigorous check of the configuration object
  const ajv = new Ajv();
  const valid = ajv.validate(schema, completeConfig);
  if (!valid) throw new ConfigException(ajv.errorsText());

  return completeConfig;
}

/** Check for some easy mistakes and supply user-friendly errors */
function friendlyParse(config: Partial<Config> = {}): void {
  if (!config.input) throw new ConfigException("No input directory");
  if (!config.output) throw new ConfigException("No output directory");
  if (!config.pipeline) throw new ConfigException("No image processing pipeline");
}
