import { randomBytes } from "crypto";
import { promises } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const { mkdir, rmdir } = promises;

const RANDOM_BYTES_LENGTH = 4;

export interface TemporaryDir {
  path: string;
  destroy: () => Promise<void>;
}

/** Creates a temporary file */
export async function withTempFile<T>(fn: (file: string) => T): Promise<T> {
  return withTempDir((dir) => fn(join(dir, `tmp-${randomBytes(RANDOM_BYTES_LENGTH).toString("hex")}`)));
}

/** https://advancedweb.hu/secure-tempfiles-in-nodejs-without-dependencies/ */
export async function withTempDir<T>(fn: (dir: string) => T | Promise<T>): Promise<T> {
  const dir = await createTempDir();
  try {
    return await fn(dir.path);
  } finally {
    await dir.destroy();
  }
}

/** Creates a temporary directory with a clean-up function */
export async function createTempDir(): Promise<TemporaryDir> {
  const path = join(tmpdir(), `tmp-${randomBytes(RANDOM_BYTES_LENGTH).toString("hex")}`);
  await mkdir(path);

  return {
    path,
    destroy: () => rmdir(path, { recursive: true }),
  };
}
