/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Pipe } from "@ipp/common";

import { ConvertPipe } from "./convert";
import { PassthroughPipe } from "./passthrough";
import { ResizePipe } from "./resize";

export const PIPES: { [index: string]: Pipe<any> } = {
  convert: ConvertPipe,
  passthrough: PassthroughPipe,
  resize: ResizePipe,
} as const;
