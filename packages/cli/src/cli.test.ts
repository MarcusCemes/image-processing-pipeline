import { withTempDir } from "@rib/testing";
import { writeFile } from "fs/promises";
import { join } from "path";

import { startCLI } from "./cli";

describe("function startCLI()", () => {
  const stdout = process.stdout.write;
  const stderr = process.stdout.write;
  const mock = jest.fn().mockImplementation(() => true);

  jest.setTimeout(30000);

  beforeAll(() => {
    process.stdout.write = mock;
    process.stderr.write = mock;
  });

  afterEach(() => {
    mock.mockClear();
  });

  afterAll(() => {
    process.stdout.write = stdout;
    process.stderr.write = stderr;
  });

  test("should not throw", () =>
    withTempDir(async (dir) => {
      const configPath = join(dir, "config.json");
      await writeFile(configPath, "{}");

      const oldArgv = process.argv;
      process.argv = oldArgv.slice();
      process.argv.push("-c", `${configPath}`);

      await expect(startCLI()).resolves.toBeUndefined();
      expect(mock).toHaveBeenCalled();

      process.argv = oldArgv;
    }));
});
