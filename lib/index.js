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
const RIBConfig = require(path.join(__dirname, 'config.js'));


/**
 * Responsive Image Builder (Copyright © 2018 Marcus Cemes)
 * An ultra-fast WebP image building pipeline, for the web.
 *
 * @param {Object} configuration:  A RIBConfig object, or compatible options
 * @param {String} [configuration.input] Path to the directory containing the images to process
 * @param {String} [configuration.output] Path where to output processed images
 * @param {Boolean} [configuration.manifest=true] Where to output a manifest.json file
 * @param {Boolean} [configuration.clean=false] Delete everything in OUTPUT before starting
 * @param {Boolean} [configuration.interactive=true] Make the program interactive in console (stdin)
 * @param {Number} [configuration.max_threads=0] The maximum number of threads to use (0 for cores availiable)
 * @param {Number} [configuration.vebosity=2] 2: Talkative 1: Errors 0: Silent 
 * @param {Boolean} [configuration.force=false] DANGEROUS! Create, overwrite and delete without asking!
 * @param {Boolean} [configuration.optimize=true] Optimize and compress JPEG and PNG images after resizing
 * @returns {Promise} A promise which will resolve when complete
 * @throws {Error} If a fatal error occurs (or promise rejection)
 */
const RIB = function(configuration) {

  // Factory to create an instance of the class
  if (!(this instanceof RIB)) {
    return new RIB(configuration);
  }

  const opt = new RIBConfig();
  opt.parse(configuration);  // Throws an error if they are not acceptable


  // Pass the options to the cluster controller
  return Master(opt);

}

module.exports = RIB;
