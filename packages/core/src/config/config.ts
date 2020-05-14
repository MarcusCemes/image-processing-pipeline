import Ajv from "ajv";

import schema from "./config.json";
import { cpus } from "os";

export interface Pipe<C> {
  resolve: "string";
  module?: "string";
  options: C;
  pipe: Pipe<any>[];
  save?: "string";
}

export interface Config {
  options: {
    input: string;
    output: string;
    cache: "memory" | "disk";
    concurrency: number;
    manifest: boolean;
    structure: "flat" | "tree";
  };
  pipeline: Pipe<any>[];
}

const DEFAULT_CONFIG: Config = {
  options: {
    input: "",
    output: "",
    concurrency: cpus().length,
    cache: "memory",
    manifest: true,
    structure: "tree",
  },
  pipeline: [],
};

export class ConfigError extends Error {
  public name = "ConfigError";

  constructor(message: string) {
    super(message);
  }
}

export function parseConfig(config: Partial<Config>): Config {
  friendlyParse(config);

  // Perform a rigorous check of the configuration object
  const ajv = new Ajv();
  var valid = ajv.validate(schema, config);
  if (!valid) throw new ConfigError(ajv.errorsText());

  return {
    ...DEFAULT_CONFIG,
    ...config,
    options: {
      ...DEFAULT_CONFIG.options,
      ...(config.options || {}),
    },
  };
}

/** Check for some easy mistakes and supply user-friendly errors */
function friendlyParse(config: Partial<Config> = {}) {
  if (!config.options?.input) throw new ConfigError("No input directory");
  if (!config.options?.output) throw new ConfigError("No output directory");
  if (!config.pipeline) throw new ConfigError("No image processing pipeline");
}
