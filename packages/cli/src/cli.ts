/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { W_OK } from "constants";
import { promises } from "fs";
import { resolve } from "path";
import { VERSION } from "./constants";
import { Config } from "./init/config";
import { createContext } from "./lib/context";
import { CliException, CliExceptionCode } from "./lib/exception";
import { InterruptHandler } from "./lib/interrupt";
import { StateContext, Status } from "./lib/state";
import { buffer } from "./lib/stream/operators/buffer";
import { passthrough } from "./lib/stream/operators/passthrough";
import { toPromise } from "./lib/stream/operators/to_promise";
import { completedCounter, exceptionCounter, sourceCounter } from "./operators/counters";
import { saveExceptions } from "./operators/exceptions";
import { saveManifest } from "./operators/manifest";
import { processImages } from "./operators/process";
import { saveImages } from "./operators/save";
import { searchForImages } from "./operators/search";
import { DynamicUI, UI, UiInstance as UIInstance } from "./ui";

const ERROR_FILE = "errors.json";
const MANIFEST_FILE = "manifest.json";
const BUFFER_SIZE = 8;

export interface CliContext {
  interrupt: InterruptHandler;
  ui: UIInstance;
  state: StateContext;
}

export async function startCli(config: Config, ui: UI = DynamicUI): Promise<void> {
  return withCliContext(
    config.concurrency,
    !!config.manifest,
    !!config.clean,
    VERSION,
    ui,
    async (ctx) => {
      try {
        // Unregister handler to allow force quitting
        ctx.interrupt.rejecter.catch(() => {
          ctx.interrupt.destroy();
          setStatus(ctx, Status.INTERRUPT);
        });

        if (config.clean) await deleteDirectory(config.output);
        await ensureOutputPath(config.output);

        setStatus(ctx, Status.PROCESSING);

        await createPipeline(ctx, config, MANIFEST_FILE, ERROR_FILE).pipe(toPromise());

        setStatus(ctx, Status.COMPLETE);
      } catch (err) {
        setStatus(ctx, Status.ERROR);
        throw err;
      }
    }
  );
}

async function withCliContext(
  concurrency: number,
  manifest: boolean,
  clean: boolean,
  version: string,
  ui: UI,
  fn: (ctx: CliContext) => void | Promise<void>
) {
  const ctx = createContext(concurrency, manifest, clean, version, ui);

  try {
    await fn(ctx);
  } finally {
    await ctx.ui.stop(ctx.state.complete());
    ctx.interrupt.destroy();
  }
}

function createPipeline(ctx: CliContext, config: Config, manifestFile: string, errorFile: string) {
  const paths = typeof config.input === "string" ? [config.input] : config.input;

  return searchForImages(paths)
    .pipe(sourceCounter(ctx))
    .pipe(buffer(BUFFER_SIZE))
    .pipe(processImages(config.pipeline, config.concurrency))
    .pipe(completedCounter(ctx))
    .pipe(buffer(BUFFER_SIZE))
    .pipe(saveImages(config.output, !!config.flat))
    .pipe(
      config.manifest
        ? saveManifest(resolve(config.output, manifestFile), config.manifest)
        : passthrough()
    )
    .pipe(exceptionCounter(ctx))
    .pipe(saveExceptions(resolve(config.output, errorFile)));
}

function setStatus(ctx: CliContext, status: Status) {
  ctx.state.update((state) => (state.status = status));
}

async function ensureOutputPath(path: string): Promise<void> {
  try {
    await promises.access(path, W_OK);
  } catch (err) {
    await promises.mkdir(path);
  }
}

async function deleteDirectory(path: string): Promise<void> {
  try {
    const stat = await promises.stat(path);

    if (!stat.isDirectory()) {
      throw new CliException(
        "Output clean error",
        CliExceptionCode.CLEAN,
        "Output clean error",
        "The output path already exists but is not a directory.\n" +
          "Please remove the file and try again.\n"
      );
    }
  } catch (error: unknown) {
    if (hasErrorCode(error, "ENOENT")) return;
    throw error;
  }

  try {
    await promises.rm(path, { recursive: true });
  } catch (err) {
    throw new CliException(
      "Output clean error:\n" + (err as Error).message,
      CliExceptionCode.CLEAN,
      "Output clean error",
      "An error occurred while trying to clean the out directory.\n" +
        "You may not have sufficient permissions to do so.\n" +
        "You can disable output cleaning in the config file.\n\n" +
        String(err)
    );
  }
}

function hasErrorCode(error: unknown, code: string): boolean {
  return error instanceof Error && (error as Error & { code: string }).code === code;
}
