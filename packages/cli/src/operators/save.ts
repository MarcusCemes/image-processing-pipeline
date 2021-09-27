/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, interpolateTemplates, PipelineFormat, PipelineFormats } from "@ipp/common";
import { F_OK } from "constants";
import { promises } from "fs";
import { parse, relative, resolve } from "path";
import { pathMetadata } from "../lib/metadata";
import { Operator } from "../lib/stream/object_stream";
import { mapParallel } from "../lib/stream/operators/map_parallel";
import { CompletedTask, isCompletedTask, SavedResult } from "./types";

const SAVE_CONCURRENCY = 4;
const DEFAULT_TEMPLATE = "[name]-[hash:8][ext]";

export function saveImages<T>(
  path: string,
  flat: boolean
): Operator<T | CompletedTask, T | SavedResult | Exception> {
  const startTime = Date.now();

  return mapParallel<T | CompletedTask, T | SavedResult | Exception>(
    SAVE_CONCURRENCY,
    async (item) => {
      if (!isCompletedTask(item)) return item;

      const errors: Exception[] = [];

      const { dir } = parse(item.file);

      const savedFormats: PipelineFormats = [];

      for (const format of item.result.formats) {
        const finalMetadata = {
          ...format.data.metadata,
          current: {
            ...format.data.metadata.current,
            ext: formatToExt(format.data.metadata.current.format),
          },
        };

        const template = typeof format.saveKey === "string" ? format.saveKey : DEFAULT_TEMPLATE;
        const interpolatedTemplate = interpolateTemplates(finalMetadata, template);
        const outputDir = flat ? path : resolve(path, dir);
        const outputPath = resolve(outputDir, interpolatedTemplate);

        try {
          await ensureDirectory(outputDir);

          const modified = await getLastModifiedTime(outputPath);
          if (modified !== null && modified > startTime) {
            throw new Exception(
              `Filename conflict! The following filename has already been used: "${outputPath}"`
            );
          }

          await promises.writeFile(outputPath, format.data.buffer);

          savedFormats.push(formatWithNewPath(format, relative(path, outputPath)));
        } catch (err) {
          errors.push(
            err instanceof Exception
              ? err
              : new Exception(
                  `Failed to save image, the manifest may be inconsistent:\n${
                    (err as Error).message
                  }`
                ).extend(err as Error)
          );
        }
      }

      return errors.length === 0
        ? {
            savedResult: {
              source: item.result.source,
              formats: savedFormats,
            },
          }
        : errors;
    }
  );
}

async function ensureDirectory(path: string): Promise<void> {
  try {
    await promises.access(path, F_OK);
    const stat = await promises.stat(path);

    if (!stat.isDirectory()) throw null;
  } catch {
    await promises.mkdir(path, { recursive: true });
  }
}

async function getLastModifiedTime(path: string): Promise<number | null> {
  try {
    return (await promises.stat(path)).mtimeMs;
  } catch {
    return null;
  }
}

function formatWithNewPath(format: PipelineFormat, path: string): PipelineFormat {
  return {
    ...format,
    data: {
      ...format.data,
      metadata: {
        ...format.data.metadata,
        current: {
          ...format.data.metadata.current,
          ...pathMetadata(path),
        },
      },
    },
  };
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
