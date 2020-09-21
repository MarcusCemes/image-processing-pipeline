/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  createManifestItem,
  ManifestItem,
  mapMetadata,
  Metadata,
  Pipeline,
  PipelineFormat,
} from "@ipp/common";
import { executePipeline } from "@ipp/core";
import { parse } from "path";
import { loader } from "webpack";
import { Options } from "./options";

const PREFERRED_SIZE = 1920;
const EXPRESSION_BRACES = "[]";
const EXPRESSION_MATCHER = /\[([a-zA-Z0-9:._-]+)\]/g;

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
  const production = ctx.mode === "production" || options.devBuild;

  const result = await executePipeline(
    production ? options.pipeline : ([{ pipe: "passthrough", save: true }] as Pipeline),
    source,
    { path: ctx.resourcePath }
  );

  const formats: FileFormat[] = result.formats.map((format) => {
    const ext = formatToExt(format.data.metadata.current.format);

    const parsedResourcePath = parse(ctx.resourcePath);
    const extendedMeta: Metadata = {
      ...format.data.metadata,
      source: {
        ...format.data.metadata.source,
        name: parsedResourcePath.name,
        base: parsedResourcePath.base,
        dir: parsedResourcePath.dir,
        ext: parsedResourcePath.ext,
      },
      current: {
        ...format.data.metadata.current,
        ext,
      },
    };

    const path = interpolateName(extendedMeta, options.outputPath);
    extendedMeta.current.path = path;

    extendedMeta.current.save =
      typeof format.saveKey === "string"
        ? interpolateName(extendedMeta, String(format.saveKey))
        : format.saveKey;

    ctx.emitFile(path, format.data.buffer, null);
    return {
      ...format,
      data: {
        ...format.data,
        metadata: extendedMeta,
      },
      file: path,
    };
  });

  return typeof options.manifest !== "undefined"
    ? createManifestItem({ ...result, formats }, options.manifest)
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

/** Generates the interpolated name for the save key */
function interpolateName(metadata: Metadata, name: string): string {
  const expressions: Record<string, string> = {};

  // Extract all template expressions into a object
  let match: RegExpExecArray | null;
  while ((match = EXPRESSION_MATCHER.exec(name)) !== null) {
    expressions[match[1]] = match[1];
  }

  const mappedExpressions = mapMetadata(metadata, expressions);

  // Replace each expression with its mapped value
  let newName = name;
  const [l, r] = EXPRESSION_BRACES;
  for (const [key, value] of Object.entries(mappedExpressions)) {
    newName = newName.replace(new RegExp(`\\${l}${key}\\${r}`, "g"), String(value));
  }

  return newName;
}

const EXTENSION_MAP: Record<string, string> = {
  jpeg: ".jpg",
  png: ".png",
  webp: ".webp",
  svg: ".svg",
  tiff: ".tiff",
  gif: ".gif",
};

function formatToExt(format: string): string {
  return EXTENSION_MAP[format] || "";
}
