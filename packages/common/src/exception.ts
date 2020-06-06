export class Exception extends Error {
  public name = "Exception";

  constructor(message?: string, stack?: string) {
    super(message);
    if (stack) this.stack = stack;
  }
}

export class PipelineException extends Exception {
  public name = "PipelineException";

  constructor(message?: string, stack?: string) {
    super(message, stack);
  }
}

export class PipeException extends Exception {
  public name = "PipeException";

  constructor(message?: string, stack?: string) {
    super(message, stack);
  }
}
