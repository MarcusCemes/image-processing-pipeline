/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RawOperator } from "../object_stream";

export function toPromise<I>(): RawOperator<I, Promise<void>> {
  return async function (source) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of source);
  };
}
