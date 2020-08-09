/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PrettyError from "pretty-error";
import { argv } from "process";

export const BULLET = "\u25cf";

const MAX_ITEMS = isVerbose() ? 16 : 2;
const PADDING = 2;

const prettyError = new PrettyError().setMaxItems(MAX_ITEMS);

/** Format an error into a prettier string */
export function prettifyError(err: Error): string {
  return prettyError.render(err);
}

/** Indents every new line with specified padding */
export function pad(text: string, padding: number = PADDING): string {
  return text
    .split("\n")
    .map((x) => (x.length > 0 ? " ".repeat(padding) + x : x))
    .join("\n");
}

/** Scans argv for a `-v` or `--verbose` flag */
function isVerbose(): boolean {
  for (const flag of ["-v", "--verbose"]) {
    if (argv.indexOf(flag) !== -1) return true;
  }

  return false;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
