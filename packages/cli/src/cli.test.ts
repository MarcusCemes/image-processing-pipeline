/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PassThrough } from "stream";
import { startCli } from "./cli";
import { Config } from "./init/config";
import { UI } from "./ui";
import fs from "fs";
import { CliException } from "./lib/exception";

jest.mock("fs", () => ({
  createReadStream: jest.fn(() => {
    const stream = new PassThrough();
    stream.end();
    return stream;
  }),
  existsSync: () => true,
  createWriteStream: jest.fn(() => new PassThrough()),
  promises: {
    readdir: jest.fn(async () => []),
    mkdir: jest.fn(async () => void 0),
    stat: jest.fn(async () => ({ isFile: jest.fn(() => false), isDirectory: jest.fn(() => true) })),
    rm: jest.fn(async () => void 0),
    access: jest.fn(async () => void 0),
  },
}));

const mockUI: UI = jest.fn(() => ({ stop: jest.fn() }));

describe("function startCLI()", () => {
  const config: Config = {
    input: "",
    output: "",
    concurrency: 4,
    pipeline: [],
  };

  afterEach(() => jest.clearAllMocks());

  test("runs", async () => {
    await expect(startCli(config, mockUI)).resolves.toBeUndefined();
  });

  test("should continue if 'config.clean = true' but output dir does not exist", async () => {
    (fs.promises.access as jest.Mock)
      .mockRejectedValueOnce(() => new Error("nope for cleanup"))
      .mockRejectedValueOnce(() => new Error("nope for creation"));
    (fs.promises.rm as jest.Mock).mockRejectedValueOnce(
      () => new Error("ENOENT: no such file or directory")
    );
    await expect(startCli({ clean: true, ...config }, mockUI)).resolves.toBeUndefined();
    expect(fs.promises.access).toHaveBeenCalledTimes(2); // called once by clean and once by ensure it exists
    expect(fs.promises.rm).toHaveBeenCalledTimes(0);
    expect(fs.promises.mkdir).toHaveBeenCalledTimes(1);
  });

  test("should prevent if 'config.clean = true' but output is not a directory", async () => {
    (fs.promises.stat as jest.Mock).mockResolvedValueOnce({
      isFile: jest.fn(() => true),
      isDirectory: jest.fn(() => false),
    } as unknown as fs.Stats);
    await expect(startCli({ clean: true, ...config }, mockUI)).rejects.toBeInstanceOf(CliException);
    expect(fs.promises.stat).toHaveBeenCalledTimes(1);
    expect(fs.promises.access).toHaveBeenCalledTimes(1);
    expect(fs.promises.rm).toHaveBeenCalledTimes(0);
    expect(fs.promises.mkdir).toHaveBeenCalledTimes(0);
  });
});
