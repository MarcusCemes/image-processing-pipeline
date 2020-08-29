/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Pipe, PipeException } from "@ipp/common";
import { posterize, PosterizeOptions, trace, TraceOptions, TURNPOLICY_MAJORITY } from "potrace";

const SUPPORTED_FORMATS = ["jpeg", "png", "bmp"];

export enum TraceMode {
  TRACE = "trace",
  POSTERIZE = "posterize",
}

export type TracePipeOptions =
  | {
      mode: TraceMode.TRACE;
      traceOptions: TraceOptions;
    }
  | {
      mode: TraceMode.POSTERIZE;
      traceOptions: PosterizeOptions;
    };

const DEFAULT_OPTIONS: TracePipeOptions = {
  mode: TraceMode.TRACE,
  traceOptions: {
    color: "lightgray",
    optTolerance: 0.4,
    turdSize: 100,
    turnPolicy: TURNPOLICY_MAJORITY,
  },
};

/**
 * A wrapper pipe around the potrace algorithm, originally by Peter Selinger. Generates
 * an SVG vector image using path tracing.
 *
 * @author http://potrace.sourceforge.net
 */
export const TracePipe: Pipe<Partial<TracePipeOptions>> = async (data, options) => {
  const parsedOptions: TracePipeOptions = {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
  };

  const format = data.metadata.current.format;
  if (!SUPPORTED_FORMATS.includes(format))
    throw new PipeException(`Unsupported image format: "${format}"`);

  const result = await new Promise<string>((res, rej) => {
    const traceFunction = options?.mode === TraceMode.POSTERIZE ? posterize : trace;
    traceFunction(data.buffer, parsedOptions.traceOptions, (err, svg) => {
      if (err) {
        rej(err);
      } else {
        res(svg);
      }
    });
  });

  return {
    buffer: Buffer.from(result),
    metadata: {
      ...data.metadata,
      current: {
        ...data.metadata.current,
        format: "svg",
      },
    },
  };
};

export default TracePipe;
