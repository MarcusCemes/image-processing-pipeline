/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { promises, Stats } from "fs";

export async function isDirectory(path: string): Promise<boolean> {
  return (await getStats(path)).isDirectory();
}

export async function getStats(path: string): Promise<Stats> {
  return promises.stat(path);
}
