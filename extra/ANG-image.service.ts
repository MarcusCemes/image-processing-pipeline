/*
 *                     The ImageService class
 *                 Copyright © 2018 Marcus Cemes
 *                   Licensed under Apache-2.0
 *
 *            Made to be used with Responsive Image Builder
 *        https://github.com/MarcusCemes/responsive-image-builder
 *
 * This is an Angular (7) service that responds to src/srcset requests.
 * It returns an object which an <img> can bind to (with [src] and [srcset]).
 * When WebP support has been asynchronously detected (or not) with Modernizr,
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
 * from including EVERYTHING in the build. It's not possible to set these
 * at runtime without some extra WebPack logic.
 *
 * Example usage: <img [src]="ImageService.get('image_name').src">
 * This will bind to the property, and resolve the best image as soon
 * as WebP support is decided!
 *
 */

import { Injectable, NgZone } from "@angular/core";
import { SafeUrl, DomSanitizer } from "@angular/platform-browser";
import "../vendor/modernizr.js"; // Custom build of modernizr with WebP detection
declare var Modernizr;

// Import these from the responsive-image-builder module, these are just
// here to help inside of the GitHub repository.
import { IManifest, IExport } from "../src/Interfaces";

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
  resolved?: boolean;
  constructor() {
    this.src = "";
    this.srcset = "";
  } // Otherwise bind will result in error
}

/**
 * Provides easy image resolution, maintaining a high-speed cache
 * for previously resolved images. There is no additional cost
 * when fetching the same image twice.
 *
 * Intended to be used with Responsive Image Builder.
 * See https://github.com/MarcusCemes/responsive-image-builder
 *
 * Requires a DomSanitizer and NgZone in order to work correctly.
 *
 * @example <img [src]="ImageService.get('image_name').src">
 * @example <img [srcset]="ImageService.get('image_name').srcset">
 * @class ImageService
 */
@Injectable({
  providedIn: "root"
})
export class ImageService {
  private sanitizer: DomSanitizer;
  private zone: NgZone;
  private initialized = false; // Async initialization when WebP support is decided
  private webpSupport: boolean; // Indicates whether the browser has WebP support

  private manifest: IManifest;
  private cache: Image[]; // Contains all images returned by get, and those specified in the manifest

  /**
   * Create a new instance, start checking for WebP and queue initialization
   */
  constructor(sanitizer: DomSanitizer, zone: NgZone) {
    this.sanitizer = sanitizer;
    this.zone = zone;

    this.manifest = require("../img/manifest.json");
    this.cache = [];

    // Check for WebP support asynchronously. Once complete,
    // start the service initialization process.
    Modernizr.on("webp", this.init.bind(this));
  }

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
    // Return existing cache entry
    for (const image of this.cache) {
      if (image.name === name) {
        return image;
      }
    }

    // Search the manifest file for a compatible image
    for (const manifestExport of this.manifest.exports) {
      if (manifestExport.name === name) {
        const resolvedImage = new Image();
        resolvedImage.name = name;

        if (this.initialized) {
          this.generateProperties(resolvedImage, manifestExport, this.webpSupport);
        }

        this.cache.push(resolvedImage);
        return resolvedImage;
      }
    }

    // Return a blank image for failed image resolution
    console.error("ImageService: Unable to resolve image '" + name + "'");

    const failedImage = new Image();
    failedImage.resolved = false;
    failedImage.failed = true;
    failedImage.name = name;
    this.cache.push(failedImage);

    return failedImage;
  }

  /**
   * Initialize the service once WebP support has been decided
   * This will fill in all src and srcset information of already
   * queried images that reside in the cache, updating any images
   * fetched before initializing.
   */
  private init(webpSupport): void {
    this.webpSupport = webpSupport;
    this.initialized = true;

    // Update previously queried images, and force binding updates with NgZone
    this.zone.run(() => {
      for (const image of this.cache) {
        for (const manifestExport of this.manifest.exports) {
          if (manifestExport.name === image.name) {
            this.generateProperties(image, manifestExport, webpSupport);
            break;
          }
        }
        image.failed = true;
        image.resolved = false;
        console.error("ImageService: Failed to resolved image '" + name + "'");
      }
    });
  }

  /**
   * Generate an images src and srcset properties based on a manifest export and webpSupport
   */
  private generateProperties(image: Image, manifestExport: IExport, webpSupport: boolean): void {
    // Can't do anything yet... This will be called again later.
    if (!this.initialized) return;

    // Which export property to use
    const extension = webpSupport ? ".webp" : manifestExport.extension;

    // Build src or srcset properties
    if (!manifestExport.sizes) {
      image.src = this.sanitizer.bypassSecurityTrustUrl(
        require("../img/" + manifestExport.fullName + extension)
      );
    } else {
      let srcset = "";
      for (const size of manifestExport.sizes) {
        srcset +=
          require("../img/" +
            manifestExport.fullName +
            "_" +
            size.name +
            manifestExport.extension) +
          " " +
          size.width +
          "w,";
        if (size.default && size.default === true) {
          image.src = this.sanitizer.bypassSecurityTrustUrl(
            require("../img/" +
              manifestExport.fullName +
              "_" +
              size.name +
              manifestExport.extension)
          );
        }
      }
      image.srcset = this.sanitizer.bypassSecurityTrustUrl(srcset);
    }

    image.resolved = true;
    image.failed = false;
  }
}
