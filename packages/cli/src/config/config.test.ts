import { randomBytes } from "crypto";
import { tmpdir } from "os";
import { join } from "path";

import { ConfigException, ConfigLoadException, loadConfig, parseConfig } from "./config";

test("should export ConfigException class", () => {
  const message = randomBytes(8).toString("hex");
  const ex = new ConfigException(message);

  expect(ex).toBeInstanceOf(ConfigException);
  expect(ex.name).toBe(ConfigException.name);
  expect(ex.message).toBe(message);
});

test("should export ConfigLoadException class", () => {
  const message = randomBytes(8).toString("hex");
  const ex = new ConfigLoadException(message);

  expect(ex).toBeInstanceOf(ConfigLoadException);
  expect(ex.name).toBe(ConfigLoadException.name);
  expect(ex.message).toBe(message);
});

test("should load configuration", async () => {
  await expect(loadConfig()).resolves.toBeTruthy();
  await expect(loadConfig(join(tmpdir(), randomBytes(4).toString("hex")))).rejects.toBeInstanceOf(ConfigLoadException);
});

test("should parse configuration", () => {
  expect(() => parseConfig({})).toThrowError(ConfigException);
  expect(() => parseConfig({ output: tmpdir(), pipeline: [] })).toThrowError(ConfigException);

  expect(typeof parseConfig({ input: tmpdir(), output: tmpdir(), pipeline: [] })).toBe("object");
});
