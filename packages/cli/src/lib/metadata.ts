/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { parse } from "path";

export function pathMetadata(path: string): Record<string, string> {
  const parsed = parse(path);

  return {
    base: parsed.base,
    ext: parsed.ext,
    dir: slash(parsed.dir),
    name: parsed.name,
    path: slash(path),
  };
}

function slash(text: string): string {
  return text.replace(/\\/g, "/");
}
