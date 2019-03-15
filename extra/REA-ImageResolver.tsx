/*
 *                      React ImageResolver
 *                 Copyright © 2018 Marcus Cemes
 *                   Licensed under Apache-2.0
 *
 *          Made to be used with Responsive Image Builder
 *      https://github.com/MarcusCemes/responsive-image-builder
 *
 * A Higher Order Component that resolves an image to help load a WebPicture,
 * another custom React component. Requires a RIB manifest file
 *
 */
import React from "react";

// The manifest file is provided through a context
import { ImageContext } from "../../../services/ContextProviders";

// Helpers for this repository
import { IManifest } from "../src/Interfaces";

/**
 * Generic type utility to subtract keys from one interface from the other.
 */
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Remove from T the keys that are in common with K
 */
type Optionalize<T extends K, K> = Omit<T, keyof K>;

interface Props {
  image: string;
  lazy?: boolean;
}

interface InjectedProps {
  sources: ImageSources;
  lazy?: boolean;
  onLoad?: () => void;
}

interface ImageSources {
  webpThumbnail?: string;
  webpSrc?: string;
  webpSrcset?: string;
  thumbnail?: string;
  src?: string;
  srcset?: string;
}

function resolve(
  name: string,
  manifest: IManifest,
  base: string = ""
): ImageSources {
  const sources: ImageSources = {};
  for (const manifestExport of manifest.exports) {
    if (manifestExport.name === name) {
      if (!manifestExport.sizes) {
        sources.src = base + manifestExport.fullName + manifestExport.extension;
        return sources;
      } else {

        const srcs = [];
        const webpSrcs = [];
        let thumbnailSize = Infinity;

        for (const size of manifestExport.sizes) {
          srcs.push(`${base}${manifestExport.fullName}_${size.name}${manifestExport.extension} ${size.width}w`);
          if (manifestExport.webp) {
            webpSrcs.push(`${base}${manifestExport.fullName}.webp ${size.width}w`);
          }
          if (size.width < thumbnailSize) {
            sources.thumbnail = `${base}${manifestExport.fullName}_${size.name}${manifestExport.extension}`;
            if (manifestExport.webp) {
              sources.webpThumbnail = `${base}${manifestExport.fullName}_${size.name}.webp`;
            }
            thumbnailSize = size.width;
          }
        }

        sources.srcset = srcs.join(', ');
        if (webpSrcs.length > 0) sources.webpSrcset = webpSrcs.join(', ');
        return sources;

      }

    }
  }

  return sources;
}

/**
 * Generates a Higher Order Component to resolve a image using a RIB manifest
 * for a WebPicture component
 */
export function imageResolver<T extends InjectedProps = InjectedProps>(
  Component: React.ComponentType<T>
) {
  const displayName = Component.displayName || Component.name || "Component";

  // Creating the inner component. The calculated Props type here is the where the magic happens.
  return class ImageResolver extends React.Component<
    Optionalize<T, InjectedProps> & Props
  > {
    public static displayName = `imageResolver(${displayName})`;

    public render() {
      const { image, ...props } = this.props;
      return (
        <ImageContext.Consumer>
          {context => {
            const sources = resolve(image, context.manifest, context.base);
            return <Component sources={sources} {...props as T & Props} />;
          }}
        </ImageContext.Consumer>
      );
    }
  };
}
