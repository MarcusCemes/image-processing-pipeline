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

jest.mock("fs", () => ({
  createReadStream: jest.fn(() => {
    const stream = new PassThrough();
    stream.end();
    return stream;
  }),
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
