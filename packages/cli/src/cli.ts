/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@ipp/common";
import { createWriteStream } from "fs";
import { join } from "path";
import { version } from "./constants";
import { Config } from "./init/config";
import { CliException } from "./lib/exception";
import { processImages } from "./lib/image_process";
import { saveImages } from "./lib/image_save";
import { searchImages } from "./lib/image_search";
import { createInterruptHandler, InterruptHandler } from "./lib/interrupt";
import { saveManifest } from "./lib/manifest";
import { createState, Stage, StateContext } from "./model/state";
import { UI, UiInstance } from "./ui";
import { TerminalUi } from "./ui/";

const DEFAULT_UI = TerminalUi;

export interface CliOptions {
  ui?: UI;
}

export interface CliContext {
  interrupt: InterruptHandler;
  ui: UiInstance;
  state: StateContext;
}

export async function startCli(config: Config, options: CliOptions = {}): Promise<void> {
  const ctx = createContext(config.concurrency, version, options.ui);

  try {
    ctx.state.update((state) => (state.stage = Stage.PROCESSING));

    ctx.interrupt.rejecter.catch(() => {
      ctx.state.update((state) => (state.stage = Stage.INTERRUPT));

      // Unregister handler to allow force quitting
      ctx.interrupt.destroy();
    });

    const paths = config.input instanceof Array ? config.input : [config.input];
    const images = searchImages(ctx, paths);
    const results = processImages(ctx, config.pipeline, config.concurrency, images);
    const saves = saveImages(ctx, config, results);
    const exceptions = saveManifest(ctx, config, saves);
    await writeExceptions(config, exceptions);

    ctx.state.update((state) => {
      if (state.stage === Stage.PROCESSING) {
        state.stage = Stage.DONE;
      }
    });
  } catch (err) {
    ctx.state.update((state) => {
      state.stage = Stage.ERROR;
      state.message = `Error: ${err.message || "<no message>"}`;
    });

    throw err;
  } finally {
    ctx.state.complete();
    await ctx.ui.stop();
    ctx.interrupt.destroy();
  }
}

function createContext(concurrency: number, version: string, uiOverride?: UI): CliContext {
  const interrupt = createInterruptHandler();
  const state = createState(concurrency);
  const uiContext = (uiOverride || DEFAULT_UI)({ concurrency, version, state: state.observable });

  return { interrupt, ui: uiContext, state };
}

async function writeExceptions(
  config: Config,
  exceptions: AsyncIterable<Exception>
): Promise<boolean> {
  let writeStream: NodeJS.WritableStream | null = null;

  for await (const exception of exceptions) {
    const firstResult = writeStream === null;

    if (firstResult) {
      writeStream = createWriteStream(join(config.output, "errors.json"));
      writeStream.write("[");
    }

    const stringified = JSON.stringify({
      name: exception.name,
      message: exception.message,
      ...(exception instanceof CliException
        ? {
            code: exception.code,
            title: exception.title,
            comment: exception.comment,
          }
        : {}),
    });

    await new Promise<undefined>((res, rej) => {
      (writeStream as NodeJS.WritableStream).write((firstResult ? "" : ",") + stringified, (err) =>
        err ? rej(err) : res()
      );
    });
  }

  if (writeStream !== null) {
    writeStream.write("]");
    writeStream.end();
    return true;
  }

  return false;
}
