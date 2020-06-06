import { Pipe, PipeException } from "@rib/common";
import mozjpeg, { Options as JpegOptions } from "imagemin-mozjpeg";
import pngquant, { Options as PngOptions } from "imagemin-pngquant";
import svgo, { Options as SvgOptions } from "imagemin-svgo";

type CompressFunction = (image: Buffer) => Promise<Buffer>;

interface CompressOptions {
  softFail?: boolean;
  jpeg?: JpegOptions;
  png?: PngOptions;
  svg?: SvgOptions;
}

export const CompressPipe: Pipe<CompressOptions> = async (input, metadata, options = {}) => {
  const plugin = resolvePlugin(metadata.format, options);

  return {
    output: typeof plugin === "function" ? await plugin(input) : input,
    metadata,
  };
};

function resolvePlugin(format: string, options: CompressOptions): CompressFunction | undefined {
  switch (format) {
    case "jpeg":
      return mozjpeg(options.jpeg);
    case "png":
      return pngquant(options.png);
    case "svg":
      return svgo(options.svg);
    default:
      if (!options.softFail) throw new PipeException(`Cannot compress format ${format}`);
  }
}
