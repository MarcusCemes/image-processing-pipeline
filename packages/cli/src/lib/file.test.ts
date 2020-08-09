/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { promises, Stats } from "fs";
import { getStats, isDirectory } from "./file";

describe("async filesystem utilities functions", () => {
  const path = "/path/to/dir/";

  let spy: jest.SpyInstance<Promise<Stats>>;

  beforeAll(() => (spy = jest.spyOn(promises, "stat")));
  afterEach(() => jest.clearAllMocks());
  afterAll(() => spy.mockRestore());

  test("returns if path is directory", async () => {
    expect.assertions(2);

    let isDirResult: boolean;
    const stats = { isDirectory: () => isDirResult } as Stats;
    spy.mockImplementation(async () => stats);

    isDirResult = true;
    await expect(isDirectory(path)).resolves.toBe(isDirResult);

    isDirResult = false;
    await expect(isDirectory(path)).resolves.toBe(isDirResult);
  });

  test("returns path stats", async () => {
    const stats = {} as Stats;

    spy.mockImplementationOnce(async () => stats);
    await expect(getStats(path)).resolves.toBe(stats);
  });
});
