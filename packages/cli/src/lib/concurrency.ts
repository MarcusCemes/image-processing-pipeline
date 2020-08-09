/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Denque from "denque";
import { EventEmitter, once } from "events";

enum Events {
  ERROR = "error",
  /** A result is waiting in the output queue */
  READABLE = "wake",
  /** The output queue has more capacity, queues jobs */
  DRAIN = "drain",
}

/** A simple extension of NodeJS.EventEmitter that requires enumerated event names */
interface TypedEventEmitter<E extends string> extends NodeJS.EventEmitter {
  on(event: E, listener: (...args: any[]) => void): this;
  once(event: E, listener: (...args: any[]) => void): this;
  off(event: E, listener: (...args: any[]) => void): this;
  emit(event: E, ...args: any[]): boolean;
}

/**
 * A function that iterates over an (async)iterator, mapping each value
 * using a provided async function (similar to Array.map()) and returning results
 * as soon as the mapped value resolves into a value. Order is not preserved, "first
 * resolve, first return" policy.
 *
 * @param {number} concurrency Limits the number of parallel tasks at any moment
 */
export function unorderedParallelMap<R, T>(
  source: Iterable<T> | AsyncIterable<T>,
  concurrency: number,
  fn: (item: T) => Promise<R>
): AsyncIterable<R> {
  let active = 0;
  let end = false;

  const trigger: TypedEventEmitter<Events> = new EventEmitter();
  const results = new Denque<R>();

  /** Rate limit the source async iterator */
  (async () => {
    for await (const item of source) {
      while (active + results.length >= concurrency) {
        await once(trigger, Events.DRAIN);
      }

      ++active;
      fn(item)
        .then((result) => {
          --active;
          results.push(result);
          trigger.emit(Events.READABLE);
        })
        .catch((err) => {
          trigger.emit(Events.ERROR, err);
        });
    }

    end = true;
    trigger.emit(Events.READABLE);
  })();

  return {
    [Symbol.asyncIterator]: async function* () {
      const errorEvent = once(trigger, Events.ERROR);

      while (!end || active > 0 || results.length > 0) {
        if (results.length === 0) {
          const [err] = await Promise.race([once(trigger, Events.READABLE), errorEvent]);
          if (err) throw err;
        }

        while (results.length > 0) {
          const shifted = results.shift() as R;
          trigger.emit(Events.DRAIN);
          yield shifted;
        }
      }
    },
  };
}
