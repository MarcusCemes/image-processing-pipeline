
/*                    The ImageService class
*                  Copyright © 2018 Marcus Cemes
*
*            Made to be used to Responsive Image Builder
*        https://github.com/MarcusCemes/responsive-image-builder
*
* This is an Angular (7) service that recieves an image src/srcset request.
* It returns an object which an <img> can bind to ( with [src] )
* When WebP support has been asyncronously detected (or not) with Modernizr,
* the original objects are updated with src and srcset URLs.
* 
* An error is thrown if an image is not resolved after a certain amount of time.
* The RIB image database is read from manifest.json
*
* While this example was taken from a working use-case, it may not work properly.
*                           Use it for inspiration.
*
*/


import { Injectable, NgZone } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import '../vendor/modernizr.js';
declare var Modernizr;

declare var require: any; // Best to put this in your typings file. It's useful.




/**
 * Provides an easy image object, containg basic information as well as
 * urls that can be bound-to in Angular.
 *
 * @class Image
 */
class Image {
  src: SafeUrl;    // For svg and thumbnails, as well as browser-fallback
  srcset: SafeUrl; // For responsive srcset
  name: string;
  extention: string;
  type: string;
  exports: Array<Object>;

  /**
   *Creates an instance of Image.
   * @param {string} name Filename of the image without the extention 
   * @param {string} extention The fallback image extention
   * @memberof Image
   */



  constructor(name: string, extention: string) {
    this.name = name;
    this.extention = extention;
    this.type = '';
    this.exports = [];

    // Make the properties bindable before they're initialized, without represting any URL
    this.src = '';
    this.srcset = '';
  }
}



/**
 * An Angular Injectable that provides access to images.
 * It chooses the best possible images and returns an object containing
 * a src and srcset propety.
 * 
 * To use, use the getImage() function.
 * Don't worry about calling it twice... It will return existing Image objects
 * if it finds them, otherwise it makes a new one.
 *
 * @class ImageService
 */
@Injectable({
  providedIn: 'root'
})
export class ImageService {

  webpSupport = false;

  sanitizer: DomSanitizer;

  manifest = require('../static/image/manifest.json'); // Inlines the JSON file as a javascript object! How cool is that!

  // The image database. Contains all the objects that have been returned by the service
  images: { name?: Image } = {};




/**
 *
 * This class returns the URL of a requested image resource.
 * It returns an object with dynamic src and srcset properties.
 * If the image has not yet been requested, this returns an object
 * with empty paths that can be bound to, while the image is resolved
 * asyncronously. The properties are then updated with the proper URLs.
 *
 * @param {*} name Image filename without the extention
 * @returns {Image} An image object that contains a src and srcset property (bindable). These will be dynamically updated when possible.
 * @memberof ImageService
 */
public getImage(name): Image {
    if (typeof this.images[name] === 'undefined') {
      this.createTemporaryImage(name);
    }
    return this.images[name];
  }



/**
 * Update an image in the image database
 *
 * @private
 * @param {string} name The name of the image to update
 * @param {string} extention The ect
 * @memberof ImageService
 */
private updateImage(name: string, extention: string) {
    if (typeof this.images[name] === 'undefined') {
      this.images[name] = new Image(name, extention);
    } else {
      const i = this.images[name];
      i.name = name; // I can't remember why I put this here
      i.extention = extention;
    }
  }



/**
 * Create a new Image object with empty URLs
 *
 * @private
 * @param {string} name
 * @memberof ImageService
 */
private createTemporaryImage(name: string) {
    if (typeof this.images[name] === 'undefined') {
      this.images[name] = new Image(name, '');
    }
  }

  /**
   * Builds the image's src and srcset properties, based on the manifest file
   *
   * @private
   * @param {Image} image
   * @param {{}} manifestExport
   * @memberof ImageService
   */
  private generateSource(image: Image, manifestExport: {}) {
    let srcset = '';
    let src = '';
    image.type = this.manifest['type'];
    if (manifestExport['type'] === 'src') {
      src = require('../static/image/' + manifestExport['src']);
    } else if (manifestExport['type'] === 'exports') {

      try {
        const compatibleType = this.webpSupport ? 'webp' : 'default';
          for (let i = 0; i < manifestExport['exports'].length; i++) {
            srcset += require('../static/image/' + manifestExport['exports'][i][compatibleType])
                    + ' ' + manifestExport['exports'][i]['width'] + 'w,';
            if (manifestExport['exports'][i]['fallback'] === true) {
              src = require('../static/image/' + manifestExport['exports'][i]['default']);
            }
          }
      } catch (Error) {
        console.error('ImageService: Unable to load image (REQUIRE FAILURE): ' + image.name + '.' + image.extention);
        console.error(Error);
      }

    } else {
      console.error('ImageService: Unrecognized image type: ' + manifestExport['type']);
    }

    image.srcset = this.sanitizer.bypassSecurityTrustUrl(srcset);
    image.src = this.sanitizer.bypassSecurityTrustUrl(src);
  }

  constructor(sanitizer: DomSanitizer, zone: NgZone) {
    const self = this;
    this.sanitizer = sanitizer;

    for (let i = 0; i < this.manifest.length; i++) {
      const m = this.manifest[i];
      this.updateImage(m.name, m.extention);
    }

    Modernizr.on('webp', function (result) {
      if (result) {
        self.webpSupport = true;
      } else {
        self.webpSupport = false;
      }

      // Update all bindings when complete, change detection not running due to event .on()
      zone.run(() => {
        for (let i = 0; i < self.manifest.length; i++) {
          self.generateSource(self.images[self.manifest[i].name], self.manifest[i]);
        }
      });

      setTimeout(() => {
        for (const image of Object.values(self.images)) {
          if (image.src === '' || image.srcset === '') {
            console.error('ImageService: Unable to resolve image ' + image.name + '.' + image.extention);
          }
        }
      }, 2000);
    });
  }
}
