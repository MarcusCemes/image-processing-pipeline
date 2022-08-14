/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { resolve } from "path";
import { InputFilter } from "../init/config";
import { Operator } from "../lib/stream/object_stream";
import { filter } from "../lib/stream/operators/filter";
import { isTaskSource } from "./types";

export function filterImages<T>(inputFilter?: InputFilter): Operator<T, T> {
  return filter((item) => {
    if (!inputFilter || !isTaskSource(item)) {
      return true;
    }

    if (!Array.isArray(inputFilter)) {
      inputFilter = [inputFilter];
    }

    const file = resolve(item.root, item.file);
    for (const f of inputFilter) {
      if (typeof f === "function" ? !f(file) : !f.test(file)) {
        return false;
      }
    }

    return true;
  });
}
