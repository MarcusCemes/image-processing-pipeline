// Responsive Image Builder - Worker/Convert
// Converts the image to a target codec
import sharp from "sharp";
import { Readable } from "stream";

/** Convert the input pipeline to a target format */
export function convert(pipeline: Readable, format: string, targetFormat: string): Readable {
  if (targetFormat !== format) {
    return pipeline.pipe(sharp().toFormat(targetFormat));
  } else {
    return pipeline;
  }
}
