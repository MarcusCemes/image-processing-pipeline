/*
/      -- Responsive Image Builder --
/   -- Copyright (c) 2018 Marcus Cemes --
/   Build small and optimized web-ready images
/   in different sizes, multithreaded!
/
/   Provides an efficient way to build images
/   before the main build process.
/
/   Each image is compressed into each
/   provided export preset, before being saved
/   in the beautiful WebP codec as well
/   as its original legacy codec;
/
/   Supports JPEG, WebP, PNG, TIFF and SVG.
/   Utilizes the high-performance SHARP library
/   with lanczos3 downscaling.
/
/   Manifest schema under $schema/manifest.json
*/

import { IConfig, parseConfig } from "./Config";
import { IResult } from "./Interfaces";
import { main } from "./Main";

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
