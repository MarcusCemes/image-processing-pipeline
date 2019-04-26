// Responsive Image Builder - Worker/Trace
// Create an placeholder traced SVG image
import svgo from "imagemin-svgo";
import potrace from "potrace";
import sharp from "sharp";
import { Duplex, Readable } from "stream";

import { IImageStream } from "./Pipeline";

/** Create a traced SVG image */
export function trace(pipeline: Readable, traceTemplate: string, traceOptions: any): IImageStream {
  // potrace only supports png, jpeg and bmp, and we don't need high SVG
  const converter = sharp()
    .png({
      adaptiveFiltering: false
    })
    .resize(400, 300, { fit: "inside", withoutEnlargement: true });

  return {
    format: "svg",
    template: traceTemplate,
    stream: pipeline.pipe(converter).pipe(createTraceStream(traceOptions))
  };
}

/** Create a SVG tracing stream */
function createTraceStream(traceOptions: any): Duplex {
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
      potrace.trace(data, traceOptions, (err, svg) => {
        if (!err) {
          // Optimize heavily
          const optimizer = svgo({ multipass: true, floatPrecision: 0 });
          optimizer(svg)
            .then((optimizedImage: string | Buffer) => {
              this.push(optimizedImage);
              this.push(null);
              callback();
            })
            .catch(callback);
        }
      });
    }
  });
}
