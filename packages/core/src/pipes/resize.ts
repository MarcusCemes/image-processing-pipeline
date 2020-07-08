import { Metadata, Pipe, PipeResult } from "@ipp/common";
import sharp, { Raw, ResizeOptions as SharpOptions } from "sharp";

sharp.concurrency(1);

interface Breakpoint {
  name?: string;
  resizeOptions?: SharpOptions;
}

interface ResizeOptions {
  breakpoints?: Breakpoint[];
  resizeOptions?: SharpOptions;
  allowDuplicates?: boolean;
}

/**
 * A built-in pipe that lets you resize an image into a single size, or into multiple
 * different breakpoints. When creating breakpoints, duplicate sizes will be skipped.
 */
export const ResizePipe: Pipe<ResizeOptions> = async (input, metadata, options = {}) => {
  // Execute a single resize
  if (!options.breakpoints) return executeBreakpoint({ resizeOptions: options.resizeOptions }, input, metadata);

  // Execute a blind breakpoint resize
  if (options.allowDuplicates)
    return Promise.all(options.breakpoints.map((brk) => executeBreakpoint(brk, input, metadata)));

  // Disable upscaling, estimate the resulting size and remove any would-be-duplicates
  return Promise.all(
    options.breakpoints
      .map((brk) => ({ ...brk, resizeOptions: { withoutEnlargement: true, ...brk.resizeOptions } }))
      .filter(duplicateFilter(metadata.width, metadata.height, options.resizeOptions?.withoutEnlargement))
      .map((brk) => executeBreakpoint(brk, input, metadata))
  );
};

/**
 * Creates a stateful array filter so that, taking the `withoutEnlargement`
 * property into consideration, there will be a maximum of one breakpoint with
 * a given set of dimensions.
 *
 * During calculation, the size of the image diagonal is rounded to the nearest integer
 * to compensate for floating-point error;
 */
function duplicateFilter(width: number, height: number, withoutEnlargement = true): (brk: Breakpoint) => boolean {
  const previous: number[] = [];
  const diagonal = width * height;

  return (brk) => {
    const scaledDiagonal = calculateDiagonal(width, height, brk.resizeOptions?.width, brk.resizeOptions?.height);

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
function calculateDiagonal(width: number, height: number, targetWidth?: number, targetHeight?: number): number {
  const widthFactor = targetWidth ? targetWidth / width : Infinity;
  const heightFactor = targetHeight ? targetHeight / height : Infinity;

  const dominantFactor = Math.min(widthFactor, heightFactor);
  return width * height * (dominantFactor === Infinity ? 1 : dominantFactor);
}

/** Converts the breakpoint into a Sharp execution instance */
async function executeBreakpoint(breakpoint: Breakpoint, input: Buffer, metadata: Metadata): Promise<PipeResult> {
  const {
    data,
    info: { width, height, format, channels },
  } = await sharp(input, {
    raw:
      metadata.format === "raw"
        ? {
            width: metadata.width,
            height: metadata.height,
            channels: metadata.channels as Raw["channels"],
          }
        : void 0,
  })
    .resize(extractSharpOptions(breakpoint.resizeOptions))
    .toBuffer({ resolveWithObject: true });

  return {
    output: data,
    metadata: {
      ...metadata,
      width,
      height,
      format,
      channels,
      breakpoint: breakpoint.name,
    },
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
