// Responsive Image Builder - Worker/Optimize
// Optimizes image data
import { Duplex } from "stream";

import { IImageStreams } from "./Pipeline";

export const OPTIMIZERS: {
  [index: string]: (settings: any) => (data: Buffer | string) => Promise<Buffer | string>;
} = {
  png: require("imagemin-pngquant"),
  jpeg: require("imagemin-mozjpeg"),
  svg: require("imagemin-svgo"),
  gif: require("imagemin-gifsicle")
};

/** Optimize non-webp image streams */
export function optimize(imageStreams: IImageStreams, optimizerSettings: any): IImageStreams {
  const optimizedStreams: IImageStreams = [];

  for (const imageStream of imageStreams) {
    if (imageStream.format !== "webp") {
      const optimizerFactory = OPTIMIZERS[imageStream.format];
      if (optimizerFactory) {
        optimizedStreams.push({
          stream: imageStream.stream.pipe(
            createOptimizerStream(optimizerFactory(optimizerSettings))
          ),
          format: imageStream.format,
          size: imageStream.size,
          template: imageStream.template
        });
      }
    } else {
      optimizedStreams.push(imageStream);
    }
  }

  return optimizedStreams;
}

/** Optimize a stream with a Promise-returning optimizer function */
function createOptimizerStream(
  optimizer: (data: string | Buffer) => Promise<string | Buffer>
): Duplex {
  const buffer = [];

  return new Duplex({
    read(size) {
      /* */
    },

    write(chunk, encoding, callback) {
      buffer.push(chunk);
      callback();
    },

    final(callback) {
      const data: Buffer | string = Buffer.isBuffer(buffer[0])
        ? Buffer.concat(buffer)
        : buffer.join("");
      optimizer(data)
        .then((optimizedImage: string | Buffer) => {
          this.push(optimizedImage);
          this.push(null);
          callback();
        })
        .catch(callback);
    }
  });
}
