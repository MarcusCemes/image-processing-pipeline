// Responsive Image Builder - Utility
// Handy utility functions
import ansiAlign from "ansi-align";
import { platform } from "os";
import { resolve } from "path";
import slash from "slash";
import wrapAnsi from "wrap-ansi";

/** Centres and wraps a piece of text according to width */
export function centreText(text: string, width: number): string {
  const wrappedLine: string = ansiAlign.center(wrapAnsi(text, width) + "\n" + " ".repeat(width));
  return wrappedLine.substring(0, wrappedLine.lastIndexOf("\n"));
}

/**
 * Resolve the path to an absolute path on Windows and Linux based systems.
 *
 * On Windows, single backslashes "\\" AND double backslashes "\\\\"
 * will be converted to a single forward slash "/". This makes Linux and
 * Windows easier to manage at the same time, and helps some libraries behave
 * who hate Windows.
 *
 * Node.js tends to handle forward slashes on Windows fairly well.
 */
export function cleanUpPath(pathToClean: string): string {
  let newPath = pathToClean;
  if (platform() === "win32") {
    newPath = newPath.replace(/(?<!\\)\\(?!\\)/g, "\\");
    newPath = slash(resolve(newPath));
  } else {
    newPath = resolve(newPath);
  }
  return newPath;
}

/** Returns a new object that matches the first, but without undefined values */
export function withoutUndefined(obj: object): object {
  const newObj = {};
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      newObj[key] = withoutUndefined(obj[key]);
    } else if (typeof obj[key] !== "undefined") {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}
