/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { promises, Stats } from "fs";
import { PassThrough } from "stream";
import { startCli } from "./cli";
import { Config } from "./init/config";
import { CliException } from "./lib/exception";
import { UI } from "./ui";

const config: Config = {
  input: [],
  output: "output",
  concurrency: 4,
  pipeline: [],
};

jest.mock("fs", () => ({
  createReadStream: jest.fn(() => {
    const stream = new PassThrough();
    stream.end();
    return stream;
  }),
  existsSync: () => true,
  createWriteStream: jest.fn(() => new PassThrough()),
  promises: {
    access: jest.fn(async () => undefined),
    readdir: jest.fn(async () => []),
    mkdir: jest.fn(async () => undefined),
    stat: jest.fn(async () => ({ isFile: jest.fn(() => false), isDirectory: jest.fn(() => true) })),
    rm: jest.fn(async () => undefined),
  },
}));

const mockUI: UI = jest.fn(() => ({ stop: jest.fn() }));

describe("function startCLI()", () => {
  afterEach(() => jest.clearAllMocks());

  // try and give the entire CLI a soft dry run
  test("runs", async () => {
    await expect(startCli(config, mockUI)).resolves.toBeUndefined();
  });
});

describe("output cleaning", () => {
  afterEach(() => jest.clearAllMocks());

  const fsAccessMock = promises.access as jest.Mock;
  const fsStatMock = promises.stat as jest.Mock;
  const fsRmMock = promises.rm as jest.Mock;
  const fsMkdirMock = promises.mkdir as jest.Mock;

  test("should not fail if the path does not exist", async () => {
    // Once for removal, once for creation
    fsAccessMock.mockRejectedValueOnce(errorNoent()).mockResolvedValue(undefined);
    fsStatMock.mockRejectedValueOnce(errorNoent()).mockResolvedValue(undefined);

    await expect(startCli({ clean: true, ...config }, mockUI)).resolves.toBeUndefined();

    expect(fsAccessMock).toHaveBeenCalledTimes(1);
    expect(fsStatMock).toHaveBeenCalledTimes(1);
    expect(fsRmMock).not.toHaveBeenCalled();
    expect(fsMkdirMock).toHaveBeenCalledTimes(1);
  });

  test("should throw a CliException if the output is not a directory", async () => {
    fsStatMock.mockResolvedValue(statResult(true)); // Cleaning
    fsAccessMock.mockRejectedValue(errorNoent()); // Creation

    await expect(startCli({ clean: true, ...config }, mockUI)).rejects.toBeInstanceOf(CliException);

    expect(fsStatMock).toHaveBeenCalledTimes(1);
    expect(fsAccessMock).not.toHaveBeenCalled();
    expect(fsRmMock).not.toHaveBeenCalled();
    expect(fsMkdirMock).not.toHaveBeenCalled();
  });
});

function errorNoent(): Error & { code: string } {
  const error = new Error("ENOENT") as Error & { code: string };
  error.code = "ENOENT";
  return error;
}

function statResult(isFile: boolean): Stats {
  return { isFile: () => isFile, isDirectory: () => !isFile } as Stats;
}
