/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Denque from "denque";
import { promises } from "fs";
import { parse, posix } from "path";
import { Exception } from "@ipp/common";
import { CliContext } from "../cli";
import { Status } from "../model/state";
import { CliException, CliExceptionCode } from "./exception";
import { InterruptException } from "./interrupt";

const INTERVAL = 200;
const TASK_ID = "image_search";

const SUPPORTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "tiff", "gif", "svg"];

export interface SearchResult {
  root: string;
  files?: string[];
}

export function searchImages(
  ctx: CliContext,
  paths: string[]
): AsyncIterable<SearchResult | Exception> {
  const task = ctx.state.tasks.add(TASK_ID, Status.PENDING, "Searching for images");

  let count = 0;
  let active = true;

  const interval = setInterval(() => {
    ctx.state.update((state) => {
      const task = state.tasks.find((task) => task.id === TASK_ID);
      if (task) {
        task.text = `Found ${count} images`;
      }

      state.stats.images.total = count;
    });
  }, INTERVAL);

  const stop = () => {
    if (active) {
      active = false;
      clearInterval(interval);
      task.update(Status.COMPLETE, `Found ${count} images`);
    }
  };

  ctx.interrupt.rejecter.catch(() => stop());

  const source = (async function* () {
    const increment = () => ++count;

    for (const path of paths) {
      const pathResults = searchPath(path, increment);
      for await (const result of pathResults) {
        yield result;

        if (ctx.interrupt.rejected()) return;
      }
    }
  })();

  return (async function* () {
    for await (const result of source) {
      yield result;
    }

    stop();
  })();
}

async function* searchPath(
  path: string,
  increment: () => void
): AsyncIterable<SearchResult | Exception> {
  try {
    const stat = await promises.stat(path);

    if (stat.isFile()) {
      yield {
        root: path,
      };
    }

    if (stat.isDirectory()) {
      const normalisedPath = posix.normalize(path + "/");
      const extMap = new Set<string>(SUPPORTED_EXTENSIONS.map((x) => `.${x}`));

      const queue = new Denque<string>();

      // Queue the directory for walking
      queue.push("");

      // Walks nested structures using a loop and a queue on the heap
      // Recursion might cause a stack overflow
      while (queue.length > 0) {
        const files = [] as string[];
        const nestedDir = queue.shift();
        const openedDir = await promises.opendir(normalisedPath + nestedDir);

        // Asynchronously iterating over the open directory
        // will automatically close the descriptor, even on error
        for await (const entry of openedDir) {
          if (entry.isFile()) {
            if (extMap.has(parse(entry.name).ext)) {
              files.push(nestedDir + entry.name);
              increment();
            }
          } else if (entry.isDirectory()) {
            queue.push(nestedDir + entry.name + posix.sep);
          }
        }

        yield {
          root: normalisedPath,
          files,
        };
      }
    }
  } catch (err) {
    if (err instanceof InterruptException) return err;

    return new CliException(
      "Search error: " + err.message || "<unknown message>",
      CliExceptionCode.SEARCH,
      "Image search failed",
      "The following message was thrown:\n" + err.message
    ).extend(err);
  }

  return new CliException(
    "Invalid path: " + path,
    CliExceptionCode.SEARCH,
    "Invalid input path",
    "The given path was not a file or a directory:\n" + path
  );
}
