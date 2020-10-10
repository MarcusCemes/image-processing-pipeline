/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PipelineResult } from "@ipp/common";

export interface TaskSource {
  root: string;
  file: string;
}

export interface CompletedTask extends TaskSource {
  result: PipelineResult;
}

export interface SavedResult {
  savedResult: PipelineResult;
}

export function isTaskSource(x: unknown): x is TaskSource {
  return (
    typeof (x as TaskSource) === "object" &&
    typeof (x as TaskSource).root === "string" &&
    typeof (x as TaskSource).file === "string"
  );
}

export function isCompletedTask(x: unknown): x is CompletedTask {
  return isTaskSource(x) && typeof (x as CompletedTask).result === "object";
}

export function isSavedResult(x: unknown): x is SavedResult {
  return typeof (x as SavedResult).savedResult === "object";
}
