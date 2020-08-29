/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, PipeException, PipelineException } from "./exception";

describe.each(
  [Exception, PipelineException, PipeException].map<[string, typeof Exception]>((e) => [e.name, e])
)("class %s", (name, constructor) => {
  test("creates a new instance", () => {
    const exception = new constructor("msg");

    expect(exception).toBeInstanceOf(constructor);
    expect(exception).toBeInstanceOf(Error);

    expect(exception.name).toBe(name);
    expect(exception.message).toBe("msg");
  });

  test("Extends a stack", () => {
    const err = new Error();

    [err, err.stack].forEach((stack) => {
      const exception = new constructor("").extend(stack as Error | string);
      expect(exception.stack).toBe(err.stack);
    });
  });
});
