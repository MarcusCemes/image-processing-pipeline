/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createContext } from "./context";
import * as interrupt from "./interrupt";
import * as state from "./state";

describe("function createContext()", () => {
  test("creates a context", () => {
    const concurrency = 16;
    const manifest = true;
    const version = "1.0.0";
    const clean = false;

    const interruptSpy = jest.spyOn(interrupt, "createInterruptHandler");
    const stateSpy = jest.spyOn(state, "createStateContext");
    const ui = jest.fn(() => ({ stop: () => void 0 }));

    const ctx = createContext(concurrency, manifest, clean, version, ui);

    // Check the interrupt handler was created
    expect(interruptSpy).toHaveBeenCalled();
    expect(ctx.interrupt).toBe(interruptSpy.mock.results[0].value);

    // Check the state was created
    expect(stateSpy).toHaveBeenCalledWith<Parameters<typeof state.createStateContext>>(
      concurrency,
      manifest,
      clean
    );
    expect(ctx.interrupt).toBe(interruptSpy.mock.results[0].value);

    // Check the UI was created
    expect(ui).toHaveBeenCalled();
    expect(ctx.ui).toBe(ui.mock.results[0].value);
  });
});
