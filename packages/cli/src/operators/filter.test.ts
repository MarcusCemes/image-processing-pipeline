/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "../../../common/src/exception";
import { createObjectStream, ObjectStream } from "../lib/stream/object_stream";
import { filterImages } from "./filter";
import { isTaskSource, TaskSource } from "./types";

const imgTask = (iOrFilename: number | string, root = "/root") => ({
  root,
  file: typeof iOrFilename === "number" ? `file-${iOrFilename}.png` : iOrFilename,
});

const awaitAsyncIterable = async (source: AsyncIterable<TaskSource | Exception>) => {
  const resolved: {
    tasks: TaskSource[];
    exceptions: Exception[];
  } = {
    tasks: [],
    exceptions: [],
  };
  for await (const tsk of source) {
    if (isTaskSource(tsk)) resolved.tasks.push(tsk);
    else if (tsk instanceof Exception) resolved.exceptions.push(tsk);
  }
  return resolved;
};

function imageObjectStreams(
  amountOrList: number | string[] = 5
): ObjectStream<TaskSource | Exception> {
  return createObjectStream(imageAsyncGenerator(amountOrList));
}

async function* imageAsyncGenerator(
  amountOrList: number | string[]
): AsyncGenerator<TaskSource | Exception> {
  if (typeof amountOrList === "number") {
    for (let i = 0; i < amountOrList; i++) {
      yield imgTask(i);
    }
  } else {
    for (const name of amountOrList) {
      yield name.startsWith("exception-") ? new Exception(name) : imgTask(name);
    }
  }
}

describe("filter.ts", () => {
  const imageAmount = 10;

  afterEach(() => jest.clearAllMocks());

  test("should pass through images if no filter is supplied", async () => {
    const stream = imageObjectStreams(imageAmount).pipe(filterImages());

    const result = await awaitAsyncIterable(stream);
    expect(result.tasks).toHaveLength(imageAmount);
  });

  test("should filter via RegExp", async () => {
    const stream = imageObjectStreams(imageAmount).pipe(filterImages(/file-[2-4]\.png$/));

    const result = await awaitAsyncIterable(stream);
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks).toStrictEqual([imgTask(2), imgTask(3), imgTask(4)]);
    expect(result.exceptions).toHaveLength(0);
  });

  test("should handle exceptions", async () => {
    const stream = imageObjectStreams([
      "exception-1",
      "file-2.png",
      "file-3.png",
      "file-4.png",
    ]).pipe(filterImages(/file-3\.png$/));

    const result = await awaitAsyncIterable(stream);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks).toStrictEqual([imgTask(3)]);
    expect(result.exceptions).toHaveLength(1);
  });

  test("should filter via multiple RegExp", async () => {
    const stream = imageObjectStreams(imageAmount).pipe(
      filterImages([/file-[2-4]\.png$/, /file-[^3]\.png$/])
    );

    const result = await awaitAsyncIterable(stream);
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks).toStrictEqual([imgTask(2), imgTask(4)]);
  });

  test("should filter via callback", async () => {
    const stream = imageObjectStreams(imageAmount).pipe(filterImages((f) => f.endsWith("4.png")));

    const result = await awaitAsyncIterable(stream);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks).toStrictEqual([imgTask(4)]);
  });

  test("should filter via callback & regexp", async () => {
    const imgList = ["other.gif"]
      .concat([1, 2, 3, 4, 5].map((i) => `file-${i}.png`))
      .concat([1, 2, 3, 4, 5].map((i) => `file-${i}.jpg`));
    const stream = imageObjectStreams(imgList).pipe(
      filterImages([(f) => f.endsWith(".png"), /file-[25]\.png$/])
    );

    const result = await awaitAsyncIterable(stream);
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks).toStrictEqual([imgTask(2), imgTask(5)]);
  });
});
