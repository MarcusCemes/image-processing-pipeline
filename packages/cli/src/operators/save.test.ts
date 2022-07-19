/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BaseMetadata, Metadata, MetadataFragment } from "@ipp/common";
import { createHash, randomBytes } from "crypto";
import { Stats } from "fs";
import { PassThrough } from "stream";
import { Exception } from "../../../common/src/exception";
import { createObjectStream } from "../lib/stream/object_stream";
import { saveImages } from "./save";
import { CompletedTask, isCompletedTask, isSavedResult, SavedResult } from "./types";

jest.mock("fs", () => ({
  createReadStream: jest.fn(() => {
    const stream = new PassThrough();
    stream.end();
    return stream;
  }),
  createWriteStream: jest.fn(() => new PassThrough()),
  promises: {
    writeFile: jest.fn(async () => []),
    access: jest.fn(async () => []),
    mkdir: jest.fn(async () => void 0),
    stat: jest.fn(
      async () =>
        <Partial<Stats>>{
          isFile: jest.fn(() => false),
          isDirectory: jest.fn(() => true),
          mtimeMs: 1000,
        }
    ),
  },
}));

async function awaitTaskSource(source: AsyncIterable<Exception | CompletedTask | SavedResult>) {
  const completed: CompletedTask[] = [];
  const saved: SavedResult[] = [];
  const error: Exception[] = [];

  for await (const task of source) {
    if (isCompletedTask(task)) completed.push(task);
    else if (isSavedResult(task)) saved.push(task);
    else if (task instanceof Exception) error.push(task);
  }

  return [completed, saved, error] as const;
}

async function* asyncIterableImageTasks(format: string) {
  const metadata: Metadata = {
    source: fragment("png", "source"),
    current: fragment(format, "current"),
  };

  const source = { buffer: randomBytes(16), metadata };
  const formats = [{ data: { buffer: randomBytes(16), metadata }, saveKey: true }];
  const sequence: CompletedTask[] = [
    {
      file: "test.png",
      result: { source, formats },
      root: "/input/root",
    },
  ];

  for (const item of sequence) yield item;
}

function fragment(format: string, type: string): BaseMetadata & MetadataFragment {
  return {
    name: "file_name",
    channels: 3,
    format,
    hash: hash(type),
    width: 128,
    height: 128,
  };
}

function hash(text: string): string {
  return createHash("md5").update(text).digest().toString("hex");
}

describe("file saving", () => {
  afterEach(() => jest.clearAllMocks());

  test("support the .avif extension", async () => {
    await testSave("avif");
  });

  test("support unknown extensions", async () => {
    await testSave("unknown");
  });

  async function testSave(extension: string) {
    const tasks = asyncIterableImageTasks(extension);
    const stream = createObjectStream(tasks).pipe(saveImages("path/to/output", true));

    const [completed, saved, error] = await awaitTaskSource(stream);

    expect(error).toHaveLength(0);
    expect(completed).toHaveLength(0);
    expect(saved).toHaveLength(1);

    const { savedResult } = saved[0];
    const { metadata } = savedResult.formats[0].data;
    const h = hash("current").substring(0, 8);
    expect(metadata.current.base).toStrictEqual(`file_name-${h}.${extension}`);
  }
});
