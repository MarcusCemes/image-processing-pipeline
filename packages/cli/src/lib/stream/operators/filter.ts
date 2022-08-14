/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createObjectStream, Operator } from "../object_stream";

export function filter<I, O>(
  fn: (item: I) => boolean | Promise<boolean>,
  complete?: () => void | Promise<void>
): Operator<I, O> {
  return (source) =>
    createObjectStream(
      (async function* () {
        for await (const item of source) {
          if (!(await fn(item))) continue;

          if (Array.isArray(item)) {
            for (const result of item) yield result;
          } else {
            yield item;
          }
        }

        if (complete) await complete();
      })()
    );
}
