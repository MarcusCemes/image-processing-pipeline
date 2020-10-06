/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, Pipeline } from "@ipp/common";
import { executePipeline } from "@ipp/core";
import { promises } from "fs";
import { parse, resolve } from "path";
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
      return new Exception(`Unexpected processing error: ${err.message}`).extend(err);
    }
  });
}

function generatePaths(item: TaskSource) {
  const relativePath = item.file;
  const parsedPath = parse(relativePath);

  const fullPath = resolve(item.root, relativePath);

  const initialMeta = {
    base: parsedPath.base,
    ext: parsedPath.ext,
    dir: parsedPath.dir,
    name: parsedPath.name,
    path: relativePath,
  };

  return {
    fullPath,
    initialMeta,
  };
}

// type Source = { root: string; file: string };
// export type ProcessResult = Source & { result: PipelineResult };

// const TASK_ID = "image_process";

// export function processImages(
//   ctx: CliContext,
//   pipeline: Pipeline,
//   concurrency: number,
//   results: AsyncIterable<SearchResult | Exception>
// ): AsyncIterable<ProcessResult | Exception> {
//   let started = false;
//   const task = ctx.state.tasks.add(TASK_ID, Status.WAITING, "Process images");

//   const source = (async function* () {
//     for await (const result of results) {
//       if (result instanceof Exception) {
//         yield result;
//         continue;
//       }

//       const files = typeof result.files !== "undefined" ? result.files : [""];

//       for (const file of files) {
//         // End the stream of files
//         if (ctx.interrupt.rejected()) {
//           task.update(Status.ERROR, "Processing interrupted");
//           return;
//         }

//         yield { root: result.root, file };
//       }
//     }

//     task.update(Status.COMPLETE, "Processed images");
//   })();

//   return unorderedParallelMap<ProcessResult | Exception, Source | Exception>(
//     source,
//     concurrency,
//     async (item) => {
//       if (started !== true) {
//         task.update(Status.PENDING, "Processing images");
//         started = true;
//       }

//       if (item instanceof Exception) {
//         return item;
//       }

//       try {
//         const buffer = await promises.readFile(item.root + item.file);
//         const { base, ext, dir, name } = parse(item.file);

//         const result = await executePipeline(pipeline, buffer, {
//           base,
//           ext,
//           dir,
//           name,
//           path: item.file,
//         });

//         return { ...item, result };
//       } catch (err) {
//         if (isExceptionType<PipelineException>(err, PipelineException)) return err;
//         throw err;
//       }
//     }
//   );
// }

// /** A fuzzy instanceof that uses the unique exception name, survives serialisation */
// function isExceptionType<T extends Exception>(x: unknown, exception: { name: string }): x is T {
//   return (x as T).name === exception.name;
// }
