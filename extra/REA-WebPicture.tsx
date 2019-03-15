/*
 *                       React WebPicure
 *                 Copyright © 2018 Marcus Cemes
 *                   Licensed under Apache-2.0
 *
 *          Made to be used with Responsive Image Builder
 *      https://github.com/MarcusCemes/responsive-image-builder
 *
 * A React component that displays a lazy-loadable WebP compatible picture.
 *
 */
import React from 'react';
import isEqual from 'react-fast-compare';

// Used to apply classnames
import classnames from 'classnames';

// Used for image caching
import hash from 'hash-sum';

// Styles for the component, compatible with JSS
// These are implementation specific, and need to be injected
// somehow through a method fo your choice
const styles = {
  picture: {
    display: 'inline'
  },
  preview: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    filter: 'blur(10px)',
    transform: 'scale(1.05)',
    transition: 'all 200ms ease-out',
  },
  fade: {
    opacity: 0,
    transform: 'none'
  },
  failedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#FFF',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  failedOverlayText: {
    marginTop: '16px',
    color: '#AAA',
    fontSize: '14px'
  }
};

export interface WebPictureProps {

  /** Prevent lazy loading to remove flashing */
  lazy?: boolean;

  alt: string;

  /** Classes to apply with className */
  styles?: {
    img?: string;
    container?: string;
  }

  /** Image sources */
  sources: {
    thumbnail?: string;
    src?: string;
    srcset?: string;
    fallbackThumbnail?: string;
    fallbackSrc?: string;
    fallbackSrcset?: string;
  };
}

interface WebPictureState {
  loaded: boolean;
  renderPreview: boolean;
  failed: boolean;
}

/**
 * Used to decide whether an image is cached in browser.
 * Provides a safe static context that can be accessed by
 * the WebPicture class.
 * @typescript
 * @static
 */
class ImageCache {

  static _cache: string[] = [];

  public static isCached(hash: string): boolean {
    return ImageCache._cache.indexOf(hash) !== -1;
  }

  public static cache(hash: string): void {
    ImageCache._cache.push(hash);
  }
}

/**
 * A React class that displays a responsive
 * lazy-loaded WebP/fallback picture element,
 * with a blurred thumbnail preview that fades out.
 * If the image fails to load, or the sources
 * is empty, a placeholder will be displayed.
 *
 * Component will only re-render if sources or the
 * state are modified to avoid flashing. If you still
 * see flashing, consider turning off lazy-loading with
 * the "lazy" prop.
 *
 * @typescript
 */
class WebPicture extends React.Component<WebPictureProps, WebPictureState> {

  timeout: NodeJS.Timeout | false = false;

  private loadHandler: (event: React.SyntheticEvent) => void;
  private errorHandler: (event: React.SyntheticEvent) => void;

  constructor(props: WebPictureProps) {
    super(props);

    // Avoid creating new functions on every call
    this.loadHandler = this.handleLoad.bind(this);
    this.errorHandler = this.handleError.bind(this);

    // Check whether any sources are specified
    if (isEqual(props.sources, {})) {
      this.state = {
        loaded: false,
        renderPreview: false,
        failed: true
      };
    } else {

      // Check whether the image has already been loaded before
      const hashedSources = hash(props.sources);
      const isImageCached = ImageCache.isCached(hashedSources);

      this.state = {
        loaded: isImageCached,
        renderPreview: !isImageCached,
        failed: false
      };

    }

  }

  /**
   * Make the image visible, and add the source hash to ImageCache
   */
  private handleLoad() {
    this.setState({ loaded: true, failed: false });
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.setState({ renderPreview: false });
      this.timeout = false;
    }, 2000);
    ImageCache.cache(hash(this.props.sources));
  }

  /**
   * Show the placeholder for a failed image
   */
  private handleError() {
    this.setState({
      failed: true
    });
  }

  /**
   * Check that the sources were changed to reduce flashing
   */
  public shouldComponentUpdate(props: WebPictureProps, state: WebPictureState) {
    if (isEqual(props.sources, this.props.sources) && isEqual(state, this.state)) return false;
    return true;
  }

  /**
   * Remove any timeout handlers
   */
  public componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = false;
    } else {
    }
  }

  public render() {
    const { alt, classes, styles = {}, sources, lazy = true } = this.props;
    const { failed, renderPreview } = this.state;

    let sourceElements;
    if (lazy) {
      sourceElements = (
        <React.Fragment>
          <source data-src={sources.webpSrc} data-srcset={sources.webpSrcset} data-sizes="auto" type="image/webp" />
          <source data-src={sources.fallbackSrc} data-srcset={sources.fallbackSrcset} data-sizes="auto" />
        </React.Fragment>
      );
    } else {
      sourceElements = (
        <React.Fragment>
          <source src={sources.webpSrc} srcSet={sources.webpSrcset} data-sizes="auto" type="image/webp" />
          <source src={sources.fallbackSrc} srcSet={sources.fallbackSrcset} data-sizes="auto" />
        </React.Fragment>
      );
    }

    return (
      <div className={styles.container}>

        <picture className={classes.picture}>

          {sourceElements}
          <img alt={alt} data-src={sources.fallbackSrc} onLoad={this.loadHandler} onError={this.errorHandler} className={classnames(styles.img, 'lazyload')} />

        </picture>


        {renderPreview &&
          <picture className={classes.picture}>

            <source srcSet={sources.webpThumbnail} type="image/webp" />
            <source srcSet={sources.fallbackThumbnail} />

            <img alt={alt} data-src={sources.fallbackThumbnail} className={classnames(styles.img, classes.preview, { [classes.fade]: this.state.loaded })} />
          </picture>
        }

        {failed &&
          <div className={classes.failedOverlay}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 224 224" width="48" height="48"><g fill="none" strokeMiterlimit="10" fontFamily="none" fontWeight="none" fontSize="none" textAnchor="none" style={{ mixBlendMode: 'normal' }}><path d="M0 224V0h224v224z" /><path d="M37.333 37.333c-10.202 0-18.666 8.465-18.666 18.667v112c0 10.202 8.464 18.667 18.666 18.667h149.334c10.202 0 18.666-8.465 18.666-18.667V56c0-10.202-8.464-18.667-18.666-18.667zm0 18.667h149.334v112H37.333zm98 46.667L102.667 140l-23.334-23.333-25.411 32.666h116.411z" fill="#ccc" /></g></svg>
            <p className={classes.failedOverlayText}>{alt}</p>
          </div>
        }

      </div>
    );
  }

}