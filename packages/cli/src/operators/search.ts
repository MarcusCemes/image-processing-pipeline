/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@ipp/common";
import Denque from "denque";
import { Dirent, promises } from "fs";
import { parse, relative, resolve } from "path";
import { createObjectStream, ObjectStream } from "../lib/stream/object_stream";
import { TaskSource } from "./types";

const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".gif", ".svg"];

enum Type {
  FILE,
  DIRECTORY,
}

export function searchForImages(paths: string[]): ObjectStream<TaskSource | Exception> {
  return createObjectStream(searchPaths(paths));
}

async function* searchPaths(paths: string[]): AsyncGenerator<TaskSource | Exception> {
  for (const path of paths) {
    for await (const result of searchPath(path)) {
      yield result;
    }
  }
}

async function* searchPath(path: string): AsyncGenerator<TaskSource | Exception, void> {
  switch (await getFileType(path)) {
    case Type.FILE: {
      const parsedPath = parse(path);
      if (isImage(parsedPath.base))
        yield {
          root: parsedPath.dir,
          file: parsedPath.base,
        };

      break;
    }

    case Type.DIRECTORY:
      for await (const result of walkDirectory(path)) {
        yield result;
      }
  }
}

async function* walkDirectory(path: string): AsyncGenerator<TaskSource | Exception> {
  const queue = new Denque<string>([path]);

  while (queue.length !== 0)
    try {
      const currentPath = queue.shift() as string;
      const dir = await promises.opendir(currentPath);

      for await (const item of dir)
        switch (getType(item)) {
          case Type.DIRECTORY:
            queue.push(resolve(currentPath, item.name));
            break;

          case Type.FILE:
            if (isImage(item.name))
              yield {
                root: path,
                file: relative(path, resolve(currentPath, item.name)),
              };
        }
    } catch (err) {
      yield formatError(err, path);
    }
}

function formatError(err: any, path: string): Exception {
  if (!(err instanceof Error)) return new Exception("Search Error: Thrown object was not an Error");
  return new Exception(`Search error for ${path}: ${err.message}`).extend(err);
}

function isImage(name: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(parse(name).ext);
}

function getType(entry: Dirent): Type | null {
  if (entry.isFile()) return Type.FILE;
  if (entry.isDirectory()) return Type.DIRECTORY;
  return null;
}

async function getFileType(path: string): Promise<Type | null> {
  const stat = await promises.stat(path);
  if (stat.isFile()) return Type.FILE;
  if (stat.isDirectory()) return Type.DIRECTORY;
  return null;
}
