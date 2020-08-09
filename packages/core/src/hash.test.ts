/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { hash } from "./hash";
import { randomBytes } from "crypto";

describe("function hash()", () => {
  test("computes a hash", () => {
    const result = hash(randomBytes(8));
    expect(typeof result).toBe("string");
    expect(result).toHaveLength(32);
  });

  test("computes hashes correctly", () => {
    const data1a = randomBytes(256);
    const data1b = Buffer.from(data1a);
    const data2 = randomBytes(256);

    const hash1a = hash(data1a);
    const hash1b = hash(data1b);
    const hash2 = hash(data2);

    expect(hash1a).toBe(hash1b);
    expect(hash1a).not.toBe(hash2);
  });
});
