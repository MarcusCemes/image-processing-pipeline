/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CliContext } from "../cli";
import { UI } from "../ui";
import { createInterruptHandler } from "./interrupt";
import { createStateContext } from "./state";

export function createContext(
  concurrency: number,
  manifest: boolean,
  version: string,
  ui: UI
): CliContext {
  const interrupt = createInterruptHandler();
  const state = createStateContext(concurrency, manifest);
  const uiInstance = ui({ version, state: state.observable });

  return { interrupt, ui: uiInstance, state };
}
