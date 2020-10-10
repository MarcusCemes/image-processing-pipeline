/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@ipp/common";
import { CliContext } from "../cli";
import { State } from "../lib/state";
import { Operator } from "../lib/stream/object_stream";
import { map } from "../lib/stream/operators/map";
import { isCompletedTask, isTaskSource } from "./types";

function createCounter(
  fn: (item: any) => boolean,
  key: keyof State["images"]
): <T>(ctx: CliContext) => Operator<T, T> {
  return (ctx) =>
    map((item) => {
      if (fn(item)) ctx.state.update((state) => ++state.images[key]);
      return item;
    });
}

export const sourceCounter = createCounter(isTaskSource, "found");
export const completedCounter = createCounter(isCompletedTask, "completed");
export const exceptionCounter = createCounter(
  (x: unknown): x is Exception => (x as Exception) instanceof Exception,
  "failed"
);
