/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { checkOptions, Options } from "./options";

describe("function checkOptions()", () => {
  test("validates a simple pipeline", () => {
    expect(checkOptions({ pipeline: [] })).toBeTruthy();
  });

  test("accepts more complex options", () => {
    const options: Options = {
      name: "test",
      outputPath: "path",
      devBuild: true,
      regExp: /regex/,
      context: "some_context",
      pipeline: [],
      manifest: { source: {}, format: {} },
    };
    expect(checkOptions(options)).toMatchObject(options);
  });

  test("requires a pipeline", () => {
    expect(() => checkOptions({})).toThrow(/Invalid config/);
  });
});
