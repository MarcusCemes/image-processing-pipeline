/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class IppError extends Error {
  public name = "IppError";

  constructor(message?: string) {
    super(message);
  }
}
