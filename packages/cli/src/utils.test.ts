import { getVersion, formatError, printPadded } from "./utils";

const SEMVER = /[0-9]+\.[0-9]+\.[0-9]+/;

describe("utility functions", () => {
  test("function getVersion()", async () => {
    await expect(getVersion()).resolves.toMatch(SEMVER);
  });

  test("function formatError()", async () => {
    expect(typeof formatError(new Error("Test"))).toBe("string");
  });

  test("function printPadded()", () => {
    const spy = jest.spyOn(process.stdout, "write").mockImplementation();
    printPadded("Print this", "padded");
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
