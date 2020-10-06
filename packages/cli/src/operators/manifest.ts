/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createManifestItem, Exception, ManifestMappings } from "@ipp/common";
import { createWriteStream, WriteStream } from "fs";
import { Operator } from "../lib/stream/object_stream";
import { map } from "../lib/stream/operators/map";
import { isSavedResult, SavedResult } from "./types";

export function saveManifest<T>(
  path: string,
  mappings: ManifestMappings
): Operator<T | SavedResult, T | Exception> {
  let manifestStream: WriteStream | null = null;

  return map<T | SavedResult, T | Exception>(
    (item) => {
      if (!isSavedResult(item)) return item;

      if (!manifestStream) manifestStream = createManifestStream(path);

      const manifest = createManifestItem(item.savedResult, mappings);
      manifestStream.write(JSON.stringify(manifest));

      return null;
    },

    () =>
      new Promise((res) => {
        if (manifestStream !== null) {
          manifestStream.end("]", () => res());
        } else {
          res();
        }
      })
  );
}

function createManifestStream(path: string): WriteStream {
  const stream = createWriteStream(path);
  stream.write("[");
  return stream;
}
