import { Pipe, PipeException } from "@rib/common";
import sharp, { Raw, Sharp } from "sharp";

interface ConvertOptions {
  format: string;
  convertOptions?: Parameters<Sharp["toFormat"]>[1];
}

export const ConvertPipe: Pipe<ConvertOptions> = async (input, metadata, options) => {
  if (!options || !options.format) throw new PipeException('Missing "format" option');

  const {
    data,
    info: { width, height, channels, format },
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
    .toFormat(options.format === "original" ? metadata.originalFormat : options.format, options.convertOptions)
    .toBuffer({ resolveWithObject: true });

  return {
    output: data,
    metadata: {
      ...metadata,
      width,
      height,
      channels,
      format,
    },
  };
};
