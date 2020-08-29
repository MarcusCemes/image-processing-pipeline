/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { promises } from "fs";
import { repository, version } from "./constants";
import { join } from "path";

describe("constants", () => {
  let packageJson: any;

  beforeAll(async () => {
    packageJson = JSON.parse(
      (await promises.readFile(join(__dirname, "../package.json"))).toString()
    );
  });

  test("version matches package.json", () => {
    expect(version).toBe(packageJson.version);
  });

  test("repository matches package.json", () => {
    expect(repository).toBe(packageJson.repository?.url || packageJson.repository);
  });
});
