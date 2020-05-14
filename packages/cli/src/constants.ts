/** Synced with the package.json version */
import { promises } from "fs";
import { join } from "path";

// export const VERSION = "0.1.0";

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
