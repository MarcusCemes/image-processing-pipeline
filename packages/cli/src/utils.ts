import { promises } from "fs";
import { join } from "path";
import PrettyError from "pretty-error";

const MAX_ITEMS = 3;
const PADDING = 2;

const prettyError = new PrettyError().setMaxItems(MAX_ITEMS);

/** Reads the version from package.json */
export async function getVersion(): Promise<string | null> {
  try {
    const packagePath = join(__dirname, "..", "package.json");
    const file = await promises.readFile(packagePath);
    const json = JSON.parse(file.toString());

    if (typeof json.version === "string") return json.version;
    return null;
  } catch {
    return null;
  }
}

/** Format an error into a prettier string */
export function formatError(err: Error): string {
  return prettyError.render(err);
}

/** Prints lines of text to stdout with two spaces of indentation */
export function printPadded(...text: string[]): void {
  for (const item of text)
    process.stdout.write(" ".repeat(PADDING) + item.replace(/\n/g, "\n" + " ".repeat(PADDING)) + "\n");
}
