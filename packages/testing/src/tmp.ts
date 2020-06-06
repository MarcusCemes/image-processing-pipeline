import { randomBytes } from "crypto";
import { mkdir, rmdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const RANDOM_BYTES_LENGTH = 4;

export async function withTempFile<T>(fn: (file: string) => T): Promise<T> {
  return withTempDir((dir) => fn(join(dir, `tmp-${randomBytes(RANDOM_BYTES_LENGTH).toString("hex")}`)));
}

/** https://advancedweb.hu/secure-tempfiles-in-nodejs-without-dependencies/ */
export async function withTempDir<T>(fn: (dir: string) => T | Promise<T>): Promise<T> {
  const dir = await createTempDir();
  try {
    return await fn(dir);
  } finally {
    await rmdir(dir, { recursive: true });
  }
}

export async function createTempDir(): Promise<string> {
  const dir = join(tmpdir(), `tmp-${randomBytes(RANDOM_BYTES_LENGTH).toString("hex")}`);
  await mkdir(dir);
  return dir;
}
