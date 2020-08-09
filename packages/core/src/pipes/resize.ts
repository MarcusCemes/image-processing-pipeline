/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataObject, Pipe, PipeException } from "@ipp/common";
import produce from "immer";
import sharp, { Raw, ResizeOptions as SharpOptions } from "sharp";

sharp.concurrency(1);

export interface Breakpoint {
  name?: string;
  resizeOptions: SharpOptions;
}

export interface ResizeOptions {
  breakpoints?: Breakpoint[];
  resizeOptions?: SharpOptions;
  allowDuplicates?: boolean;
}

/**
 * A built-in pipe that lets you resize an image into a single size, or into multiple
 * different breakpoints. When creating breakpoints, duplicate sizes will be skipped.
 */
export const ResizePipe: Pipe<ResizeOptions> = async (data, options = {}) => {
  if (options.breakpoints) {
    if (options.allowDuplicates) {
      // Execute a blind breakpoint resize with no dimension checking
      return Promise.all(options.breakpoints.map((brk) => executeBreakpoint(brk, data)));
    }

    // Estimate the resulting size and remove any would-be-duplicates
    const { width, height } = data.metadata.current;
    return Promise.all(
      options.breakpoints
        .filter(duplicateFilter(width, height))
        .map((brk) => executeBreakpoint(brk, data))
    );
  }

  // Execute a single resize
  if (options.resizeOptions) {
    return executeBreakpoint({ resizeOptions: options.resizeOptions }, data);
  }

  throw new PipeException("No resize options were given");
};

/**
 * Creates a stateful array filter so that, taking the `withoutEnlargement`
 * property into consideration, there will be a maximum of one breakpoint with
 * a given set of dimensions.
 *
 * During calculation, the size of the image diagonal is rounded to the nearest integer
 * to compensate for floating-point error;
 */
function duplicateFilter(width: number, height: number): (brk: Breakpoint) => boolean {
  const previous: number[] = [];
  const diagonal = width * height;

  return (brk) => {
    const scaledDiagonal = calculateDiagonal(
      width,
      height,
      brk.resizeOptions?.width,
      brk.resizeOptions?.height
    );

    const withoutEnlargement =
      typeof brk.resizeOptions.withoutEnlargement !== "undefined"
        ? brk.resizeOptions.withoutEnlargement
        : true;

    const newDiagonal = withoutEnlargement ? Math.min(diagonal, scaledDiagonal) : scaledDiagonal;

    const roundedDiagonal = Math.round(newDiagonal);
    if (previous.indexOf(roundedDiagonal) !== -1) return false;

    previous.push(roundedDiagonal);
    return true;
  };
}

/**
 * Calculates the new diagonal of an image, assuming that the given target dimensions
 * create a "box" that the new image must fit into.
 *
 * If neither target options are specified, the original diagonal is returned.
 */
function calculateDiagonal(
  width: number,
  height: number,
  targetWidth?: number,
  targetHeight?: number
): number {
  const widthFactor = targetWidth ? targetWidth / width : Infinity;
  const heightFactor = targetHeight ? targetHeight / height : Infinity;

  const dominantFactor = Math.min(widthFactor, heightFactor);
  return width * height * (dominantFactor === Infinity ? 1 : dominantFactor);
}

/** Converts the breakpoint into a Sharp execution instance */
async function executeBreakpoint(breakpoint: Breakpoint, data: DataObject): Promise<DataObject> {
  const { current } = data.metadata;

  const {
    data: newBuffer,
    info: { width, height, format, channels },
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
    .resize(extractSharpOptions({ withoutEnlargement: true, ...breakpoint.resizeOptions }))
    .toBuffer({ resolveWithObject: true });

  const newMetadata = produce(data.metadata, (draft) => {
    draft.current.width = width;
    draft.current.height = height;
    draft.current.channels = channels;
    draft.current.format = format;

    if (breakpoint.name) {
      draft.current.breakpoint = breakpoint.name;
    }
  });

  return {
    buffer: newBuffer,
    metadata: newMetadata,
  };
}

function extractSharpOptions(options: SharpOptions = {}): SharpOptions {
  return {
    width: options.width,
    height: options.height,
    withoutEnlargement: options.withoutEnlargement,
    fit: options.fit,
    background: options.background,
    fastShrinkOnLoad: options.fastShrinkOnLoad,
    kernel: options.kernel,
    position: options.position,
  };
}
