// Responsive Image Builder - Config
// Exports the config interface, and the config parser
import Ajv from "ajv";
import chalk from "chalk";
import merge from "deepmerge";

import { MAIN_ERRORS } from "./Constants";
import { ConfigurationError } from "./Interfaces";
import { Logger } from "./Logger";
import { withoutUndefined } from "./Utility";

/**
 * A single size preset for an image export. Will output one resized image.
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

/** Universal settings that can be applied locally or on a per-format basis */
export interface IUniversalSettings {
  /** Enable/disable fallback format exports */
  exportFallback?: boolean;

  /** Enable/disable WebP export next to fallback format */
  exportWebp?: boolean;

  /** Enable/disable image resizing */
  resize?: boolean;

  /**
   * Enable/disable image optimization. When disabled, standard export settings
   * from the image encoder will be used, which still result in a useable file.
   */
  optimize?: boolean;

  /** Export the fallback image in this format (e.g. TIFF -> JPEG) */
  convert?: "jpeg" | "png" | "tiff" | "webp";

  /**
   * Pass the source image through a hash function to get an exact fingerprint
   * from the original image for reliable image resolution. This will add a "fingerprint"
   * field to each manifest export.
   */
  fingerprint?: boolean;

  /**
   * Export presets that are used to resize images.
   * These serve as the "responsive breakpoints" for different device dimensions.
   */
  exportPresets?: IExportPreset[];

  /**
   * Customize the output filename for non-resized exports.
   * Supported substituted "template literals" are:
   * \[name\], \[format\], \[hash\] and \[shortHash\]
   *
   * @example default "[name].[format]""
   */
  singleExportTemplate?: string;
  /**
   * Lets you configure the filename of exports.
   * Supported substituted "template literals" are:
   * \[name\], \[format\], \[preset\], \[hash\], \[shortHash\], \[width\] and \[height\]
   *
   * @example default "[name]_[preset].[format]""
   */
  multipleExportTemplate?: string;
}

/** Allows you to override global settings on a per-format settings */
export interface IFormatSettings extends IUniversalSettings {
  /** imagemin plugin-specific settings, or the SHARP WebP options for WebP! */
  optimizerSettings?: object;
}

/** Global configuration for Responsive Image Builder. */
export interface IConfig extends IUniversalSettings {
  /** The input path or paths, separated with a double period ".." */
  in: string[];

  /** The output path where to save exported images */
  out: string;

  /** Enable/disable writing of a manifest file */
  exportManifest?: boolean;

  /** Empty the output directory beforehand */
  cleanBeforeExport?: boolean;

  /** Flatten the directory structure, exporting everything into one folder */
  flatExport?: boolean;

  /** Program verbosity in the console. "silent" disables terminal interactivity */
  verbosity?: "verbose" | "errors" | "silent";

  /** Overwrite output files without failing and clean without confirmation */
  force?: boolean;

  /**
   * Increment file exports if an existing file is already in place.
   * This will not increment *all* exported sizes from the same image, only the
   * conflicting export size.
   */
  incrementConflicts?: boolean;

  /** Maximum number of worker threads to create */
  threads?: number;

  /** The algorithm to use for fingerprinting, system-specific (default: "md5") */
  hashAlgorithm?: string;

  /** Trim the hash to save space in the manifest */
  shortHash?: boolean;

  /** PNG-only settings. Only a few sub-settings are supported */
  png?: IFormatSettings;
  /** JPEG-only settings. Only a few sub-settings are supported */
  jpeg?: IFormatSettings;
  /** SVG-only settings. Only a few sub-settings are supported */
  svg?: IFormatSettings;
  /** GIF-only settings. Only a few sub-settings are supported */
  gif?: IFormatSettings;
  /** WebP-only settings. Only a few sub-settings are supported */
  webp?: IFormatSettings;
  /** TIFF-only settings. Only a few sub-settings are supported */
  tiff?: IFormatSettings;
}

/**
 * The default export presets, provides four responsive breakpoints for:
 * - thumbnail
 * - small (mobile)
 * - normal
 * - large (high-DPI/4K screens)
 */
export const defaultExportPresets: IExportPreset[] = [
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
 * The default config for Responsive Image Builder. User configuration
 * will be merged with this existing config, with the user's options
 * overriding the default values.
 */
export const defaultConfig: IConfig = {
  in: null,
  out: null,

  exportFallback: true,
  exportWebp: true,
  exportManifest: true,
  cleanBeforeExport: true,
  flatExport: false,

  verbosity: "verbose",
  force: false,
  incrementConflicts: false,

  threads: 0,
  resize: true,
  optimize: true,

  singleExportTemplate: "[name].[format]",
  multipleExportTemplate: "[name]_[preset].[format]",

  fingerprint: false,
  hashAlgorithm: "md5",
  shortHash: false,

  exportPresets: defaultExportPresets,

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
      quality: 75
    }
  }
};

/* JSON schema time... */

/** JSOn schema for IUniversalSettings */
const universalSettingsSchema = {
  exportFallback: {
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
  exportPresets: {
    $ref: "#/definitions/exportPresets"
  },
  convert: {
    type: "string",
    enum: ["jpeg", "png", "webp", "tiff"]
  },
  singleExportTemplate: {
    type: "string"
  },
  multipleExportTemplate: {
    type: "string"
  },
  fingerprint: {
    type: "boolean"
  }
};

/** JSON schema for IConfig */
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
    formatSettings: {
      type: "object",
      properties: {
        optimizerSettings: {
          type: "object"
        },
        ...universalSettingsSchema
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
    ...universalSettingsSchema,
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
    incrementConflicts: {
      type: "boolean"
    },
    threads: {
      type: "number",
      minimum: 0
    },
    hashAlgorithm: {
      type: "string"
    },
    shortHash: {
      type: "boolean"
    },
    png: {
      $ref: "#/definitions/formatSettings"
    },
    jpeg: {
      $ref: "#/definitions/formatSettings"
    },
    svg: {
      $ref: "#/definitions/formatSettings"
    },
    gif: {
      $ref: "#/definitions/formatSettings"
    },
    webp: {
      $ref: "#/definitions/formatSettings"
    },
    tiff: {
      $ref: "#/definitions/formatSettings"
    }
  }
};

/**
 * Verify the config for correct structure and types, and merge wit
 * the default config.
 */
export function parseConfig(receivedConfig: Partial<IConfig>): IConfig {
  const config = withoutUndefined(receivedConfig);

  // Validate the user's config
  const ajv = new Ajv();
  const valid = ajv.validate(configSchema, config);

  // Try to construct a human-readable error message
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

    // Display the human-readable error in terminal
    const logger = new Logger();
    logger.error(
      "Could not start due to invalid config:\n" +
        reducedErrors +
        "\n" +
        chalk.reset('Refer to the README for acceptable configuration objects, or try "rib --help"')
    );

    throw new ConfigurationError(MAIN_ERRORS.configError, reducedErrors);
  }

  // Merge the config with the default
  return merge(defaultConfig, config);
}
