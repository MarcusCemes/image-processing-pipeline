/*
*                     The ImageService class
*                  Copyright © 2018 Marcus Cemes
*
*            Made to be used with Responsive Image Builder
*        https://github.com/MarcusCemes/responsive-image-builder
*
* This is an Angular (7) service that responds to src/srcset requests.
* It returns an object which an <img> can bind to (with [src] and [srcset]).
* When WebP support has been asyncronously detected (or not) with Modernizr,
* the original objects are updated with src and srcset URLs.
*
* ImageService maintains a high-speed cache. Objects for the same requests
* are shared. Fetching an already resolved image will read the entry
* already present in cache, and return its shared singleton object.
*
* An error is logged in console if an image can not be resolved. The image
* database is read from the manifest.json file in the image directory.
*
* The path to the manifest.json file and the base path for images are
* hard coded into the four require(...) calls. This is to prevent Webpack
* from including EVERYTHING in the build. It's not possible to use variables,
* this strings have to be hard-coded into the function call.
*
* This class requires a manifest file to function! Visit the github link
* above for more information.
*
* Example usage: <img [src]="ImageService.get('image_name').src">
* This will bind to the property, and recieve the best image as soon
* as WebP support is decided!
*
*/

import { Injectable, NgZone } from '@angular/core';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';
import '../vendor/modernizr.js';  // Custom build of modernizr with WebP detection
declare var Modernizr;


class Manifest {
  exports: Array<ManifestExport>;
}

class ManifestExport {
  name: string;
  extention: string;
  type: string;
  path?: string;
  exports?: Array<ImageExport>;
}

class ImageExport {
  name: string;
  width: number;
  height: number;
  webp: string;
  fallback: string;
  default?: boolean;
}

/**
 *  Represents an Image object that <img> can bind
 * to with the [src] and [srcset] attributes.
 * @property {string} name The name of the image
 * @property {string} src  The src for binding <img [src]='...'>
 * @property {string} srcset  The srcset for binding <img [srcset]='...'>
 * @property {string} failed?  Whether the image failed to resolve
 * @property {string} resolved?  Whether the image resolved successfully
 * @class Image
 */
export class Image {
  name: string;
  src: SafeUrl;
  srcset: SafeUrl;
  failed?: boolean;
  resolved? : boolean;
  constructor() { this.src = ''; this.srcset = '' } // Otherwise bind will result in error
}



/**
 * Provides easy image resolution, maintaining a high-speed cache
 * for previously resolved images. There is no cost to fectching
 * the the same image twice.
 *
 * Intended to be used with Responsive Image Builder.
 * See https://github.com/MarcusCemes/responsive-image-builder
 *
 * @example <img [src]="ImageService.get('image_name').src">
 * @example <img [srcset]="ImageService.get('image_name').srcset">
 * @class ImageService
 */
@Injectable({
  providedIn: 'root'
})
export class ImageService {

  private sanitizer: DomSanitizer;
  private zone: NgZone;
  private initialized = false;

  private webp_support: boolean;  // Indicates whether the browser has WebpP support
  private manifest: Manifest;     // Contains the manifest.json file fetched with REQUIRE
  private manifest_exports_dictionary: Array<string>; // Fast access dictionaryh for manifest
  private images: Array<Image>;   // Contains all images returned by get, and those specified in the manifest
  private images_dictionary: Array<string>  // Fast access dictionary for images

  /**
   * Checks the cache for an existing image with the same name,
   * or generates a new Image. If WebP support has been decided,
   * the src and srcset properties will be generated before being
   * returned.
   *
   * @example <img [src]="ImageService.get('image_name').src">
   *
   * @memberof ImageService
   * @returns {Image} An Image object, that can be used in an Angular bind.
   */
  public get(name: string): Image {

    const IMAGES_LENGTH = this.images_dictionary.length;
    for (let i = 0; i < IMAGES_LENGTH; i++) {

      // Return the image if it is the correct one
      if (this.images_dictionary[i] === name) {
        return this.images[i];
      }

    }

    // Check whther the mainifest contains the image
    // If yes, generate a new image and return it
    const MANIFEST_LENGTH = this.manifest_exports_dictionary.length;
    for (let i = 0; i < MANIFEST_LENGTH; i++) {

      // If there is a manifest entry, create a new image
      // and append it to the images array
      if (name === this.manifest_exports_dictionary[i]){

        const new_image = new Image();
        new_image.name = name;
        if (this.initialized)
          this.generate_properties(new_image, this.manifest.exports[i]);

        this.images_dictionary[IMAGES_LENGTH] = name;
        this.images[IMAGES_LENGTH] = new_image;
        return new_image;

      }

    }

    // Will not be able to resolve the image, so fail and return a blank image
    console.error('ImageService: Unable to resolve image \'' + name + '\'');

    const failed_image = new Image();
    failed_image.resolved = false;
    failed_image.failed = true;

    this.images[IMAGES_LENGTH] = failed_image;
    this.images_dictionary[IMAGES_LENGTH] = name;

    return failed_image;

  }


  private init(webp_support): void {

    this.webp_support = webp_support;
    this.initialized = true;

    // Build src and srcset for each image
    // that have already been fetched
    // Run in NgZone to force binding updates
    this.zone.run(() => {
      const IMAGES_LENGTH = this.images_dictionary.length;
      const MANIFEST_LENGTH = this.manifest_exports_dictionary.length;
      for (let i = 0; i < IMAGES_LENGTH; i++) {

        if (!this.images[i].resolved) {
          let resolved = false;
          for (let j = 0; j < MANIFEST_LENGTH; j++) {

            if (this.manifest_exports_dictionary[j] === this.images_dictionary[i]) {

              // Create the src and srcset properties
              this.generate_properties(this.images[i], this.manifest.exports[j]);
              resolved = true;
              break;

            }
          }

          if (!resolved) console.error('ImageService: Failed to resolved image \'' + this.images_dictionary[i] + '\'');

        }
      }
    });

  }


  private generate_properties(image: Image, manifest_export: ManifestExport): void {

    if (!this.initialized) return;

    // Which export property to use
    const support = this.webp_support ? 'webp' : 'fallback';

    // Single path src, no srcset (svg)
    // require needs to have a hard coded path to the image folder
    if (manifest_export.type === 'single') {
      image.src =  this.sanitizer.bypassSecurityTrustUrl(require('../static/image/' + manifest_export.path));
      image.resolved = true;
      image.failed = false;

    // Generate srcset property
    } else if (manifest_export.type === 'multiple') {
      let srcset = '';
      const EXPORTS = manifest_export.exports.length;

      for (let i = 0; i < EXPORTS; i++) {

        // require needs to have a hard coded path to the image folder
        srcset += require('../static/image/' + manifest_export.exports[i][support]) + ' ' + manifest_export.exports[i]['width'] + 'w,';


        // require needs to have a hard coded path to the image folder
        if (manifest_export.exports[i].default)
          image.src = this.sanitizer.bypassSecurityTrustUrl(require('../static/image/' + manifest_export.exports[i][support]));

      }

      image.srcset = this.sanitizer.bypassSecurityTrustUrl(srcset);

      image.resolved = true;
      image.failed = false;

    } else {
      console.error('ImageService: Unrecognised type ' + manifest_export.type + ' for image ' + manifest_export.name);
    }

  }


  constructor(sanitizer: DomSanitizer, zone: NgZone) {

    // Store the sanitizer service
    this.sanitizer = sanitizer;
    this.zone = zone;

    // This require requires a hard-coded URL to avoid including everything in the build
    this.manifest = require('../static/image/manifest.json');
    this.manifest_exports_dictionary = new Array();
    this.images = new Array();
    this.images_dictionary = new Array();

    // Build the manifest dictionary
    const END = this.manifest.exports.length;
    for (let i = 0; i < END; i++) {
      this.manifest_exports_dictionary[i] = this.manifest.exports[i].name;
    }

    // Asynchronously check for WebP support
    // Pass this context with bind
    Modernizr.on('webp', this.init.bind(this));
  }

// END IMAGESERVICE
}
