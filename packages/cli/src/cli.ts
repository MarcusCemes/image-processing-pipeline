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
import { InterruptHandler } from "./lib/interrupt";
import { StateContext, Status } from "./lib/state";
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

export interface CliContext {
  interrupt: InterruptHandler;
  ui: UIInstance;
  state: StateContext;
}

export async function startCli(config: Config, ui: UI = DynamicUI): Promise<void> {
  return withCliContext(config.concurrency, !!config.manifest, VERSION, ui, async (ctx) => {
    try {
      // Unregister handler to allow force quitting
      ctx.interrupt.rejecter.catch(() => {
        ctx.interrupt.destroy();
        setStatus(ctx, Status.INTERRUPT);
      });

      await ensureOutputPath(config.output);
      setStatus(ctx, Status.PROCESSING);

      await createPipeline(ctx, config, MANIFEST_FILE, ERROR_FILE).pipe(toPromise());

      setStatus(ctx, Status.COMPLETE);
    } catch (err) {
      setStatus(ctx, Status.ERROR);
      throw err;
    }
  });
}

async function withCliContext(
  concurrency: number,
  manifest: boolean,
  version: string,
  ui: UI,
  fn: (ctx: CliContext) => void | Promise<void>
) {
  const ctx = createContext(concurrency, manifest, version, ui);

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
    .pipe(processImages(config.pipeline, config.concurrency))
    .pipe(completedCounter(ctx))
    .pipe(saveImages(config.output))
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
