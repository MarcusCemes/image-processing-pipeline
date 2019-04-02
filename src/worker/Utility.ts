// Responsive Image Builder - Worker/Utility
// Handy utility functions for the worker
import _debug from "debug";
import sharp, { Sharp } from "sharp";

const debugRaw = _debug("RIBWorker" + (process.env.WORKER_ID ? ":" + process.env.WORKER_ID : ""));

export function debug(msg: string, scope?: string) {
  if (scope) {
    debugRaw(`${scope} - ${msg}`);
  } else {
    debugRaw(msg);
  }
}

/** Check if object is an instance of SHARP */
export function isSharpInstance(instance: any): instance is Sharp {
  return instance instanceof sharp;
}
export function getFirstDefined(...values: any[]) {
  for (const value of values) {
    if (typeof value !== "undefined") {
      return value;
    }
  }
  return undefined;
}
