/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createManifestItem, ManifestItem, Metadata, Pipeline, PipelineFormat } from "@ipp/common";
import { executePipeline } from "@ipp/core";
import { interpolateName } from "loader-utils";
import { join } from "path";
import { loader } from "webpack";
import { Options } from "./options";

const PREFERRED_SIZE = 1920;

export interface SimpleExport {
  width?: number;
  height?: number;
  src?: string;
  srcset: Record<string, string>;
}

export type ManifestExport = ManifestItem;

type FileFormat = PipelineFormat & { file: string };

/**
 * The main processing function for the loader. Sends the source through `@ipp/core`
 * and emits the results to webpack. Returns a list of srcset entries or mapped metadata
 * depending on the options passed to the loader.
 *
 * @param ctx The `this` context of the webpack loader
 * @param options The loader options
 * @param source The `raw` image source for the loader to process
 */
export async function runtime(
  ctx: loader.LoaderContext,
  options: Options,
  source: Buffer
): Promise<SimpleExport | ManifestExport> {
  const fullBuild = ctx.mode === "production" || options.devBuild;

  const result = await executePipeline(
    fullBuild ? options.pipeline : ([{ pipe: "passthrough", save: true }] as Pipeline),
    source,
    { originalPath: ctx.resourcePath }
  );

  const formats = result.formats.map((format) => {
    // Run the generate file through the webpack interpolateName() utility
    const filename = generateFilename(ctx, options, format.data.buffer);

    // Register the generated file with webpack
    ctx.emitFile(join(options.outputPath || "./", filename), format.data.buffer, null);
    return {
      ...format,
      metadata: { ...format.data.metadata, path: filename },
      file: filename,
    };
  });

  return typeof options.manifest !== "undefined"
    ? createManifestItem(result, options.manifest)
    : {
        src: determineSrc(formats),
        srcset: generateMimeMap(formats),
        width: result.source.metadata.current.width,
        height: result.source.metadata.current.height,
      };
}

/** Takes an array of formats and creates an object, where keys are MIME types */
function generateMimeMap(formats: FileFormat[]): Record<string, string> {
  // Simple mode: build srcset strings
  const srcset: Record<string, [string, number][]> = {};

  for (const format of formats) {
    const mime = formatToMime(format.data.metadata.current.format);
    if (typeof srcset[mime] === "undefined") srcset[mime] = [];

    srcset[mime].push([format.file, format.data.metadata.current.width]);
  }

  const mimeMap: Record<string, string> = {};
  for (const [key, value] of Object.entries(srcset)) {
    mimeMap[key] = value.map(([f, w]) => `${f} ${w}w`).join(", ");
  }

  return mimeMap;
}

/**
 * Attempts to select the best candidate for the source property,
 * preferring JPEG images that are closes to the 1920px wide category.
 */
function determineSrc(formats: FileFormat[]): string | undefined {
  let bestFormat: FileFormat | undefined;

  for (const format of formats) {
    if (typeof bestFormat === "undefined") {
      bestFormat = format;
      continue;
    }

    if (betterMetadata(bestFormat.data.metadata, format.data.metadata)) bestFormat = format;
  }

  return bestFormat ? bestFormat.file : void 0;
}

/**
 * Compares the metadata of two formats, and returns true if the second format
 * is better suited for the `src` parameter.
 */
function betterMetadata(reference: Metadata, candidate: Metadata): boolean {
  const referenceFormat = reference.current.format;
  const referenceWidth = reference.current.width;
  const candidateFormat = candidate.current.format;
  const candidateWidth = candidate.current.width;

  // Prefer JPEG
  if (referenceFormat !== "jpeg" && candidateFormat === "jpeg") return true;
  if (referenceFormat === "jpeg" && candidateFormat !== "jpeg") return false;

  // Otherwise prefer WebP
  if (referenceFormat === "webp" && candidateFormat !== "webp" && candidateFormat !== "jpeg")
    return false;
  if (referenceFormat !== "webp" && referenceFormat !== "jpeg" && candidateFormat === "webp")
    return true;

  // Otherwise prefer size
  return Math.abs(PREFERRED_SIZE - candidateWidth) <= Math.abs(PREFERRED_SIZE - referenceWidth);
}

/** Generates the resulting filename using webpack's loader utilities */
function generateFilename(ctx: loader.LoaderContext, options: Options, source: Buffer) {
  return interpolateName(ctx, options.name, {
    context: options.context || ctx.rootContext,
    content: source,
    regExp: options.regExp,
  });
}

const MIME_MAP: { [index: string]: string } = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

/** A simple extension to MIME converter */
function formatToMime(format: string): string {
  return MIME_MAP[format] || "application/octet-stream";
}
