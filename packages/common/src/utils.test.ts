/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from "./metadata";
import { sampleMetadata } from "./utils";

describe("function sampleMetadata()", () => {
  test("generates some sample metadata", () => {
    expect(sampleMetadata(256, "jpeg")).toMatchObject<Metadata>({
      current: {
        width: 256,
        height: 256,
        channels: 3,
        format: "jpeg",
        hash: expect.any(String),
      },
      source: {
        height: 256,
        width: 256,
        channels: 3,
        format: "jpeg",
        hash: expect.any(String),
      },
    });
  });
});
