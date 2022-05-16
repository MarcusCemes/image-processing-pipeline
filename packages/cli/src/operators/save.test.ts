/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PassThrough } from "stream";
import { Stats } from "fs";
import { CompletedTask, isCompletedTask, isSavedResult, SavedResult } from "./types";
import { saveImages } from "./save";
import { createObjectStream } from "../lib/stream/object_stream";
import { Exception } from "../../../common/src/exception";
import { Metadata, PrimitiveValue } from "@ipp/common";

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

const awaitTaskSource = async (source: AsyncIterable<Exception | CompletedTask | SavedResult>) => {
  const resolved: {
    completed: CompletedTask[];
    saved: SavedResult[];
    error: Exception[];
  } = {
    completed: [],
    error: [],
    saved: [],
  };
  for await (const tsk of source) {
    if (isCompletedTask(tsk)) resolved.completed.push(tsk);
    else if (isSavedResult(tsk)) resolved.saved.push(tsk);
    else if (tsk instanceof Exception) resolved.error.push(tsk);
  }
  return resolved;
};

const asyncIterableImageTasks = async function* (format: string) {
  const metadata: Metadata<Record<string, PrimitiveValue>> = {
    current: {
      name: "test",
      channels: 3,
      format,
      hash: "1337",
      height: 128,
      width: 128,
    },
    source: {
      name: "test",
      channels: 3,
      format: "png",
      hash: "1338",
      height: 128,
      width: 128,
    },
  };

  const sequence: CompletedTask[] = [
    {
      file: "test.png",
      result: {
        source: {
          buffer: Buffer.from("content"),
          metadata,
        },
        formats: [{ data: { buffer: Buffer.from("content"), metadata }, saveKey: true }],
      },
      root: "/input/root",
    },
  ];

  for (const item of sequence) yield item;
};

describe("save.ts", () => {
  afterEach(() => jest.clearAllMocks());

  test("support avif extension in save", async () => {
    const stream = createObjectStream(asyncIterableImageTasks("avif")).pipe(
      saveImages("path/to/output", true)
    );

    const result = await awaitTaskSource(stream);
    expect(result.error).toHaveLength(0);
    expect(result.completed).toHaveLength(0);
    expect(result.saved).toHaveLength(1);

    expect(result.saved[0].savedResult.formats[0].data.metadata.current.base).toStrictEqual(
      "test-1337.avif"
    );
  });

  test("support technically any extension, e.g. heif", async () => {
    const stream = createObjectStream(asyncIterableImageTasks("heif")).pipe(
      saveImages("path/to/output", true)
    );

    const result = await awaitTaskSource(stream);
    expect(result.error).toHaveLength(0);
    expect(result.completed).toHaveLength(0);
    expect(result.saved).toHaveLength(1);

    expect(result.saved[0].savedResult.formats[0].data.metadata.current.base).toStrictEqual(
      "test-1337.heif"
    );
  });
});
