export type ProgramError = ConfigurationError | PreparationError;

/**
 * The resolved object from the main function.
 * This contains information about the program's termination.
 */
export interface IResult {
  success: boolean;
  error?: ProgramError;
  exports?: IExport[];
}

export class ConfigurationError extends Error {
  public userMessage: string;
  constructor(message: string, userMessage: string) {
    super(message);
    this.name = "ConfigurationError";
    this.message = message;
    this.userMessage = userMessage;
  }
}

export class PreparationError extends Error {
  public userMessage: string;
  constructor(message: string, userMessage: string) {
    super(message);
    this.name = "PreparationError";
    this.message = message;
    this.userMessage = userMessage;
  }
}

export interface IManifest {
  exports: IExport[];
}

export interface IExport {
  name: string;
  fullName: string;
  extension: string;
  sizes?: IExportSize[];
  webp: boolean;
}

export interface IExportSize {
  name: string;
  width: number;
  height: number;
  default?: true;
}

export interface IFailedExport {
  path: string;
  reason: string;
}
