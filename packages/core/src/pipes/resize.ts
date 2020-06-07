import { Pipe } from "@ipp/common";
import sharp, { Raw, ResizeOptions as SharpOptions } from "sharp";

sharp.concurrency(1);

interface Task {
  name?: string;
  resizeOptions?: SharpOptions;
}

interface ResizeOptions {
  resizeOptions?: SharpOptions;
  breakpoints?: Task[];
}
// extractSharpOptions(options.resizeOptions || {})
export const ResizePipe: Pipe<ResizeOptions> = async (input, metadata, options = {}) => {
  const tasks: Task[] = options.breakpoints
    ? options.breakpoints
    : [{ name: void 0, resizeOptions: options.resizeOptions }];

  return Promise.all(
    tasks.map(async (task) => {
      const {
        data,
        info: { width, height, format, channels },
      } = await sharp(input, {
        raw:
          metadata.format === "raw"
            ? {
                width: metadata.width,
                height: metadata.height,
                channels: metadata.channels as Raw["channels"],
              }
            : void 0,
      })
        .resize(extractSharpOptions(task.resizeOptions))
        .toBuffer({ resolveWithObject: true });

      return {
        output: data,
        metadata: {
          ...metadata,
          width,
          height,
          format,
          channels,
          breakpoint: task.name,
        },
      };
    })
  );
};

function extractSharpOptions(options: SharpOptions = {}): SharpOptions {
  return {
    width: options.width,
    height: options.height,
    withoutEnlargement: options.withoutEnlargement,
    fit: options.fit,
    background: options.background,
    fastShrinkOnLoad: options.fastShrinkOnLoad,
    kernel: options.kernel,
    position: options.position,
  };
}
