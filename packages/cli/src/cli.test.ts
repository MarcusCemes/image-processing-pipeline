/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@ipp/common";
import fs from "fs";
import { resolve } from "path";
import { PassThrough } from "stream";
import { startCli } from "./cli";
import { Config } from "./init/config";
import { createObjectStream } from "./lib/stream/object_stream";
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
    readdir: jest.fn(async () => []),
    mkdir: jest.fn(async () => void 0),
    stat: jest.fn(async () => ({ isFile: jest.fn(() => false), isDirectory: jest.fn(() => true) })),
  },
}));

jest.mock("./operators/search", () => ({
  searchForImages: jest.fn(() => createObjectStream(exceptionGenerator(3))),
}));

const mockUI: UI = jest.fn(() => ({ stop: jest.fn() }));

function config(config?: Partial<Config>): Config {
  return {
    input: "",
    output: "",
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

/** Run the CLI function with a custom config. */
async function runWith(config: Config): Promise<void> {
  await expect(startCli(config, mockUI)).resolves.toBeUndefined();
}

describe("function startCLI()", () => {
  afterEach(() => jest.clearAllMocks());

  test("runs", async () => {
    await runWith(config());
  });
});

describe("CLI error handling", () => {
  afterEach(() => jest.clearAllMocks());

  test("writes exceptions to errors.json", async () => {
    await runWith(config());
    expect(fs.createWriteStream).toHaveBeenCalledWith(resolve(".", "errors.json"));
  });

  test("writes to a custom error location", async () => {
    const errorOutput = "custom_file.json";
    await runWith(config({ errorOutput }));
    expect(fs.createWriteStream).toHaveBeenCalledWith(resolve(".", errorOutput));
  });

  test("suppresses errors", async () => {
    await runWith(config({ suppressErrors: true }));
    expect(fs.createWriteStream).not.toHaveBeenCalled();
  });

  test("supports error callback", async () => {
    const errorOutput = jest.fn();
    await runWith(config({ errorOutput }));
    expect(fs.createWriteStream).not.toHaveBeenCalled();
    expect(errorOutput).toHaveBeenCalledTimes(3);
  });
});
