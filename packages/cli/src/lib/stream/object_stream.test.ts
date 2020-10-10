/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createObjectStream } from "./object_stream";

const testSize = 64;

describe("ObjectStream", () => {
  const sequence = new Array(testSize).fill(null).map((_, i) => i);
  const asyncIterableSequence = async function* () {
    for (const item of sequence) yield item;
  };

  const verifyStream = async (source: AsyncIterable<number>) => {
    const results: number[] = [];
    for await (const item of source) results.push(item);

    expect(sequence.sort()).toEqual(results.sort());
  };

  test("is iterable", async () => {
    const stream = createObjectStream(asyncIterableSequence());
    await verifyStream(stream);
  });

  test("uses the pipe function", async () => {
    const object = {};
    const stream = createObjectStream(asyncIterableSequence()).pipe(() => object);
    expect(stream).toBe(object);
  });

  test("correctly supports the map operator", async () => {
    const identityFn: <T>(x: T) => T = (x) => x;
    const stream = createObjectStream(asyncIterableSequence()).pipe(identityFn);
    await verifyStream(stream);
  });
});
