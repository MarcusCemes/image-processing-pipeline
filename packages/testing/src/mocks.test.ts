/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { chainMock } from "./mocks";

describe("function chainMock()", () => {
  test("returns a similar object", () => {
    const obj = chainMock({ data: 42 });

    expect(obj).toHaveProperty("data", 42);
  });

  test("handles recursive calls", () => {
    const obj = chainMock({ data: 42 });

    expect(obj).toHaveProperty("data", 42);
    expect(obj.someFn()).toHaveProperty("data", 42);
    expect(obj.someFn().anyOtherFn()).toHaveProperty("data", 42);
  });
});
