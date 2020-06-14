import { slash } from "./utils";

describe("function slash()", () => {
  test("converts a backslash to forward slash", () => {
    expect(slash("\\")).toBe("/");
  });

  test("slashes Unix paths", () => {
    expect(slash("/some/path/to/something")).toBe("/some/path/to/something");
    expect(slash("\\some\\path\\to\\something")).toBe("/some/path/to/something");
  });

  test("slashes a Windows path", () => {
    expect(slash("C:\\Windows\\")).toBe("C:/Windows/");
  });
});
