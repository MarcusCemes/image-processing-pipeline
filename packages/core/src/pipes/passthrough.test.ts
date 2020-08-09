/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataObject, sampleMetadata } from "@ipp/common";
import { randomBytes } from "crypto";
import { PassthroughPipe } from "./passthrough";

describe("built-in PassthroughPipe", () => {
  const data: DataObject = {
    buffer: randomBytes(8),
    metadata: sampleMetadata(256, "jpeg"),
  };

  test("passes through data untouched", async () => {
    const result = PassthroughPipe(data);
    await expect(result).resolves.toMatchObject(data);
  });
});
