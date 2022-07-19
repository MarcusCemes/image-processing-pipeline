/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@ipp/common";
import { createWriteStream, promises, Stats } from "fs";
import { resolve } from "path";
import { PassThrough } from "stream";
import { startCli } from "./cli";
import { Config } from "./init/config";
import { CliException } from "./lib/exception";
import { createObjectStream } from "./lib/stream/object_stream";
import { searchForImages } from "./operators/search";
import { UI } from "./ui";

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

jest.mock("./operators/search", () => ({
  searchForImages: jest.fn(jest.requireActual("./operators/search").searchForImages),
}));

const mockUI: UI = jest.fn(() => ({ stop: jest.fn() }));

/** Run the CLI function with a custom config. */
function runWith(partial?: Partial<Config>): Promise<void> {
  return startCli(config(partial), mockUI);
}

function config(config?: Partial<Config>): Config {
  return {
    input: [],
    output: "output",
    concurrency: 4,
    pipeline: [],
    ...(config || {}),
  };
}

/** Helper function that generates an async iterator of exceptions. */
async function* exceptionGenerator(count: number): AsyncGenerator<Exception> {
  for (let i = 0; i < count; ++i) {
    yield new Exception(`Exception ${i}`);
  }
}

describe("function startCLI()", () => {
  afterEach(() => jest.clearAllMocks());

  // try and give the entire CLI a soft dry run
  test("runs", async () => {
    const result = runWith();
    await expect(result).resolves.toBeUndefined();
  });
});

describe("CLI error handling", () => {
  const searchImagesMock = searchForImages as jest.Mock;
  const fsCreateWriteStreamMock = createWriteStream as jest.Mock;

  beforeEach(() => {
    searchImagesMock.mockReturnValueOnce(createObjectStream(exceptionGenerator(3)));
  });

  afterEach(() => {
    jest.clearAllMocks();
    searchImagesMock.mockRestore();
  });

  test("writes exceptions to errors.json", async () => {
    const result = runWith(config());
    await expect(result).resolves.toBeUndefined();

    const expectedPath = resolve("output", "errors.json");
    expect(fsCreateWriteStreamMock).toHaveBeenCalledWith(expectedPath);
  });

  test("writes to a custom error location", async () => {
    const errorOutput = "custom_file.json";

    const result = runWith(config({ errorOutput }));
    await expect(result).resolves.toBeUndefined();

    const expectedPath = resolve("output", errorOutput);
    expect(fsCreateWriteStreamMock).toHaveBeenCalledWith(expectedPath);
  });

  test("suppresses errors", async () => {
    const result = runWith(config({ suppressErrors: true }));
    await expect(result).resolves.toBeUndefined();

    expect(fsCreateWriteStreamMock).not.toHaveBeenCalled();
  });

  test("supports error callback", async () => {
    const errorOutput = jest.fn();

    const result = runWith(config({ errorOutput }));
    await expect(result).resolves.toBeUndefined();

    expect(fsCreateWriteStreamMock).not.toHaveBeenCalled();
    expect(errorOutput).toHaveBeenCalledTimes(3);
  });
});

describe("output cleaning", () => {
  const searchImagesMock = searchForImages as jest.Mock;
  const fsAccessMock = promises.access as jest.Mock;
  const fsStatMock = promises.stat as jest.Mock;
  const fsRmMock = promises.rm as jest.Mock;
  const fsMkdirMock = promises.mkdir as jest.Mock;

  beforeEach(() => {
    searchImagesMock.mockImplementation(jest.requireActual("./operators/search").searchForImages);
  });

  afterEach(() => jest.clearAllMocks());

  test("should not fail if the path does not exist", async () => {
    // Once for removal, once for creation
    fsAccessMock.mockRejectedValueOnce(errorNoent()).mockResolvedValue(undefined);
    fsStatMock.mockRejectedValueOnce(errorNoent()).mockResolvedValue(undefined);

    const result = runWith({ clean: true });
    await expect(result).resolves.toBeUndefined();

    expect(fsAccessMock).toHaveBeenCalledTimes(1);
    expect(fsStatMock).toHaveBeenCalledTimes(1);
    expect(fsRmMock).not.toHaveBeenCalled();
    expect(fsMkdirMock).toHaveBeenCalledTimes(1);
  });

  test("should throw a CliException if the output is not a directory", async () => {
    fsStatMock.mockResolvedValue(statResult(true)); // Cleaning
    fsAccessMock.mockRejectedValue(errorNoent()); // Creation

    const result = runWith({ clean: true });
    await expect(result).rejects.toBeInstanceOf(CliException);

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
