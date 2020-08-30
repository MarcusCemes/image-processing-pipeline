/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { randomBytes } from "crypto";
import loaderUtils from "loader-utils";
import { ippLoader, raw } from "./loader";
import * as optionsModule from "./options";
import * as runtimeModule from "./runtime";

describe("function ippLoader()", () => {
  const source = randomBytes(8);

  let callbackCalled = Promise.resolve();
  const callback = jest.fn();
  const getOptionsSpy = jest.spyOn(loaderUtils, "getOptions");
  const checkOptionsSpy = jest
    .spyOn(optionsModule, "checkOptions")
    .mockImplementation((o) => o as any);
  const runtimeSpy = jest
    .spyOn(runtimeModule, "runtime")
    .mockImplementation(async () => ({ __runtimeExport: true } as any));

  const ctx = {
    async: jest.fn(() => callback),
    cacheable: jest.fn(),
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
    ippLoader.bind(ctx)(source, void 0);
    await callbackCalled;

    expect(ctx.async).toHaveBeenCalled();
  });

  test("requests cacheable", async () => {
    ippLoader.bind(ctx)(source, void 0);
    await callbackCalled;

    expect(ctx.cacheable).toHaveBeenCalledWith(true);
  });

  test("gets and checks options", async () => {
    ippLoader.bind(ctx)(source, void 0);
    await callbackCalled;

    expect(getOptionsSpy).toHaveBeenCalled();
    expect(checkOptionsSpy).toHaveBeenCalled();
  });

  test("fails if no callback", async () => {
    ctx.async.mockImplementationOnce(() => void 0 as any);
    expect(() => ippLoader.bind(ctx)(source, void 0)).toThrow("callback");
  });

  test("returns data with the callback", async () => {
    ippLoader.bind(ctx)(source, void 0);
    await callbackCalled;

    expect(callback).toHaveBeenCalledWith(
      null,
      `module.exports = {"__runtimeExport":true};\n`,
      void 0
    );
  });

  // The loader throws synchronously
  test("expects a raw buffer output", () => {
    expect(() => ippLoader.bind(ctx)(source.toString(), void 0)).toThrowError(/buffer/);
  });

  test("catches runtime errors", async () => {
    const error = new Error("__testError");
    runtimeSpy.mockRejectedValueOnce(error);

    ippLoader.bind(ctx)(source, void 0);
    await callbackCalled;

    expect(callback).toHaveBeenLastCalledWith(error);
  });
});
