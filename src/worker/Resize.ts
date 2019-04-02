// Responsive Image Builder - Worker/Resize
// Resizes images based on export presets
import sharp from "sharp";
import { Readable } from "stream";

import { IExportSize } from "../Interfaces";
import { ImageStreams } from "./Pipeline";

export function resize(
  pipeline: Readable,
  format: string,
  exportSizes: IExportSize[]
): ImageStreams {
  const resizedStreams: ImageStreams = [];

  if (!exportSizes) {
    // Single export
    resizedStreams.push({
      stream: pipeline,
      format
    });
  } else {
    // Multiple export
    const sharpStream = pipeline.pipe(sharp());
    for (const exportSize of exportSizes) {
      resizedStreams.push({
        stream: sharpStream
          .clone()
          .resize(exportSize.width, exportSize.height, { fit: "inside", withoutEnlargement: true }),
        format,
        size: exportSize
      });
    }
  }

  return resizedStreams;
}
