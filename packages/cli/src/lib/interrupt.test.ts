/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { randomBytes } from "crypto";
import { createInterruptHandler, InterruptException } from "./interrupt";

describe("class InterruptException()", () => {
  test("can be instantiated", () => {
    const message = randomBytes(8).toString("hex");
    const ex = new InterruptException(message);

    expect(ex).toBeInstanceOf(InterruptException);
    expect(ex.name).toBe(InterruptException.name);
    expect(ex.message).toBe(message);
  });
});

describe("function createInterruptHandler()", () => {
  test("creates an interrupt handler", () => {
    const handler = createInterruptHandler();

    expect(typeof handler.rejecter.then).toBe("function");
    expect(typeof handler.destroy).toBe("function");

    handler.destroy();
  });

  test("catches an interrupt signal", async () => {
    const emergencyHandler = jest.fn();
    process.on("SIGINT", emergencyHandler);

    const handler = createInterruptHandler();

    process.emit("SIGINT");

    await expect(handler.rejecter).rejects.toBeInstanceOf(InterruptException);
    expect(emergencyHandler).toHaveBeenCalledTimes(1);

    handler.destroy();
    process.off("SIGINT", emergencyHandler);
  });

  test("catches multiple interrupt signals", async () => {
    const emergencyHandler = jest.fn();
    process.on("SIGINT", emergencyHandler);

    const handler = createInterruptHandler();

    const COUNT = 3;

    for (let i = 0; i < COUNT; ++i) {
      process.emit("SIGINT");
    }

    await expect(handler.rejecter).rejects.toBeInstanceOf(InterruptException);
    expect(emergencyHandler).toHaveBeenCalledTimes(COUNT);

    handler.destroy();
    process.off("SIGINT", emergencyHandler);
  });

  test("unregisters the interrupt handler", () => {
    const handlerCount = process.listenerCount("SIGINT");

    const handler = createInterruptHandler();

    expect(process.listenerCount("SIGINT")).toBe(handlerCount + 1);

    handler.destroy();
    expect(process.listenerCount("SIGINT")).toBe(handlerCount);
  });
});

// test("should create an interrupt promise", async () => {
//   const { promise } = createInterruptHandler();

//   const expectation = expect(promise).rejects.toBeInstanceOf(InterruptException);
//   process.emit("SIGINT" as any);
//   await expectation;
// });

// test("should destroy an interrupt promise", async () => {
//   const { promise, destroy } = createInterruptHandler();

//   const expectation = expect(promise).resolves.toBeUndefined();
//   destroy();
//   await expectation;
// });
