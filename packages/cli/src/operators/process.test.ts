/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PassThrough } from "stream";
import { Stats } from "fs";
import { CompletedTask, isCompletedTask, isSavedResult, SavedResult } from "./types";
import { createObjectStream } from "../lib/stream/object_stream";
import { Exception } from "../../../common/src/exception";
import { Metadata, PrimitiveValue, sampleMetadata } from "@ipp/common";
import { processImages } from "./process";

// mock sharp (the complicated way)
jest.mock("../../../core/node_modules/sharp", () => {
  const mockSharp = () => ({
    metadata: jest.fn(() => ({ width: 128, height: 128, channels: 3, format: "png" })),
  });
  mockSharp.concurrency = jest.fn(() => 1);
  return mockSharp;
});

jest.mock("fs", () => ({
  createReadStream: jest.fn(() => {
    const stream = new PassThrough();
    stream.end();
    return stream;
  }),
  createWriteStream: jest.fn(() => new PassThrough()),
  existsSync: jest.fn(() => true),
  promises: {
    readFile: jest.fn(async () => Buffer.from("content")),
    access: jest.fn(async () => []),
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
const asyncIterableImageTasks = async function* (amount = 1) {
  const metadata: Metadata<Record<string, PrimitiveValue>> = sampleMetadata(128, "png");
  for (let i = 0; i < amount; i++) {
    yield {
      file: `test-${i}.png`,
      result: {
        source: {
          buffer: Buffer.from("content"),
          metadata,
        },
        formats: [{ data: { buffer: Buffer.from("content"), metadata }, saveKey: true }],
      },
      root: "/input/root",
    };
  }
};

const JestTestPipe = jest.fn(async (data) => data);
const JestTestThenPipe = jest.fn(async (data) => data);

describe("process.ts", () => {
  afterEach(() => jest.clearAllMocks());

  test("should not process images if 'test = false'", async () => {
    const stream = createObjectStream(asyncIterableImageTasks()).pipe(
      processImages(
        [
          {
            pipe: JestTestPipe,
            test: false,
          },
        ],
        1
      )
    );

    const result = await awaitTaskSource(stream);
    expect(JestTestPipe).toHaveBeenCalledTimes(0);
    expect(result.completed).toHaveLength(1);
  });

  test("should process images if 'test = undefined' (default behavior)", async () => {
    const stream = createObjectStream(asyncIterableImageTasks()).pipe(
      processImages(
        [
          {
            pipe: JestTestPipe,
          },
        ],
        1
      )
    );

    const result = await awaitTaskSource(stream);
    expect(JestTestPipe).toHaveBeenCalledTimes(1);
    expect(result.completed).toHaveLength(1);
  });

  test("should process images if 'test = true'", async () => {
    const stream = createObjectStream(asyncIterableImageTasks()).pipe(
      processImages(
        [
          {
            pipe: JestTestPipe,
            test: true,
          },
        ],
        1
      )
    );

    const result = await awaitTaskSource(stream);
    expect(JestTestPipe).toHaveBeenCalledTimes(1);
    expect(result.completed).toHaveLength(1);
  });

  test("should process images if 'test = callback' returns truthy", async () => {
    const testCallback = jest.fn((path) => {
      return path === "test-1.png" || path === "test-3.png";
    });
    const stream = createObjectStream(asyncIterableImageTasks(5)).pipe(
      processImages(
        [
          {
            pipe: JestTestPipe,
            test: testCallback,
          },
        ],
        1
      )
    );

    const result = await awaitTaskSource(stream);
    expect(testCallback).toHaveBeenCalledTimes(5);
    expect(JestTestPipe).toHaveBeenCalledTimes(2);
    expect(JestTestPipe.mock.calls[0][0].metadata.source.path).toStrictEqual("test-1.png");
    expect(JestTestPipe.mock.calls[1][0].metadata.source.path).toStrictEqual("test-3.png");
    expect(result.completed).toHaveLength(5);
  });

  test("should process images if 'test = callback' returns truthy", async () => {
    const testCallback = jest.fn((path) => {
      return path === "test-1.png" || path === "test-3.png";
    });
    const stream = createObjectStream(asyncIterableImageTasks(5)).pipe(
      processImages(
        [
          {
            pipe: JestTestPipe,
            test: testCallback,
          },
        ],
        1
      )
    );

    await awaitTaskSource(stream);
    expect(testCallback).toHaveBeenCalledTimes(5);
    expect(JestTestPipe).toHaveBeenCalledTimes(2);
    expect(JestTestPipe.mock.calls[0][0].metadata.source.path).toStrictEqual("test-1.png");
    expect(JestTestPipe.mock.calls[1][0].metadata.source.path).toStrictEqual("test-3.png");
  });

  test("should process images if 'test = <path>' equals path of file", async () => {
    const stream = createObjectStream(asyncIterableImageTasks(5)).pipe(
      processImages(
        [
          {
            pipe: JestTestPipe,
            test: "test-2.png",
          },
        ],
        1
      )
    );

    await awaitTaskSource(stream);
    expect(JestTestPipe).toHaveBeenCalledTimes(1);
    expect(JestTestPipe.mock.calls[0][0].metadata.source.path).toStrictEqual("test-2.png");
  });

  test("should process images if 'test = /RegExp/' returns truthy", async () => {
    const stream = createObjectStream(asyncIterableImageTasks(5)).pipe(
      processImages(
        [
          {
            pipe: JestTestPipe,
            test: /test-[3|4]\.png/,
          },
        ],
        1
      )
    );

    await awaitTaskSource(stream);
    expect(JestTestPipe).toHaveBeenCalledTimes(2);
    expect(JestTestPipe.mock.calls[0][0].metadata.source.path).toStrictEqual("test-3.png");
    expect(JestTestPipe.mock.calls[1][0].metadata.source.path).toStrictEqual("test-4.png");
  });

  test("should process images if all test rules return truthy", async () => {
    const testCallback = jest.fn((path) => {
      return path === "test-4.png";
    });
    const stream = createObjectStream(asyncIterableImageTasks(5)).pipe(
      processImages(
        [
          {
            pipe: JestTestPipe,
            test: [/test-[3|4]\.png/, testCallback],
          },
        ],
        1
      )
    );

    await awaitTaskSource(stream);
    expect(testCallback).toHaveBeenCalledTimes(2);
    expect(JestTestPipe).toHaveBeenCalledTimes(1);
    expect(JestTestPipe.mock.calls[0][0].metadata.source.path).toStrictEqual("test-4.png");
  });

  test("should process pipeline.then only if test passes", async () => {
    const testCallback = jest.fn((path) => {
      return path.includes("test-4");
    });
    const stream = createObjectStream(asyncIterableImageTasks(5)).pipe(
      processImages(
        [
          {
            pipe: JestTestPipe,
            test: /test-[2-4]\.png/,
            then: [
              {
                pipe: JestTestThenPipe,
                test: testCallback,
              },
            ],
          },
        ],
        1
      )
    );

    await awaitTaskSource(stream);
    expect(JestTestPipe).toHaveBeenCalledTimes(3);
    expect(testCallback).toHaveBeenCalledTimes(3);
    expect(JestTestThenPipe).toHaveBeenCalledTimes(1);
  });

  test("should process complex pipeline tree properly", async () => {
    const testCallback1 = jest.fn((path) => /test-[1-2]\.png/.test(path));
    const testThenCallback1 = jest.fn(() => true);
    const testCallback2 = jest.fn((path) => /test-[3-4]\.png/.test(path));
    const testThenCallback2 = jest.fn((path) => path.startsWith("test-3"));
    const stream = createObjectStream(asyncIterableImageTasks(5)).pipe(
      processImages(
        [
          {
            pipe: JestTestPipe,
            test: testCallback1,
            then: [
              {
                pipe: JestTestThenPipe,
                test: testThenCallback1,
              },
            ],
          },
          {
            pipe: JestTestPipe,
            test: testCallback2,
            then: [
              {
                pipe: JestTestThenPipe,
                test: testThenCallback2,
              },
            ],
          },
        ],
        1
      )
    );

    await awaitTaskSource(stream);
    expect(testCallback1).toHaveBeenCalledTimes(5); // 0,1,2,3
    expect(testCallback2).toHaveBeenCalledTimes(5); // 0,1,2,3
    expect(JestTestPipe).toHaveBeenCalledTimes(4); // 1,2 | 3,4

    expect(testThenCallback1).toHaveBeenCalledTimes(2); // 1,2
    expect(testThenCallback2).toHaveBeenCalledTimes(2); // 3,4
    expect(JestTestThenPipe).toHaveBeenCalledTimes(3); // 1,2 | 3
  });
});
