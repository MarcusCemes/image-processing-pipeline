/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createManifestItem, Exception, ManifestItem } from "@ipp/common";
import { createWriteStream } from "fs";
import { join } from "path";
import { CliContext } from "../cli";
import { DEFAULT_LIBUV_THREADPOOL } from "../constants";
import { Config } from "../init/config";
import { Status, TaskContext } from "../model/state";
import { unorderedParallelMap } from "./concurrency";
import { CliException, CliExceptionCode } from "./exception";
import { ProcessResult } from "./image_process";

const TASK_ID = "save_manifest";

const MANIFEST_FILE = "manifest.json";

export function saveManifest(
  ctx: CliContext,
  config: Config,
  images: AsyncIterable<ProcessResult | Exception>
): AsyncIterable<Exception> {
  let started = false;
  const mappings = config.manifest;

  const task = ctx.state.tasks.add(
    TASK_ID,
    Status.WAITING,
    mappings ? "Build manifest" : "Manifest disabled"
  );

  if (!mappings) {
    return exceptionFilter(images);
  }

  const writeStream = createWriteStream(join(config.output, MANIFEST_FILE));
  writeStream.write("[");

  let firstItem = true;

  // Process results in parallel and write them to the manifest stream
  const exceptions = unorderedParallelMap(images, DEFAULT_LIBUV_THREADPOOL, async (result) => {
    if (result instanceof Exception) return result;

    if (started !== true) {
      task.update(Status.PENDING, "Building manifest");
      started = true;
    }

    const manifestItem = createManifestItem(result.result, mappings);

    const isFirstItem = firstItem;
    firstItem = false;

    return writeManifestItem(writeStream, manifestItem, isFirstItem);
  });

  return completion(task, exceptions, writeStream);
}

/** Creates a completion async generator that closes the stream */
async function* completion(
  task: TaskContext,
  results: AsyncIterable<Exception | undefined>,
  writeStream: NodeJS.WritableStream
) {
  for await (const item of results) {
    if (typeof item !== "undefined") yield item;
  }

  writeStream.write("]");
  await new Promise((res) => writeStream.end(() => res()));

  task.update(Status.COMPLETE, "Manifest built");
}

/**
 * Writes a manifest entry to a writable stream and waits until
 * the data is flushed
 */
async function writeManifestItem(
  stream: NodeJS.WritableStream,
  manifestItem: ManifestItem,
  firstItem: boolean
): Promise<undefined> {
  const stringified = JSON.stringify(manifestItem);

  return new Promise((res, rej) => {
    stream.write((firstItem ? "" : ",") + stringified, (err) =>
      err ? rej(createManifestException(err)) : res()
    );
  });
}

/** A async generator that only returns exceptions from an async iterable */
async function* exceptionFilter(
  results: AsyncIterable<ProcessResult | Exception>
): AsyncIterable<Exception> {
  for await (const result of results) {
    if (result instanceof Exception) yield result;
  }
}

function createManifestException(err: Error): CliException {
  return new CliException(
    "Manifest exception",
    CliExceptionCode.MANIFEST,
    "Manifest exception",
    "Failed to write manifest entry:\n" + err.message
  ).extend(err);
}
