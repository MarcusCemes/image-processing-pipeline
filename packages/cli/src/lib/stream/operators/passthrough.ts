/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createObjectStream, Operator } from "../object_stream";

export function passthrough<T>(): Operator<T, T> {
  return (source) => createObjectStream(source);
}
