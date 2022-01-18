/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ManifestItem, ManifestMappings, Pipeline } from "@ipp/common";

export interface IppPluginOptions {
  /** Which paths to include when processing images. */
  include?: Array<string | RegExp> | string | RegExp;

  /** What paths to exclude when processing images. */
  exclude?: Array<string | RegExp> | string | RegExp;

  /** The IPP pipeline to process images with. */
  pipeline?: Pipeline;

  /** Optional manifest mappings for the exported object. */
  manifest?: ManifestMappings;

  /** The generated output path of images (metadata interpolation can be used). */
  outputPath: string;
}

export interface SimpleExport {
  width?: number;
  height?: number;
  src?: string;
  srcset: Record<string, string>;
}

export type ManifestExport = ManifestItem;
