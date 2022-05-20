/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { randomBytes } from "crypto";
import { ippLoader, raw } from "./loader";
import * as optionsModule from "./options";
import * as runtimeModule from "./runtime";

describe("function ippLoader()", () => {
  const source = randomBytes(8);

  let callbackCalled = Promise.resolve();
  const callback = jest.fn();

  const checkOptionsSpy = jest
    .spyOn(optionsModule, "checkOptions")
    .mockImplementation((o) => o as any);

  const runtimeSpy = jest
    .spyOn(runtimeModule, "runtime")
    .mockImplementation(async () => ({ __runtimeExport: true } as any));

  const ctx = {
    async: jest.fn(() => callback),
    cacheable: jest.fn(),
    getOptions: jest.fn(() => ({})),
  };

  beforeEach(() => {
    callbackCalled = new Promise((res) => {
      callback.mockImplementation(() => res());
    });
  });
  afterEach(() => jest.clearAllMocks());
  afterAll(() => jest.restoreAllMocks());

  test("requests raw content", () => {
    expect(raw).toBe(true);
  });

  test("requests async", async () => {
    ippLoader.bind(ctx as any)(source as any, undefined);
    await callbackCalled;

    expect(ctx.async).toHaveBeenCalled();
  });

  test("requests cacheable", async () => {
    ippLoader.bind(ctx as any)(source as any, undefined);
    await callbackCalled;

    expect(ctx.cacheable).toHaveBeenCalledWith(true);
  });

  test("gets and checks options", async () => {
    ippLoader.bind(ctx as any)(source as any, undefined);
    await callbackCalled;

    expect(ctx.getOptions).toHaveBeenCalled();
    expect(checkOptionsSpy).toHaveBeenCalled();
  });

  test("fails if no callback", async () => {
    ctx.async.mockImplementationOnce(() => undefined as any);
    expect(() => ippLoader.bind(ctx as any)(source as any, undefined)).toThrow("callback");
  });

  test("returns data with the callback", async () => {
    ippLoader.bind(ctx as any)(source as any, undefined);
    await callbackCalled;

    expect(callback).toHaveBeenCalledWith(
      null,
      `module.exports = {"__runtimeExport":true};\n`,
      undefined
    );
  });

  // The loader throws synchronously
  test("expects a raw buffer output", () => {
    expect(() => ippLoader.bind(ctx as any)(source.toString(), void 0)).toThrowError(/buffer/);
  });

  test("supports ES module exports", async () => {
    ctx.getOptions.mockReturnValue({ esModule: true });

    ippLoader.bind(ctx as any)(source as any, undefined);
    await callbackCalled;

    expect(callback).toHaveBeenCalledWith(
      null,
      `export default {"__runtimeExport":true};\n`,
      undefined
    );
  });

  test("catches runtime errors", async () => {
    const error = new Error("__testError");
    runtimeSpy.mockRejectedValueOnce(error);

    ippLoader.bind(ctx as any)(source as any, undefined);
    await callbackCalled;

    expect(callback).toHaveBeenLastCalledWith(error);
  });
});
