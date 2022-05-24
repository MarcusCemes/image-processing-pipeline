/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@ipp/common";
import { PassThrough } from "stream";
import { startCli } from "./cli";
import { Config } from "./init/config";
import { createObjectStream } from "./lib/stream/object_stream";
import { TaskSource } from "./operators/types";
import { UI } from "./ui";
import fs from "fs";
import { resolve } from "path";

async function* exceptionList(amount = 3): AsyncGenerator<TaskSource | Exception> {
  for (let i = 0; i < amount; i++) {
    yield new Exception("Exception " + i);
  }
}

jest.mock("./operators/search", () => ({
  searchForImages: jest.fn(() => {
    return createObjectStream(exceptionList());
  }),
}));

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
});

describe("function startCLI() with custom errorFile", () => {
  const config: Config = {
    input: "",
    output: "",
    concurrency: 4,
    pipeline: [],
  };

  afterEach(() => jest.clearAllMocks());

  test("errorFile with default path", async () => {
    await expect(startCli(config, mockUI)).resolves.toBeUndefined();
    expect(fs.createWriteStream).toHaveBeenCalledWith(resolve(".", "errors.json"));
  });

  test("errorFile with custom path", async () => {
    const errorFile = "custom/path/error.json";
    await expect(startCli({ errorFile, ...config }, mockUI)).resolves.toBeUndefined();
    expect(fs.createWriteStream).toHaveBeenCalledWith(resolve(".", errorFile));
  });

  test("errorFile disabled", async () => {
    const errorFile = false;
    await expect(startCli({ errorFile, ...config }, mockUI)).resolves.toBeUndefined();
    expect(fs.createWriteStream).toHaveBeenCalledTimes(0);
  });

  test("errorFile with custom callback function", async () => {
    const errorFile = jest.fn();
    await expect(startCli({ errorFile, ...config }, mockUI)).resolves.toBeUndefined();
    expect(fs.createWriteStream).toHaveBeenCalledTimes(0);
    expect(errorFile).toHaveBeenCalledTimes(3);
  });
});
