import { constants, promises, Stats } from "fs";

export class PreparationError extends Error {
  public name = "PreparationError";

  constructor(message?: string) {
    super(message);
  }
}

export async function testPaths(input: string, output: string): Promise<string | null> {
  try {
    await Promise.all([checkInputPath(input), checkOutputPath(output)]);
    return null;
  } catch (err) {
    return String(err);
  }
}

async function checkInputPath(path: string) {
  let stat: Stats;
  try {
    await promises.access(path, constants.R_OK);
    stat = await promises.stat(path);
  } catch {
    throw new PreparationError("Input path does not exist, or you do not have permission to view it");
  }

  if (!stat.isDirectory) throw new PreparationError("Input path is not a directory");
}

async function checkOutputPath(path: string) {
  let stat: Stats;
  try {
    await promises.access(path, constants.W_OK);
    stat = await promises.stat(path);
  } catch {
    throw new PreparationError("Output path does not exist, or you do not have permission to write to it");
  }

  if (!stat.isDirectory) throw new PreparationError("Output path is not a directory");
}
