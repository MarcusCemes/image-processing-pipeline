/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@ipp/common";
import { createWriteStream } from "fs";
import { resolve } from "path";
import { CliException } from "../lib/exception";
import { Operator } from "../lib/stream/object_stream";
import { map } from "../lib/stream/operators/map";

const DEFAULT_ERROR_FILE = "errors.json";

export type ExceptionFn = (exception: Exception) => void | Promise<void>;

interface ExceptionWriter {
  write: ExceptionFn;
  end: () => void;
}

export function exceptionHandler<T>(
  outputPath: string,
  target?: string | ExceptionFn
): Operator<T | Exception, T> {
  switch (typeof target) {
    case "string": {
      const path = resolve(outputPath, target);
      return saveExceptions(path);
    }

    case "function":
      return mapExceptions(target);

    default: {
      const path = resolve(outputPath, DEFAULT_ERROR_FILE);
      return saveExceptions(path);
    }
  }
}

function saveExceptions<T>(path: string): Operator<T | Exception, T> {
  let writer: ExceptionWriter | null = null;

  return map<T | Exception, T>(
    (item) => {
      if (!(item instanceof Exception)) return item;

      if (writer === null) writer = createExceptionWriter(path);
      writer.write(item);

      return null;
    },

    () => writer?.end()
  );
}

function createExceptionWriter(path: string): ExceptionWriter {
  let first = true;
  const stream = createWriteStream(path);

  stream.write("[");

  return {
    write: (exception) => {
      const additional =
        exception instanceof CliException
          ? {
              title: exception.title,
              code: exception.code,
              comment: exception.comment,
            }
          : {};

      if (first) {
        first = false;
      } else {
        stream.write(",");
      }

      stream.write(
        JSON.stringify({
          name: exception.name,
          message: exception.message,
          ...additional,
        })
      );
    },
    end: () => {
      stream.write("]");
      stream.end();
    },
  };
}

function mapExceptions<T>(callback: ExceptionFn): Operator<T | Exception, T> {
  return map<T | Exception, T>(async (item) => {
    if (!(item instanceof Exception)) {
      return item;
    }

    await callback(item);
    return null;
  });
}
