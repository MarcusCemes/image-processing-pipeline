/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@ipp/common";

export enum CliExceptionCode {
  CONFIG_LOAD = "CONFIG_LOAD",
  CONFIG_PARSE = "CONFIG_PARSE",
  ARG_VALIDATION = "ARG_VALIDATE",
  SEARCH = "SEARCH",
  MANIFEST = "MANIFEST",
  SAVE = "SAVE",
  UNKNOWN = "UNKNOWN",
}

export class CliException extends Exception {
  public name = "CliException";

  constructor(
    message: string,
    public code?: CliExceptionCode,
    public title?: string,
    public comment?: string
  ) {
    super(message);
  }
}
