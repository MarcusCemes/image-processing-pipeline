export class Exception extends Error {
  public name = "Exception";

  constructor(message?: string) {
    super(message);
  }
}
