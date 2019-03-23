import ansiAlign from "ansi-align";
import sharp, { Sharp } from "sharp";
import wrapAnsi from "wrap-ansi";

/** Check if object is an instance of SHARP */
export function isSharpInstance(instance: object): instance is Sharp {
  return instance instanceof sharp;
}

/** Centres and wraps a piece of text according to width */
export function centreText(text: string, width: number): string {
  const wrappedLine: string = ansiAlign.center(wrapAnsi(text, width) + "\n" + " ".repeat(width));
  return wrappedLine.substring(0, wrappedLine.lastIndexOf("\n"));
}
