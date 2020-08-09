/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export class Exception extends Error {
  public name = "Exception";

  constructor(message: string) {
    super(message);
  }

  /** Extend another error's stack, returning the instance for chaining */
  extend(stack: Error | string): this {
    this.stack = typeof stack === "string" ? stack : stack.stack;
    return this;
  }
}

export class PipelineException extends Exception {
  public name = "PipelineException";

  constructor(message: string) {
    super(message);
  }
}

export class PipeException extends Exception {
  public name = "PipeException";

  constructor(message: string) {
    super(message);
  }
}
