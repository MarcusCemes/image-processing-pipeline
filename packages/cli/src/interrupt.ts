import { Exception } from "@ipp/common";

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
