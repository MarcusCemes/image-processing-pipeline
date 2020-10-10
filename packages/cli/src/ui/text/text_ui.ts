/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { cyan, greenBright, redBright, whiteBright } from "chalk";
import { stdout } from "process";
import { Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, map } from "rxjs/operators";
import { REPOSITORY_SHORT, VERSION } from "../../constants";
import { State, StateObservable, Status } from "../../lib/state";
import { UI } from "../ui";

type StateFunction = (observable: StateObservable) => Subscription;

const INTERVAL = 1000;

const concurrency: StateFunction = (obs) =>
  obs
    .pipe(
      map(({ concurrency }) => concurrency),
      distinctUntilChanged()
    )
    .subscribe((value) => {
      line(`> Concurrency change: ${value}`, cyan);
    });

const status: StateFunction = (obs) =>
  obs
    .pipe(
      map(({ status }) => status),
      distinctUntilChanged()
    )
    .subscribe((value) => {
      line(`> Status change: ${parseStatus(value)}`, cyan);
    });

const stats: StateFunction = (obs) =>
  obs
    .pipe(
      map(({ images }) => [images.found, images.completed, images.failed]),
      debounceTime(INTERVAL),
      distinctUntilChanged((p, c) => c.every((v, i) => v === p[i]))
    )
    .subscribe((stats) => {
      line(`| ${stats.map((x) => pad(x)).join(" | ")} |`);
    });

const STATE_FUNCTIONS: StateFunction[] = [concurrency, status, stats];

export const TextUi: UI = (ctx) => {
  line("Image Processing Pipeline", whiteBright);
  line(`${REPOSITORY_SHORT} - v${VERSION}\n`, whiteBright);
  line("| Total | Completed | Failed |");

  const subscriptions = STATE_FUNCTIONS.map((sub) => sub(ctx.state));

  return {
    stop: (state) => {
      for (const sub of subscriptions) sub.unsubscribe();
      printSummary(state);
    },
  };
};

function printSummary(state: State): void {
  [
    "\n -- Summary --\n",
    `Total:     ${whiteBright(pad(state.images.found))}`,
    `Completed: ${greenBright(pad(state.images.completed))}`,
    `Failed:    ${redBright(pad(state.images.failed))}`,
  ].forEach((l) => line(l, whiteBright));
}

function parseStatus(status: Status): string {
  switch (status) {
    case Status.READY:
      return "READY";
    case Status.PROCESSING:
      return "PROCESSING";
    case Status.COMPLETE:
      return "COMPLETE";
    case Status.ERROR:
      return "ERROR";
    case Status.INTERRUPT:
      return "INTERRUPT";
  }
}

function pad(n: number, padding = 3) {
  return n.toString().padStart(padding);
}

function line(text: string, modifier?: (x: string) => string) {
  stdout.write((modifier ? modifier(text) : text) + "\n");
}
