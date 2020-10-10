/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from "rxjs";
import { State } from "../lib/state";

export interface UiContext {
  state: Observable<State>;
  version: string;
}

export interface UiInstance {
  stop: (state: State) => void | Promise<void>;
}

export type UI = (context: UiContext) => UiInstance;

export default {};
