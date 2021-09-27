/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, Pipeline } from "@ipp/common";
import { executePipeline } from "@ipp/core";
import { promises } from "fs";
import { resolve } from "path";
import { pathMetadata } from "../lib/metadata";
import { Operator } from "../lib/stream/object_stream";
import { mapParallel } from "../lib/stream/operators/map_parallel";
import { CompletedTask, isTaskSource, TaskSource } from "./types";

export function processImages<T>(
  pipeline: Pipeline,
  concurrency: number
): Operator<T | TaskSource, T | CompletedTask | Exception> {
  return mapParallel<T | TaskSource, T | CompletedTask | Exception>(concurrency, async (item) => {
    if (!isTaskSource(item)) return item;

    const { fullPath, initialMeta } = generatePaths(item);
    const buffer = await promises.readFile(fullPath);

    try {
      return {
        ...item,
        result: await executePipeline(pipeline, buffer, initialMeta),
      };
    } catch (err) {
      if (err instanceof Exception) return err;
      return new Exception(`Unexpected processing error: ${(err as Error).message}`).extend(
        err as Error
      );
    }
  });
}

function generatePaths(item: TaskSource) {
  const relativePath = item.file;
  const fullPath = resolve(item.root, relativePath);
  const initialMeta = pathMetadata(relativePath);

  return {
    fullPath,
    initialMeta,
  };
}
