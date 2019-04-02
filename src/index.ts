// Responsive Image Builder - index.ts
// The entry point to the program
import { IConfig, parseConfig } from "./Config";
import { IResult } from "./Interfaces";
import { main } from "./Main";

export * from "./Interfaces";
export { WorkerError } from "./worker/Interfaces";

/**
 * An ultra-fast responsive image building pipeline, for the web.
 * Resizes, compresses and optimizes a directory of images into
 * different sizes and codecs. Extremely fast, and with no compromises.
 *
 * Image resizing is done using the Lanczos3 algorithm, and never upscaled.
 * Images are saved as in the WebP codec, and in their original codec.
 *
 * All exported images are logged to a manifest.json file
 *
 * @param {IConfig} config The execution options
 *
 */
export async function responsiveImageBuilder(config: IConfig): Promise<IResult> {
  try {
    // Parse and fill in the config
    const parsedConfig: IConfig = parseConfig(config);

    // Run the main program logic
    const result: IResult = await main(parsedConfig);

    return result;
  } catch (err) {
    return {
      success: false,
      error: err
    };
  }
}
