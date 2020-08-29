/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Pipe, PipeException } from "@ipp/common";
import execa from "execa";
import { arch, platform } from "os";
import { join, resolve } from "path";

const VENDOR_DIR = resolve(__dirname, "..", "vendor");

const SUPPORTED_FORMATS = ["jpeg", "png"];

export enum PrimitiveMode {
  COMBO = 0,
  TRIANGLE = 1,
  RECTANGLE = 2,
  ELLIPSE = 3,
  CIRCLE = 4,
  ROTATED_RECTANGLE = 5,
  BEZIERS = 6,
  ROTATED_ELLIPSE = 7,
  POLYGON = 8,
}

export interface PrimitivePipeOptions {
  number: number;
  mode: PrimitiveMode;
  alpha: number;
  concurrency: number;
}

const DEFAULT_OPTIONS: PrimitivePipeOptions = {
  number: 16,
  mode: PrimitiveMode.TRIANGLE,
  alpha: 128,
  concurrency: 1,
};

/**
 * A wrapper pipe around the primitive algorithm by Michael Fogleman. Generates
 * an SVG vector image using geometric primitives. Not a deterministic algorithm.
 *
 * @author https://github.com/fogleman/primitive
 */
export const PrimitivePipe: Pipe<Partial<PrimitivePipeOptions>> = async (data, options) => {
  const parsedOptions: PrimitivePipeOptions = {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
  };

  const format = data.metadata.current.format;
  if (!SUPPORTED_FORMATS.includes(format))
    throw new PipeException(`Unsupported image format: "${format}"`);

  const flags: string[] = [];
  flags.push("-i", "-");
  flags.push("-o", "-");
  flags.push("-n", parsedOptions.number.toString());
  flags.push("-m", parsedOptions.mode.toString());
  flags.push("-a", parsedOptions.alpha.toString());
  flags.push("-j", parsedOptions.concurrency.toString());

  const executable = getExecutable();
  const { stdout } = await execa(executable, flags, { input: data.buffer as Buffer });

  return {
    buffer: Buffer.from(stdout),
    metadata: {
      ...data.metadata,
      current: {
        ...data.metadata.current,
        format: "svg",
      },
    },
  };
};

function getExecutable(): string {
  const a = arch();
  const p = platform();
  const e = p === "win32" ? ".exe" : "";

  return join(VENDOR_DIR, `primitive-${p}-${a}${e}`);
}

export default PrimitivePipe;
