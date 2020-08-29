/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Pipe, PipeException } from "@ipp/common";
import produce from "immer";
import sharp, { Raw, Sharp } from "sharp";

sharp.concurrency(1);

export interface ConvertOptions {
  format: string;
  convertOptions?: Parameters<Sharp["toFormat"]>[1];
}

export const ConvertPipe: Pipe<ConvertOptions> = async (data, options) => {
  if (!options || !options.format) throw new PipeException('Missing "format" option');

  const { current } = data.metadata;
  const targetFormat = options.format === "original" ? data.metadata.source.format : options.format;

  const {
    data: newData,
    info: { width, height, channels, format },
  } = await sharp(data.buffer as Buffer, {
    raw:
      current.format === "raw"
        ? {
            width: current.width,
            height: current.height,
            channels: current.channels as Raw["channels"],
          }
        : void 0,
  })
    .toFormat(targetFormat, options.convertOptions)
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: newData,
    metadata: produce(data.metadata, (draft) => {
      draft.current.width = width;
      draft.current.height = height;
      draft.current.channels = channels;
      draft.current.format = format;
    }),
  };
};
