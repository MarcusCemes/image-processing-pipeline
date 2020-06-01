import { randomBytes } from "crypto";
import { mkdir, readFile, rmdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { Config } from "./config";
import { saveManifest } from "./manifest";

test("should save the manifest the preparation", async () => {
  const tmpDir = join(tmpdir(), "rib-" + randomBytes(4).toString("hex"));

  const config: Config = {
    input: tmpDir,
    output: tmpDir,
    options: {
      concurrency: 1,
      flat: false,
      manifest: true,
    },
    manifest: {
      source: {
        x: "hash",
      },
      format: {
        w: "width",
        h: "height",
      },
    },
    pipeline: [],
  };

  await mkdir(tmpDir, { recursive: true });

  try {
    const sourcePath = randomBytes(4).toString("hex");
    const formatPath = randomBytes(4).toString("hex");
    const hash = randomBytes(4).toString("hex");

    expect(
      saveManifest(config, [
        {
          source: join(tmpDir, sourcePath),
          formats: [
            { file: join(tmpDir, formatPath), metadata: { width: 1, height: 1, channels: 3, format: "raw", hash } },
          ],
        },
      ])
    ).resolves.toBeUndefined();

    const manifest = JSON.parse((await readFile(join(tmpDir, "manifest.json"))).toString("utf-8"));

    expect(Array.isArray(manifest)).toBe(true);
    expect(manifest).toHaveLength(1);

    const [item] = manifest;

    expect(item).toHaveProperty("p", sourcePath);
    expect(item).toHaveProperty("m.x", hash);

    expect(Array.isArray(item.f));
    const [format] = item.f;

    expect(format).toHaveProperty("p", formatPath);
    expect(format).toHaveProperty("m.w", 1);
    expect(format).toHaveProperty("m.h", 1);
  } finally {
    await rmdir(tmpDir, { recursive: true });
  }
});
