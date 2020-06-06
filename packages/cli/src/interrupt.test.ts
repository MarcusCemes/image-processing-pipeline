import { randomBytes } from "crypto";

import { createInterrupt, InterruptException } from "./interrupt";

test("should export InterruptException", () => {
  const message = randomBytes(8).toString("hex");
  const ex = new InterruptException(message);

  expect(ex).toBeInstanceOf(InterruptException);
  expect(ex.name).toBe(InterruptException.name);
  expect(ex.message).toBe(message);
});

test("should create an interrupt promise", async () => {
  const { promise } = createInterrupt();

  const expectation = expect(promise).rejects.toBeInstanceOf(InterruptException);
  process.emit("SIGINT" as any);
  await expectation;
});

test("should destroy an interrupt promise", async () => {
  const { promise, destroy } = createInterrupt();

  const expectation = expect(promise).resolves.toBeUndefined();
  destroy();
  await expectation;
});
