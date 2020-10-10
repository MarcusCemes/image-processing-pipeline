/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Denque from "denque";
import { EventEmitter, once } from "events";
import { createObjectStream, Operator } from "../object_stream";

export function buffer<T>(count: number): Operator<T, T> {
  return (source) =>
    createObjectStream(
      (async function* () {
        let ended = false;

        const events = new EventEmitter();
        const queue = new Denque();

        // Ready the source asynchronously and fill the buffer
        (async function () {
          for await (const item of source) {
            while (buffer.length === count) {
              await once(events, "item");
            }

            queue.push(item);
            events.emit("item");
          }

          ended = true;
          events.emit("item");
        })();

        // Yield items from the buffer
        while (!queue.isEmpty() || !ended) {
          if (queue.isEmpty()) {
            await once(events, "item");
          }

          while (!queue.isEmpty()) {
            yield queue.shift() as T;
          }
        }
      })()
    );
}
