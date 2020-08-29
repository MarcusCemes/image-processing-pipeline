/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { promises, readdirSync } from "fs";
import { join } from "path";

interface PackageJson {
  name: string;
  description: string;
  license: string;
  author: string;
  homepage: string;
  keywords: string[];

  repository: {
    type: string;
    url: string;
  };

  bugs: {
    type: string;
    url: string;
  };
}

const PACKAGES_DIR = "packages";

enum File {
  LICENSE = "LICENSE",
  PACKAGE = "package.json",
  README = "README.md",
}

describe("packages have the correct metadat", () => {
  const cwd = process.cwd();

  // Must be sync due to Jest limitation: https://github.com/facebook/jest/issues/2235
  const packages = readdirSync(join(cwd, PACKAGES_DIR));

  let packageJson: PackageJson;
  let license: Buffer;
  let readme: Buffer;

  beforeAll(async () => {
    const meta = await Promise.all([
      readJSON<PackageJson>(join(cwd, File.PACKAGE)),
      promises.readFile(join(cwd, File.LICENSE)),
      promises.readFile(join(cwd, File.README)),
    ]);

    packageJson = meta[0];
    license = meta[1];
    readme = meta[2];

    if (packageJson.name !== "image-processing-pipeline") {
      throw new Error("Can't find root repository folder");
    }
  });

  describe.each(packages)("package %s", (dir) => {
    const packageDir = join(cwd, PACKAGES_DIR, dir);

    let packageMeta: { packageJson: PackageJson; license: Buffer; readme: Buffer };

    beforeAll(async () => {
      const readMeta = await Promise.all([
        readJSON<PackageJson>(join(packageDir, File.PACKAGE)),
        promises.readFile(join(packageDir, File.LICENSE)),
        promises.readFile(join(packageDir, File.README)),
      ]);

      packageMeta = {
        packageJson: readMeta[0],
        license: readMeta[1],
        readme: readMeta[2],
      };
    });

    test("has the correct license", () => {
      expect(packageMeta.license.equals(license)).toBe(true);
      expect(packageMeta.packageJson).toHaveProperty("license", packageJson.license);
    });

    test("has the same readme", () => {
      expect(packageMeta.readme.equals(readme)).toBe(true);
    });

    test("has the same package.json fields", () => {
      const properties: (keyof PackageJson)[] = [
        "author",
        "bugs",
        "description",
        "homepage",
        "keywords",
        "repository",
      ];

      for (const property of properties) {
        expect(packageMeta.packageJson).toHaveProperty(property, packageJson[property]);
      }
    });
  });
});

async function readJSON<T>(path: string): Promise<T> {
  const file = await promises.readFile(path);
  return JSON.parse(file.toString());
}
