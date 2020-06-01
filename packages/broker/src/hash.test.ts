import { hashBuffer } from "./hash";

test("exports a hash function", () => {
  const hash1 = hashBuffer(Buffer.from(Math.random().toString()));
  const hash2 = hashBuffer(Buffer.from(Math.random().toString() + "0"));
  expect(hash1).toBeTruthy();
  expect(typeof hash1).toBe("string");

  expect(hash1).not.toBe(hash2);
});
