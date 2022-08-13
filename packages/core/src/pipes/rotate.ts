/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Pipe } from "@ipp/common";

import produce from "immer";
import sharp, { RotateOptions as SharpOptions } from "sharp";

sharp.concurrency(1);

export interface RotateOptions {
  angle?: number;
  rotateOptions?: SharpOptions;
}

/**
 * A built-in pipe that lets you rotate an image
 * This can be used to rotate the image properly before the EXIF data is removed from CompressPipe
 */
export const RotatePipe: Pipe<RotateOptions> = async (data, options = {}) => {
  const {
    data: newBuffer,
    info: { width, height, format, channels },
  } = await sharp(data.buffer)
    .rotate(options.angle, options.rotateOptions)
    .toBuffer({ resolveWithObject: true });

  const newMetadata = produce(data.metadata, (draft) => {
    draft.current.width = width;
    draft.current.height = height;
    draft.current.channels = channels;
    draft.current.format = format;
  });

  return {
    buffer: newBuffer,
    metadata: newMetadata,
  };
};
