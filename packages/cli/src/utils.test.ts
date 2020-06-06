import { getVersion, formatError, printPadded } from "./utils";

test("reads version", async () => {
  expect(typeof (await getVersion())).toBe("string");
});

test("formats an error", async () => {
  expect(typeof formatError(new Error("Test"))).toBe("string");
});

test("prints padded", () => {
  const spy = jest.spyOn(process.stdout, "write").mockImplementation();
  printPadded("Print this", "padded");
  expect(spy).toHaveBeenCalledTimes(2);
  spy.mockRestore();
});
