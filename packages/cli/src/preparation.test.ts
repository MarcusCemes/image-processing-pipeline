import { randomBytes } from "crypto";
import { mkdir, rmdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { PreparationException, runPreparation } from "./preparation";

test("should export PreparationException", () => {
  const message = randomBytes(8).toString("hex");
  const ex = new PreparationException(message);

  expect(ex).toBeInstanceOf(PreparationException);
  expect(ex.name).toBe(PreparationException.name);
  expect(ex.message).toBe(message);
});

test("should run the preparation", async () => {
  const tmpDir = join(tmpdir(), "ipp-" + randomBytes(4).toString("hex"));
  const inputDir = join(tmpDir, "input");
  const outputDir = join(tmpDir, "output");

  const config = {
    input: inputDir,
    output: outputDir,
    pipeline: [],
  };

  await mkdir(tmpDir, { recursive: true });

  try {
    await mkdir(inputDir);
    await mkdir(outputDir);

    const preparation = await runPreparation(config);
    expect(typeof preparation).toBe("object");
    expect(preparation).toMatchObject(config);
  } finally {
    await rmdir(tmpDir, { recursive: true });
  }
});
