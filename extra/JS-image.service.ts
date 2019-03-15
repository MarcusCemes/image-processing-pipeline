/*
 *                     RIB Image Service
 *        Cache-accelerated image resolving service
 * Requires an image manifest to work, made to work with RIB.
 *   https://github.com/MarcusCemes/responsive-image-builder
 */

// Helpers for this repository
import { IManifest } from "../src/Interfaces";

/**
 * Resolves an image from a RIB (responsive-image-builder) manifest file.
 * This returns an image object, with a a src property. Based on the image
 * export in the manifest export, a srcset will additionally be exported,
 * as well as WebP src (and srcset) properties if possible.
 */
export class ImageService {

  private static manifest: IManifest = require('../img/manifest.json');
  private static base       = "https://example.com/img/";
  private static cache: {[index: string]: Image} = {};

  /**
   * Resolves an image, and returns an Image object
   * @param {string} name The image name, without the extension
   * @returns {Image} The image object
   */ // tslint:disable member-ordering
  public static resolve(name: string): Image {

    if (this.cache[name]) {
      return this.cache[name];
    }

    for (const manifestExport of this.manifest.exports) {
      if (manifestExport.name === name) {

        const img = new Image(name);

        if (!manifestExport.sizes) {
          img.src = this.base + manifestExport.fullName + manifestExport.extension;
          if (manifestExport.webp) {
            img.webpSrc = this.base + manifestExport.fullName + ".webp";
          }
        } else {
          const srcs = [];
          const webpSrcs = [];
          let thumbnailSize = Infinity;

          for (const size of manifestExport.sizes) {
            srcs.push(`${this.base}${manifestExport.fullName}_${size.name}${manifestExport.extension} ${size.width}w`);
            if (manifestExport.webp) {
              webpSrcs.push(`${this.base}${manifestExport.fullName}.webp ${size.width}w`);
            }
            if (size.width < thumbnailSize) {
              img.thumbnail = `${this.base}${manifestExport.fullName}_${size.name}${manifestExport.extension}`;
              if (manifestExport.webp) {
                img.webpThumbnail = `${this.base}${manifestExport.fullName}_${size.name}.webp`;
              }
              thumbnailSize = size.width;
            }
          }

          img.srcset = srcs.join(', ');
          if (webpSrcs.length > 0) img.webpSrcset = webpSrcs.join(', ');
        }

        this.cache[name] = img;
        return img;
      }
    }

    console.error(`Failed to resolve image "${name}"`);
    this.cache[name] = new Image(name);
    return this.cache[name];

  }

}

/**
 * Represents a responsive image. Works well with RIB!
 * https://github.com/MarcusCemes/responsive-image-builder
 * Values may be _null_ if the image fails to resolve, or they
 * are not applicable (SVG has no srcset...)
 */
export class Image {

  /**
   * The name of the image, without the extension
   */
  name: string;

  /**
   * A url to the  default WebP image
   */
  webpSrc: string | null;

  /**
   * A srcset string to all WebP sizes
   */
  webpSrcset: string | null;

  /**
   * A url to the default image
   */
  src: string | null;

  /**
   * A srcset string to all image sizes
   */
  srcset: string | null;

  /**
   * A url to the smallest WebP image
   */
  webpThumbnail: string | null;

  /**
   * A url to the smallest WebP image
   */
  thumbnail: string | null;

  constructor(name: string) {
    this.name          = name;
    this.src           = null;
    this.srcset        = null;
    this.thumbnail  = null;
    this.webpSrc       = null;
    this.webpSrcset    = null;
    this.webpThumbnail = null;
  }

}
