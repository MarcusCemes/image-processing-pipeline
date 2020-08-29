/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Pipe } from "@ipp/common";

/** A pipe that does nothing to the image. Useful for testing */
export const PassthroughPipe: Pipe = async (data) => data;
