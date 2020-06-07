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

interface PrimitivePipeOptions {
  number?: number;
  mode?: PrimitiveMode;
  alpha?: number;
  concurrency?: number;
}

const DEFAULT_OPTIONS: PrimitivePipeOptions = {
  number: 16,
  mode: PrimitiveMode.TRIANGLE,
  alpha: 128,
  concurrency: 1,
};

export const PrimitivePipe: Pipe<PrimitivePipeOptions> = async (input, metadata, options?) => {
  const parsedOptions: PrimitivePipeOptions = {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
  };

  if (SUPPORTED_FORMATS.indexOf(metadata.format) === -1)
    throw new PipeException("Unsupported image format: " + metadata.format);

  const flags = [];
  flags.push("-i", "-");
  flags.push("-o", "-");
  flags.push("-n", parsedOptions.number!.toString());
  flags.push("-m", parsedOptions.mode!.toString());
  flags.push("-a", parsedOptions.alpha!.toString());
  flags.push("-j", parsedOptions.concurrency!.toString());

  const executable = getExecutable();
  const { stdout } = await execa(executable, flags, { input });

  return {
    output: Buffer.from(stdout),
    metadata: {
      ...metadata,
      format: "svg",
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
