/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Pipe, PipeException } from "@ipp/common";
import mozjpeg, { Options as JpegOptions } from "imagemin-mozjpeg";
import pngquant, { Options as PngOptions } from "imagemin-pngquant";
import svgo, { Options as SvgOptions } from "imagemin-svgo";

type CompressFunction = (image: Buffer) => Promise<Buffer>;

export interface CompressOptions {
  /** Don't throw an error if an unsupported image format is received, instead pass it through */
  allowUnsupported?: boolean;
  /** Options passed to mozjpeg */
  jpeg?: JpegOptions;
  /** Options passed to pngquant */
  png?: PngOptions;
  /** Options passed to svgo */
  svg?: SvgOptions;
}

export const CompressPipe: Pipe<CompressOptions> = async (data, options = {}) => {
  const plugin = resolvePlugin(data.metadata.current.format, options);

  return {
    buffer: typeof plugin === "function" ? await plugin(data.buffer) : data.buffer,
    metadata: data.metadata,
  };
};

function resolvePlugin(format: string, options: CompressOptions): CompressFunction | undefined {
  switch (format) {
    case "jpeg":
      return mozjpeg(options.jpeg);
    case "png":
      return pngquant(options.png);
    case "svg":
      return svgo(options.svg);
    default:
      if (!options.allowUnsupported) throw new PipeException(`Unsupported format: ${format}`);
  }
}
