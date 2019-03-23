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
  /** The name of the preset, this will be used to suffix the file */
  name: string;
  /** The maximum horizontal resolution of the image */
  width: number;
  /** The maximum vertical resolution of the image */
  height: number;
  /** Always export this preset, regardless of what the program decides */
  force?: boolean;
  /** Mark the preset as the default export in the manifest file for convenience */
  default?: boolean;
}

/** Specific settings for each codec. These override the global settings */
export interface ICodecSettings {
  /** Enable/Disable original codec exports */
  exportOriginal?: boolean;
  /** Enable/disable WebP export next to original codec */
  exportWebp?: boolean;
  /** Enable/disable image resizing */
  resize?: boolean;
  /**
   * Enable/Disable image optimization.
   * If disabled, the image will be saved directly from SHARP using default options.
   * If enabled, the image will pass through an optimizer beforehand, which can be
   * configured using optimizerSettings. Doesn't do anything for WebP.
   */
  optimize?: boolean;
  /** imagemin plugin-specific settings, or the SHARP WebP options for WebP! */
  optimizerSettings?: object;
  /** The responsive breakpoints to use for resizing */
  exportPresets?: IExportPreset[];
  /** Convert the original codec into this codec (e.g. TIFF -> JPEG) */
  convertToCodec?: "jpeg" | "png" | "tiff" | "webp";
}

/**
 * Contains the configuration properties for Responsive Image Builder.
 */
export interface IConfig {
  /** The input path or paths, separated with a double period ".." */
  in: string[];
  /** The output path to export pictures to */
  out: string;

  /** Enable/Disable original codec exports */
  exportOriginal?: boolean;
  /** Enable/Disable WebP exports next to original codec */
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
  /**
   * Enable/Disable image optimization.
   * If disabled, the image will be saved directly from SHARP using default options.
   * If enabled, the image will pass through an optimizer beforehand, which can be
   * configured using optimizerSettings.
   */
  optimize?: boolean;

  /** Convert the original codec into this codec (e.g. TIFF -> JPEG) */
  convertToCodec?: "jpeg" | "png" | "tiff" | "webp";

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
  /** WebP-only settings. Only a few sub-settings are supported */
  webp?: ICodecSettings;
  /** TIFF-only settings. Only a few sub-settings are supported */
  tiff?: ICodecSettings;
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

  exportOriginal: true,
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
  },

  webp: {
    optimizerSettings: {
      quality: 70
    }
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
        exportOriginal: {
          type: "boolean"
        },
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
        },
        convertToCodec: {
          type: "string",
          enum: ["jpeg", "png", "webp", "tiff"]
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
    exportOriginal: {
      type: "boolean"
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
    convertToCodec: {
      type: "string",
      enum: ["jpeg", "png", "webp", "tiff"]
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
    },
    webp: {
      $ref: "#/definitions/codecSettings"
    },
    tiff: {
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
