// Responsive Image Builder - Worker/WebP
// Generates WebP image streams from a source image
import sharp from "sharp";

import { WORKER_ERRORS, WorkerError } from "./Interfaces";
import { ImageStreams } from "./Pipeline";
import { isSharpInstance } from "./Utility";

/** Adds a WebP stream to every non-WebP stream */
export function createWebpStreams(
  imageStreams: ImageStreams,
  webpSettings: object = {},
  shouldFallback: boolean,
  shouldWebp: boolean
): ImageStreams {
  const newStreams: ImageStreams = [];

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
        size: imageStream.size
      });
    }
  }

  return newStreams;
}
