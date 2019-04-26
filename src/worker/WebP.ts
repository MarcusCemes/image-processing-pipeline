// Responsive Image Builder - Worker/WebP
// Generates WebP image streams from a source image
import sharp from "sharp";

import { WORKER_ERRORS, WorkerError } from "./Interfaces";
import { IImageStreams } from "./Pipeline";
import { isSharpInstance } from "./Utility";

/** Adds a WebP stream to every non-WebP stream */
export function webp(
  imageStreams: IImageStreams,
  webpSettings: object = {},
  shouldFallback: boolean,
  shouldWebp: boolean
): IImageStreams {
  const newStreams: IImageStreams = [];

  if (!shouldFallback && !shouldWebp) {
    throw new WorkerError(WORKER_ERRORS.noStreamError);
  }

  for (const imageStream of imageStreams) {
    if (shouldFallback) {
      newStreams.push(imageStream);
    }

    if (shouldWebp && imageStream.format !== "webp") {
      newStreams.push({
        stream: (isSharpInstance(imageStream.stream)
          ? imageStream.stream.clone()
          : imageStream.stream.pipe(sharp())
        ).webp(webpSettings),
        format: "webp",
        size: imageStream.size,
        template: imageStream.template
      });
    }
  }

  return newStreams;
}
