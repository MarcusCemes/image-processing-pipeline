/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getOptions } from "loader-utils";
import { isBuffer } from "util";
import { loader } from "webpack";
import { IppError } from "./error";
import { checkOptions } from "./options";
import { runtime } from "./runtime";

export const ippLoader: loader.Loader = function ippLoader(source, map) {
  if (!isBuffer(source)) {
    throw new IppError("Source must be a buffer. This error is most likely caused by webpack");
  }

  // Create async loader
  const callback = this.async();
  if (typeof callback === "undefined") {
    throw new IppError("Could not create webpack async callback");
  }

  // Webpack configuration
  this.cacheable(true);

  // Validate options
  const options = getOptions(this);
  const validatedOptions = checkOptions(options);

  // Generate the images
  runtime(this, validatedOptions, source)
    .then((result) => callback(null, serialiseResult(result, validatedOptions.esModule), map))
    .catch((err) => callback(err));
};

function serialiseResult(obj: any, esModule: boolean): string {
  return (esModule ? `export default ` : `module.exports = `) + JSON.stringify(obj) + ";\n";
}

export const raw = true;
