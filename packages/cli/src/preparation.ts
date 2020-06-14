import { Exception } from "@ipp/common";
import { constants, promises, Stats } from "fs";

import { Config, parseConfig } from "./config";
import { DeepPartial } from "./utils";

export class PreparationException extends Exception {
  public name = "PreparationException";

  constructor(message?: string, stack?: string) {
    super(message, stack);
  }
}

export async function runPreparation(config: DeepPartial<Config>): Promise<Config> {
  const parsedConfig = parseConfig(config);
  await Promise.all([checkInputPath(parsedConfig.input), checkOutputPath(parsedConfig.output)]);
  return parsedConfig;
}

async function checkInputPath(path: string | string[]): Promise<void> {
  const paths = typeof path === "string" ? [path] : path;
  for (const resolvedPath of paths) {
    try {
      await promises.access(resolvedPath, constants.R_OK);
    } catch {
      throw new PreparationException("Input path does not exist, or you do not have permission to view it");
    }

    const stat = await promises.stat(resolvedPath);
    if (!stat.isDirectory) throw new PreparationException("Input path is not a directory");
  }
}

async function checkOutputPath(path: string): Promise<void> {
  let stat: Stats;
  try {
    await promises.access(path, constants.W_OK);
    stat = await promises.stat(path);
  } catch {
    throw new PreparationException("Output path does not exist, or you do not have permission to write to it");
  }

  if (!stat.isDirectory) throw new PreparationException("Output path is not a directory");
}
