// Responsive Image Builder - Interfaces
// Exports various global program interfaces
export type ProgramError = ConfigurationError | PreparationError;

/**
 * Returns the final program state, along with manifest exports and
 * potential encountered errors.
 */
export interface IResult {
  success: boolean;
  error?: ProgramError;
  exports?: IExport[];
}

export class ConfigurationError extends Error {
  public userMessage: string;
  constructor(message: string, userMessage?: string) {
    super(message);
    this.name = "ConfigurationError";
    this.message = message;
    if (userMessage) {
      this.userMessage = userMessage;
    }
  }
}

export class PreparationError extends Error {
  public userMessage: string;
  constructor(message: string, userMessage?: string) {
    super(message);
    this.name = "PreparationError";
    this.message = message;
    if (userMessage) {
      this.userMessage = userMessage;
    }
  }
}

/** The Manifest file structure */
export interface IManifest {
  exports: IExport[];
}

/** A single export in the manifest file */
export interface IExport {
  /** Information about the original image for resolution */
  original: {
    /** Source *name* */
    name: string;
    /** Source file *dir* and *name* */
    fullName: string;
    /** Source extension */
    extension: string;
    /** Source checksum */
    fingerprint?: string;
  };
  /** Information about the resulting export */
  export: {
    /** Fallback format was exported */
    fallback: boolean;
    /** WebP format was exported */
    webp: boolean;
    /** Relative directory (to config.out) */
    relativeDir: string;
    /** Fallback format, which will also be its extension */
    format: string;
    /** If it's a single-type export, this will contain more export information */
    single?: {
      /** The export file name */
      name: string;
    };
    /** If it's a multiple-type export, this will contain more exported sizes */
    multiple?: IExportSize[];
  };
}

/** A single exported size */
export interface IExportSize {
  /** *name* of the exported size */
  name: string;
  /** Preset name that exported this size */
  preset: string;
  /** The horizontal dimension of the resulting export */
  width: number;
  /** The vertical dimension of the resulting export */
  height: number;
  /** Size is marked as default? (convenience, see IExportPreset) */
  default?: true;
}

/** Information about the failed export */
export interface IFailedExport {
  /** The path to the original image */
  path: string;
  /** The reason of failure, containing a RIB error code */
  error?: { message: string; originalError?: string };
}
