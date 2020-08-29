/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { pad, prettifyError } from "./utils";

describe("function prettifyError()", () => {
  test("prettifies an error", () => {
    const error = new Error("I'm an error");
    const prettyError = prettifyError(error);

    expect(prettyError).toMatch("I'm an error");
  });
});

describe("function pad()", () => {
  test("pads a string", () => {
    const text = "lorem";
    expect(pad(text)).toBe(`  ${text}`);
    expect(pad(text, 2)).toBe(`  ${text}`);
    expect(pad(text, 4)).toBe(`    ${text}`);
  });

  test("pads multiple lines", () => {
    const text = "lorem\nipsum";
    expect(pad(text)).toBe(`  lorem\n  ipsum`);
  });
});
