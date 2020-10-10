/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ManifestMappings, Pipeline, PipelineSchema } from "@ipp/common";
import Ajv from "ajv";
import { Schema } from "schema-utils/declarations/validate";
import { IppError } from "./error";

export interface Options {
  devBuild: boolean;
  manifest?: ManifestMappings;
  esModule: boolean;
  outputPath: string;
  pipeline: Pipeline;
}

const SCHEMA: Schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["pipeline"],
  properties: {
    devBuild: {
      type: "boolean",
    },
    manifest: {
      type: "object",
      properties: {
        source: {
          type: "object",
          patternProperties: {
            "^.*$": {
              type: "string",
            },
          },
        },
        format: {
          type: "object",
          patternProperties: {
            "^.*$": {
              type: "string",
            },
          },
        },
      },
    },
    module: {
      type: "boolean",
    },
    outputPath: {
      type: "string",
    },
    pipeline: {
      $ref: "https://ipp.vercel.app/schema/pipeline.json",
    },
  },
};

const DEFAULT_OPTIONS: Partial<Options> = {
  devBuild: false,
  esModule: false,
  outputPath: "[hash:16][ext]",
};

export function checkOptions(options: Partial<Options>): Options {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  const ajv = new Ajv({ allErrors: true });
  ajv.addSchema(PipelineSchema);

  const valid = ajv.validate(SCHEMA, merged);
  if (!valid) throw new IppError("Invalid config\n" + ajv.errorsText());

  return merged as Options;
}
