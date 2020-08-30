/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IppError } from "./error";

describe("class IppError", () => {
  test("is an instance of Error", () => {
    expect(new IppError()).toBeInstanceOf(Error);
  });

  test("accepts a message", () => {
    expect(new IppError("abc")).toHaveProperty("message", "abc");
  });

  test("has the correct name", () => {
    expect(new IppError()).toHaveProperty("name", "IppError");
  });
});
