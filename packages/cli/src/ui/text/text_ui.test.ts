/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { stdout } from "process";
import { BehaviorSubject } from "rxjs";
import { State, Status } from "../../lib/state";
import { UiContext } from "../ui";
import { TextUi } from "./text_ui";

describe("TextUI", () => {
  test("creates a UI", async () => {
    const stdoutSpy = jest.spyOn(stdout, "write").mockImplementation(() => true);

    const state: State = {
      concurrency: 16,
      manifest: true,
      images: {
        found: 0,
        completed: 0,
        failed: 0,
      },
      status: Status.READY,
    };

    const subject = new BehaviorSubject(state);
    const ctx: UiContext = { version: "1.0.0", state: subject.asObservable() };

    const ui = TextUi(ctx);

    expect(subject.observers.length).toBeGreaterThan(0);
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("Image Processing Pipeline"));

    await ui.stop(state);

    stdoutSpy.mockRestore();
  });
});
