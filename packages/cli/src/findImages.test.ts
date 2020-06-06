import { createTempDir } from "@rib/testing";
import { mkdir, rmdir, writeFile } from "fs/promises";
import { join, normalize, relative } from "path";

import { findImages } from "./findImages";

describe("function findImages()", () => {
  let tmpDir: string;
  let inputDir: string;
  let outputDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir();
    inputDir = join(tmpDir, "input");
    outputDir = join(tmpDir, "output");
    await Promise.all([mkdir(inputDir), mkdir(outputDir)]);
  });

  afterEach(async () => {
    rmdir(tmpDir, { recursive: true });
  });

  it("runs correctly", async () => {
    const expectation = expect(findImages(inputDir, outputDir));
    await expectation.resolves.toHaveLength(0);
  });

  it("finds a single image from a file", async () => {
    const inputImage = join(inputDir, "image.jpeg");

    // Prepare files
    await writeFile(inputImage, Buffer.of(0));

    // Run the function
    const result = await findImages(inputImage, outputDir);
    expect(result).toHaveLength(1);

    // Test the result
    const [image] = result;
    expect(normalize(image.i)).toBe(inputImage);
    expect(normalize(image.o)).toBe(outputDir);
  });

  it("finds a single image from a directory", async () => {
    const inputImage = join(inputDir, "image.jpeg");

    // Prepare files
    await writeFile(inputImage, Buffer.of(0));

    // Run the function
    const result = await findImages(inputDir, outputDir);
    expect(result).toHaveLength(1);

    // Test the result
    const [image] = result;
    expect(normalize(image.i)).toBe(inputImage);
    expect(normalize(image.o)).toBe(outputDir);
  });

  it("finds nested images", async () => {
    const inputImage = join(inputDir, "image.jpeg");
    const nestedDir = join(inputDir, "nested");
    const nestedImage = join(nestedDir, "image.jpeg");

    // Prepare files
    await mkdir(nestedDir);
    await Promise.all([inputImage, nestedImage].map((path) => writeFile(path, Buffer.of(0))));

    // Run the function
    const result = await findImages(inputDir, outputDir);
    expect(result).toHaveLength(2);

    // Test the result
    const [image, nested] = result;
    expect(normalize(image.i)).toBe(inputImage);
    expect(normalize(image.o)).toBe(outputDir);
    expect(normalize(nested.i)).toBe(nestedImage);
    expect(normalize(nested.o)).toBe(join(outputDir, relative(inputDir, nestedDir)));
  });
});
