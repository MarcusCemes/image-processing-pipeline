/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { stdout } from "process";
import { Observable } from "rxjs";
import { distinctUntilChanged, last, throttleTime } from "rxjs/operators";
import { Stage, State } from "~/model/state";
import { UI } from "../ui";

const INTERVAL = 1000;

function write(text: string) {
  stdout.write(text);
}

function progressUpdate(total: number, completed: number, failed: number): void {
  const text = [
    total.toString().padStart(4),
    completed.toString().padStart(4),
    failed.toString().padStart(4),
  ].join(" | ");

  write(`| ${text} |\n`);
}

export const TextUi: UI = (ctx) => {
  write(`Image Processing Pipeline\nVersion ${ctx.version}\nConcurrency: ${ctx.concurrency}\n\n`);

  const unsubscribe = textUpdates(ctx.state);

  return {
    stop: unsubscribe,
  };
};

function textUpdates(observable: Observable<State>): () => void {
  write("| Total | Completed | Failed |\n");

  const progress = observable.pipe(throttleTime(INTERVAL)).subscribe((update) => {
    if (update.stage === Stage.PROCESSING) {
      const { completed, failed, total } = update.stats.images;

      progressUpdate(total, completed, failed);
    }
  });

  const stage = observable
    .pipe(distinctUntilChanged((a, b) => a.stage === b.stage))
    .subscribe((state) => {
      const { stage } = state;

      let statusText = `Execution stage updated to ${stage}`;

      switch (stage) {
        case Stage.INIT:
          statusText = "";
          break;

        case Stage.PROCESSING:
          statusText = "Processing";
          break;

        case Stage.DONE:
          statusText = "Complete";
          break;

        case Stage.ERROR:
          statusText = "Error";
          if (state.message) {
            statusText += "\n" + state.message;
          }
          break;

        case Stage.INTERRUPT:
          statusText = "Interrupt";
          break;
      }

      if (statusText) {
        write(` -- ${statusText} --\n`);
      }
    });

  const summary = observable.pipe(last()).subscribe((state) => {
    progress.unsubscribe();

    const { failed, completed } = state.stats.images;

    write(`Processed ${completed} images\n`);

    if (failed > 0) {
      write(`${failed} images failed to process, see errors.json\n`);
    }
  });

  return () => {
    progress.unsubscribe();
    stage.unsubscribe();
    summary.unsubscribe();
  };
}
