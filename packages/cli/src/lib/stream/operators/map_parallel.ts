/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Denque from "denque";
import { EventEmitter, once } from "events";
import { createObjectStream, Operator } from "../object_stream";

export function mapParallel<I, O>(
  concurrency: number,
  fn: (item: I) => null | O | Promise<null | O | O[]>,
  complete?: () => void | Promise<void>
): Operator<I, O> {
  return (source) =>
    createObjectStream(
      (async function* () {
        let active = 0;
        let ended = false;

        const events = new EventEmitter();
        const output = new Denque<O>();

        const slot = async () => {
          while (active === concurrency) {
            await once(events, "complete");
          }
          ++active;
        };

        (async () => {
          for await (const item of source) {
            await slot();

            (async () => {
              const result = await fn(item);

              if (result === null) return;

              if (Array.isArray(result)) {
                result.forEach((x) => output.push(x));
              } else {
                output.push(result);
              }

              --active;
              events.emit("complete");
            })();
          }

          ended = true;
        })();

        while (active !== 0 || !ended) {
          if (output.isEmpty()) await once(events, "complete");

          while (!output.isEmpty()) {
            yield output.shift() as O;
          }
        }

        if (complete) await complete();
      })()
    );
}
