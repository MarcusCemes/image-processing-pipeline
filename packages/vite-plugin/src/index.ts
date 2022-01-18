/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  createManifestItem,
  ManifestMappings,
  mapMetadata,
  Metadata,
  Pipeline,
  PipelineFormat,
} from "@ipp/common";
import { executePipeline } from "@ipp/core";
import { createFilter, dataToEsm } from "@rollup/pluginutils";
import { createReadStream, promises as fsPromises } from "fs";
import { posix } from "path";
import { Plugin, ResolvedConfig } from "vite";
import { IppPluginOptions, ManifestExport, SimpleExport } from "./types";

const { join, parse, resolve } = posix;
const { access, mkdir, readFile, writeFile } = fsPromises;

export type { IppPluginOptions, SimpleExport, ManifestExport };

type FileFormat = PipelineFormat & { file: string };

const PREFERRED_SIZE = 1920;
const EXPRESSION_BRACES = "[]";
const EXPRESSION_MATCHER = /\[([a-zA-Z0-9:._-]+)\]/g;

const defaultOptions = {
  include: "**/*.{heic,heif,avif,jpeg,jpg,png,tiff,webp,gif}",
  exclude: [],
  esModule: true,
  outputPath: "[hash:16][ext]",
  pipeline: [{ pipe: "passthrough", save: true }],
};

export function ippRollupVite(userOptions: Partial<IppPluginOptions> = {}): Plugin {
  const { exclude, include, manifest, outputPath, pipeline } = {
    ...defaultOptions,
    ...userOptions,
  };

  const filter = createFilter(include, exclude);

  let viteConfig: ResolvedConfig;

  return {
    name: "ipp",
    enforce: "pre",

    async configResolved(cfg) {
      viteConfig = cfg;
    },

    async load(id) {
      if (!filter(id)) return null;

      const sourcePath = resolve(viteConfig.base, id);
      const source = await readFile(sourcePath);

      const generatedObject = await runtime(
        pipeline,
        source,
        id,
        outputPath,
        async (fileName, source) => {
          if (viteConfig.mode === "production") {
            this.emitFile({
              type: "asset",
              source,
              fileName,
            });
            return fileName;
          } else {
            if (!viteConfig.cacheDir) {
              throw new Error("IPP requires cacheDir to be set during development!");
            }

            const cacheDir = resolve(viteConfig.cacheDir, "ipp-cache");
            const cachedFileName = join(cacheDir, fileName);

            console.log(cacheDir);

            try {
              await access(cacheDir);
            } catch {
              await mkdir(cacheDir);
            }

            await writeFile(cachedFileName, source);
            return join("/@ipp-dev", fileName);
          }
        },
        manifest
      );

      return dataToEsm(generatedObject, {
        preferConst: true,
        namedExports: viteConfig.json?.namedExports ?? true,
        compact: !!viteConfig.build.minify ?? false,
      });
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/@ipp-dev/")) {
          const [, fileName] = req.url.split("/@ipp-dev/");

          if (!viteConfig.cacheDir) {
            throw new Error("IPP requires cacheDir to be set during development!");
          }

          const cacheDir = resolve(viteConfig.cacheDir, "ipp-cache");
          const cachedFileName = join(cacheDir, fileName);

          const image = createReadStream(cachedFileName);
          const mime = formatToMime(parse(fileName).ext.substring(1));

          return new Promise((resolve) => {
            image.on("error", () => next());

            image.once("ready", () => {
              res.setHeader("Content-Type", mime);
              res.setHeader("Cache-Control", "max-age=360000");
              resolve(image.pipe(res));
            });
          });
        }

        next();
      });
    },
  };
}

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
  pipeline: Pipeline,
  source: Buffer,
  resourcePath: string,
  outputPath: string,
  saveFile: (filename: string, file: Buffer) => Promise<string>,
  manifest?: ManifestMappings
): Promise<SimpleExport | ManifestExport> {
  const result = await executePipeline(pipeline, source, { path: resourcePath });

  const formats: FileFormat[] = await Promise.all(
    result.formats.map(async (format) => {
      const ext = formatToExt(format.data.metadata.current.format);

      const parsedResourcePath = parse(resourcePath);
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

      const fileName = interpolateName(extendedMeta, outputPath);
      extendedMeta.current.path = fileName;

      extendedMeta.current.save =
        typeof format.saveKey === "string"
          ? interpolateName(extendedMeta, format.saveKey)
          : format.saveKey;

      const savedFileName = await saveFile(fileName, format.data.buffer);

      return {
        ...format,
        data: {
          ...format.data,
          metadata: extendedMeta,
        },
        file: savedFileName,
      };
    })
  );

  return manifest
    ? createManifestItem({ ...result, formats }, manifest)
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
