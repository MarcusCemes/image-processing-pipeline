import { slash } from "@rib/common";
import glob from "fast-glob";
import { promises } from "fs";
import { dirname, join, relative } from "path";

/** Supported image extensions */
export const EXTENSIONS = ["jpg", "jpeg", "png", "gif", "tiff", "webp", "svg"];

/**
 * Iterates over a set of input directories or files, searches them for images.
 * Returns a complete list of images and their corresponding output paths.
 */
export async function findImages(
  inputs: string | string[],
  output: string,
  flat = false
): Promise<{ i: string; o: string }[]> {
  const resolvedImages: { i: string; o: string }[] = [];

  for (const input of typeof inputs === "string" ? [inputs] : inputs) {
    if ((await promises.stat(input)).isDirectory()) {
      const files = await glob(slash(join(input, `**/*.{${EXTENSIONS.join(",")}}`)));

      for (const file of files) {
        const outputPath = flat ? output : join(output, dirname(relative(input, file)));
        resolvedImages.push({ i: file, o: outputPath });
      }
    } else {
      resolvedImages.push({ i: input, o: output });
    }
  }

  return resolvedImages;
}
