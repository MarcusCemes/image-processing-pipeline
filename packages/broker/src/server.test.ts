import { randomBytes } from "crypto";
import { promises } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { Broker, createBroker } from "./server";

const { mkdir, readFile, rmdir, writeFile } = promises;

const pngPixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABBQECz6AuzQAAAABJRU5ErkJggg==",
  "base64"
);

let broker: Broker;

beforeAll(async () => {
  broker = await createBroker({ concurrency: 1 });
});

afterAll(async () => {
  await broker.stop();
});

test("creates a broker", async () => {
  expect(typeof broker.execute).toBe("function");
  expect(typeof broker.stop).toBe("function");
});

test("handles jobs", async () => {
  const testingDir = join(tmpdir(), "ipp-" + randomBytes(8).toString("hex"));
  const input = join(testingDir, "input");

  try {
    await mkdir(testingDir);
    await writeFile(input, pngPixel);

    const result = await broker.execute(input, testingDir, [
      {
        pipe: "passthrough",
        save: "output",
      },
    ]);

    expect(result).toHaveLength(1);

    const { file, metadata } = result[0];
    expect(file).toBeTruthy();
    expect(typeof file).toBe("string");

    expect(typeof metadata).toBe("object");
    expect(metadata.width).toBe(1);

    const resultingFile = await readFile(join(testingDir, "output"));
    expect(resultingFile.equals(pngPixel)).toBe(true);
  } finally {
    await rmdir(testingDir, { recursive: true }).catch(() => {
      /* */
    });
  }
});

test("handles errors", async () => {
  const testingDir = join(tmpdir(), "ipp-" + randomBytes(8).toString("hex"));
  const input = join(testingDir, "input");

  try {
    await mkdir(testingDir);
    await writeFile(input, pngPixel);

    const result = broker.execute(input, testingDir, [
      {
        pipe: randomBytes(8).toString("hex"),
        save: "output",
      },
    ]);

    await expect(result).rejects.toBeInstanceOf(Error);
  } finally {
    await rmdir(testingDir, { recursive: true }).catch(() => {
      /* */
    });
  }
});
