/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { F_OK } from "constants";
import { promises } from "fs";
import { dirname } from "path";

import { withTempDir, withTempFile } from "./tmp";

const { access } = promises;

describe("temporary directory utilities", () => {
  test("creates a temporary file", async () => {
    expect.assertions(3);

    const dir = await withTempFile(async (file) => {
      const dir = dirname(file);

      expect(typeof file).toBe("string");
      await expect(access(dir, F_OK)).resolves.toBeUndefined();

      return dir;
    });

    await expect(access(dir, F_OK)).rejects.toBeTruthy();
  });

  test("creates a temporary directory", async () => {
    expect.assertions(2);

    let tmpDir = "";

    await withTempDir(async (dir) => {
      tmpDir = dir;
      await expect(access(dir, F_OK)).resolves.toBeUndefined();
    });

    await expect(access(tmpDir, F_OK)).rejects.toBeTruthy();
  });
});
