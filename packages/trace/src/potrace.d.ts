/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** Type definitions by Marcus Cemes for Potrace v2.1.8 */

declare module "potrace" {
  /* Trace */
  export const COLOR_AUTO = "auto";
  export const COLOR_TRANSPARENT = "transparent";
  export const THRESHOLD_AUTO = -1;
  export const TURNPOLICY_BLACK = "black";
  export const TURNPOLICY_WHITE = "white";
  export const TURNPOLICY_LEFT = "left";
  export const TURNPOLICY_RIGHT = "right";
  export const TURNPOLICY_MINORITY = "minority";
  export const TURNPOLICY_MAJORITY = "majority";

  /* Posterize */
  export const STEPS_AUTO = -1;
  export const FILL_DOMINANT = "dominant";
  export const FILL_MEAN = "mean";
  export const FILL_MEDIAN = "median";
  export const FILL_SPREAD = "spread";
  export const RANGES_AUTO = "auto";
  export const RANGES_EQUAL = "equal";

  type TurnPolicy = "black" | "white" | "left" | "right" | "minority" | "majority";
  type Fill = "dominant" | "mean" | "median" | "spread";
  type Range = "auto" | "equal";

  /** Mixed trace/posterize options */
  export interface TraceOptions {
    turnPolicy?: TurnPolicy;
    turdSize?: number;
    alphaMax?: number;
    optCurve?: boolean;
    optTolerance?: number;
    threshold?: number;
    blackOnWhite?: boolean;
    color?: string;
    background?: string;
  }

  interface PosterizeOptions extends TraceOptions {
    fillStrategy?: Fill;
    rangeDistribution?: Range;
    steps?: number;
  }

  export function posterize(
    data: string | Buffer,
    options: PosterizeOptions,
    cb: (err?: any, svg?: string) => void
  ): void;

  export function trace(
    data: string | Buffer,
    options: TraceOptions,
    cb: (err?: any, svg?: string) => void
  ): void;
}
