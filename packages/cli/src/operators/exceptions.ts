/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@ipp/common";
import { createWriteStream } from "fs";
import { CliException } from "../lib/exception";
import { Operator } from "../lib/stream/object_stream";
import { map } from "../lib/stream/operators/map";

interface ExceptionWriter {
  write: (exception: Exception) => void;
  end: () => void;
}

export function saveExceptions<T>(path: string): Operator<T | Exception, T> {
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
