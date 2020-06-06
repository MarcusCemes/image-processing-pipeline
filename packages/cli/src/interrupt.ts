import { Exception } from "@rib/common";

interface Interrupt {
  promise: Promise<never>;
  destroy: () => void;
}

export class InterruptException extends Exception {
  public name = "InterruptException";

  constructor(message?: string, stack?: string) {
    super(message, stack);
  }
}

export function createInterrupt(): Interrupt {
  let complete: Interrupt["destroy"] = () => {
    /* */
  };

  const promise = new Promise<never>((res, rej) => {
    const handler = () => {
      // try {
      //   throw new InterruptException();
      // } catch (err) {
      //   rej(err);
      // }
      // const exception = new InterruptException();
      // Error.captureStackTrace(exception);
      // rej(exception);
      rej(new InterruptException("Received interrupt signal"));
    };

    process.on("SIGINT", handler);
    complete = () => {
      process.off("SIGINT", handler);
      res();
    };
  });

  return {
    destroy: complete,
    promise,
  };
}
