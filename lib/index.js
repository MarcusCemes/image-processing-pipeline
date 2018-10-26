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
/s
/   Supports JPEG, WebP, PNG, TIFF and SVG.
/   Utilizes the high-performance SHARP library
/   with lanczos3 downscaling.
/
/   Manifest schema under $schema/manifest.json
*/

/** IMPORTS  **/
const path = require('path');
const Master = require(path.join(__dirname, 'master.js'));
const Options = require(path.join(__dirname, 'options.js'));


/**
 * Constructor factory to create an instance of RIB, which can be used to execute the 
 *
 * @param {Object} [options]:  The configuration to use
 * @returns A RIB instance
 */
const RIB = function(options) {

  // Factory to create an instance of the class
  if (!(this instanceof RIB)) {
    return new RIB(options);
  }

  const opt = new Options();
  opt.parse(options);  // Throws an error if they are not acceptable


  // Pass the options to the cluster controller
  return Master(opt);

}

module.exports = RIB;
