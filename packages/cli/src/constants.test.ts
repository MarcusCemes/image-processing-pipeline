/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { promises } from "fs";
import { join } from "path";
import { REPOSITORY, VERSION } from "./constants";

describe("constants", () => {
  let packageJson: any;

  beforeAll(async () => {
    packageJson = JSON.parse(
      (await promises.readFile(join(__dirname, "../package.json"))).toString()
    );
  });

  test("version matches package.json", () => {
    expect(VERSION).toBe(packageJson.version);
  });

  test("repository matches package.json", () => {
    expect(REPOSITORY).toBe(packageJson.repository?.url || packageJson.repository);
  });
});
