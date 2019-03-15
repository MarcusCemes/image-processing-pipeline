/**
 * Responsive Image Builder - Config
 * Exports the config interface, and the config parser
 */
import Ajv from "ajv";
import chalk from "chalk";
import merge from "deepmerge";

import { ConfigurationError } from "./Interfaces";
import { Logger } from "./Logger";

/**
 * A single image export preset.
 * This is used as a model for both the
 * WebP and fallback codec export.
 */
export interface IExportPreset {
  name: string;
  width: number;
  height: number;
  force?: boolean;
  default?: boolean;
}

/** Specific settings for each codec. These override the global settings */
export interface ICodecSettings {
  exportWebp?: boolean;
  resize?: boolean;
  optimize?: boolean;
  optimizerSettings?: object;
  exportPresets?: IExportPreset[];
}

/**
 * Contains all the possible config parameters
 * for Responsive Image Builder.
 */
export interface IConfig {
  /** The input path or paths, separated with a double period ".." */
  in: string[];
  /** The output path to export pictures to */
  out: string;

  /** Enable/Disable WebP exports */
  exportWebp?: boolean;
  /** Enable/Disable writing of a manifest file */
  exportManifest?: boolean;
  /** Remove everything from the output folder */
  cleanBeforeExport?: boolean;
  /**
   * Don't create the input folder structure,
   * put everything in the top-most directory
   */
  flatExport?: boolean;

  /** Program verbosity in the terminal */
  verbosity?: "verbose" | "errors" | "silent";
  /** Overwrite output files without failing and clean without confirmation */
  force?: boolean;

  /** Maximum number of workers to create, which translates roughly to threads */
  threads?: number;
  /** Enable/Disable image resizing using ExportPresets */
  resize?: boolean;
  /** Enable/Disable image optimization */
  optimize?: boolean;
  /** WebP compression factor */
  webpQuality?: number;
  /** WebP alpha channel compression factor */
  webpAlphaQuality?: number;

  /** Export presets to use when resizing the image */
  exportPresets?: IExportPreset[];

  /** PNG-only settings. Only a few sub-settings are supported */
  png?: ICodecSettings;
  /** JPEG-only settings. Only a few sub-settings are supported */
  jpeg?: ICodecSettings;
  /** SVG-only settings. Only a few sub-settings are supported */
  svg?: ICodecSettings;
  /** GIF-only settings. Only a few sub-settings are supported */
  gif?: ICodecSettings;
}

/**
 * The default export preset used.
 * This creates a thumbnail, and three
 * responsive sizes.
 */
export const DefaultExportPreset: IExportPreset[] = [
  {
    name: "thumbnail",
    height: 16,
    width: 16,
    force: true
  },
  {
    name: "small",
    width: 1280,
    height: 720,
    force: true
  },
  {
    name: "normal",
    width: 1920,
    height: 1080,
    default: true
  },
  {
    name: "large",
    width: 3840,
    height: 2160
  }
];

/**
 * The default config for Responsive Image Builder.
 */
export const DefaultConfig: IConfig = {
  in: null,
  out: null,

  exportWebp: true,
  exportManifest: true,
  cleanBeforeExport: true,
  flatExport: false,

  verbosity: "verbose",
  force: false,

  threads: 0,
  resize: true,
  optimize: true,

  exportPresets: DefaultExportPreset,

  gif: {
    exportWebp: false,
    resize: false
  },

  svg: {
    exportWebp: false,
    resize: false
  }
};

const configSchema = {
  definitions: {
    exportPresets: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "width", "height"],
        properties: {
          name: {
            type: "string"
          },
          width: {
            type: "string"
          },
          height: {
            type: "string"
          },
          force: {
            type: "boolean"
          },
          default: {
            type: "boolean"
          }
        }
      }
    },
    codecSettings: {
      type: "object",
      properties: {
        exportWebp: {
          type: "boolean"
        },
        resize: {
          type: "boolean"
        },
        optimize: {
          type: "boolean"
        },
        optimizerSettings: {
          type: "object"
        },
        exportPresets: {
          $ref: "#/definitions/exportPresets"
        }
      }
    }
  },
  title: "Config",
  type: "object",
  required: ["in", "out"],
  properties: {
    in: {
      type: "array",
      items: {
        type: "string"
      }
    },
    out: {
      type: "string"
    },
    exportWebp: {
      type: "boolean"
    },
    exportManifest: {
      type: "boolean"
    },
    cleanBeforeExport: {
      type: "boolean"
    },
    flatExport: {
      type: "boolean"
    },
    verbosity: {
      type: "string",
      enum: ["silent", "errors", "verbose"]
    },
    force: {
      type: "boolean"
    },
    threads: {
      type: "number",
      minimum: 0
    },
    resize: {
      type: "boolean"
    },
    optimize: {
      type: "boolean"
    },
    webpQuality: {
      type: "number",
      minimum: 1,
      maximum: 100
    },
    webpAlphaQuality: {
      type: "number",
      minimum: 0,
      maximum: 100
    },
    exportPresets: {
      $ref: "#/definitions/exportPresets"
    },
    png: {
      $ref: "#/definitions/codecSettings"
    },
    jpeg: {
      $ref: "#/definitions/codecSettings"
    },
    svg: {
      $ref: "#/definitions/codecSettings"
    },
    gif: {
      $ref: "#/definitions/codecSettings"
    }
  }
};

/**
 * Parses the given config, and fills in the missing values
 * with the default values from DefaultConfig.
 * @param {Partial<IConfig>} config An object that is used to configure Responsive Image Builder
 */
export function parseConfig(config: Partial<IConfig>): IConfig {
  removeUndefined(config);

  // Validate the config schema
  const ajv = new Ajv();
  const valid = ajv.validate(configSchema, config);

  // If not valid, throw an error string
  if (!valid) {
    // Reduce the errors and build a long string
    const reducedErrors = ajv.errors.reduce((response, error) => {
      // @ts-ignore Bad typings, unable to fix
      if (error.params.missingProperty) {
        // @ts-ignore Bad typings, unable to fix
        return response + '> The parameter "' + error.params.missingProperty + '" is required\n';
      }
      // @ts-ignore Bad typings, unable to fix
      if (error.params.type) {
        return (
          response +
          '> The type of parameter "' +
          error.dataPath +
          '" must be one of: ' +
          // @ts-ignore Bad typings, unable to fix
          error.params.type
        );
      }
      return "> " + error.dataPath + " " + error.message + "\n";
    }, "");

    // Print to the terminal
    const logger = new Logger();
    logger.error(
      "Could not start due to invalid config:\n" +
        reducedErrors +
        "\n" +
        chalk.reset('Refer to the README for acceptable configuration objects, or try "rib --help"')
    );

    throw new ConfigurationError(reducedErrors, "Bad config");
  }

  // If valid, return the config
  return merge(DefaultConfig, config);
}

/** Recursively removes undefined values */
function removeUndefined(object: {}) {
  for (const key of Object.keys(object)) {
    if (typeof object[key] === "object") {
      removeUndefined(object[key]);
    } else if (typeof object[key] === "undefined") {
      delete object[key];
    }
  }
}
