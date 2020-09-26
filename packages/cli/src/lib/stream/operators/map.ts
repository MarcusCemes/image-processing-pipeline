/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createObjectStream, Operator } from "../object_stream";

export function map<I, O>(fn: (item: I) => O | null | Promise<O | null | O[]>): Operator<I, O> {
  return (source) =>
    createObjectStream(
      (async function* () {
        for await (const item of source) {
          const results = await fn(item);

          if (results === null) continue;

          if (Array.isArray(results)) {
            for (const result of results) yield result;
          } else {
            yield results;
          }
        }
      })()
    );
}
