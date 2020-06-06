import { slash } from "./utils";

test("exports slash function", () => {
  expect(slash("\\")).toBe("/");
  expect(slash("\\some\\path\\to\\something")).toBe("/some/path/to/something");
  expect(slash("C:\\Windows\\")).toBe("C:/Windows/");
});
