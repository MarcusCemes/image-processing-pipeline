/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createStateContext, State } from "./state";

describe("function createStateContext()", () => {
  const concurrency = 42;
  const manifest = true;
  const clean = false;

  test("creates a state context", () => {
    const ctx = createStateContext(concurrency, manifest, clean);

    expect(ctx.getValue()).toMatchObject<Partial<State>>({
      concurrency,
      manifest,
    });
  });

  test("propagates immutable state updates", () => {
    const ctx = createStateContext(concurrency, manifest, clean);

    // state subscription
    let value = ctx.getValue();
    const lastValue = value;
    ctx.observable.subscribe((newState) => (value = newState));

    // commit a change
    ctx.update((state) => {
      state.concurrency = 1;
      state.manifest = false;
    });

    // updated fields
    expect(value).toMatchObject<State>({
      ...lastValue,
      concurrency: 1,
      manifest: false,
    });

    // immutable
    expect(value).not.toBe(lastValue);
  });
});
