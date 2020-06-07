import { PipeResult } from "@ipp/common";

import { ResizePipe } from "./resize";

const pngPixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABBQECz6AuzQAAAABJRU5ErkJggg==",
  "base64"
);

const pngMetadata = {
  width: 1,
  height: 1,
  format: "png",
  channels: 3,
  testValue: Math.random().toString(),
};

const rawImage = Buffer.from("ffffff", "hex");

const rawMetadata = {
  width: 1,
  height: 1,
  format: "raw",
  channels: 3,
  testValue: Math.random().toString(),
};

test("resizes a png image", async () => {
  const result = (await ResizePipe(pngPixel, pngMetadata, { resizeOptions: { width: 2, height: 2 } })) as PipeResult[];

  expect(Array.isArray(result)).toBeTruthy();
  expect(result).toHaveLength(1);

  const [format] = result;

  expect(Buffer.isBuffer(format.output)).toBeTruthy();
  expect(format.metadata).toEqual({ ...pngMetadata, width: 2, height: 2 });
});

test("resizes a raw image", async () => {
  const result = (await ResizePipe(rawImage, rawMetadata, { resizeOptions: { width: 2, height: 2 } })) as PipeResult[];

  expect(Array.isArray(result)).toBeTruthy();
  expect(result).toHaveLength(1);

  const [format] = result;

  expect(Buffer.isBuffer(format.output)).toBeTruthy();
  expect(format.metadata).toEqual({ ...rawMetadata, width: 2, height: 2 });
});

test("resize image breakpoints", async () => {
  const result = (await ResizePipe(pngPixel, pngMetadata, {
    breakpoints: [
      { name: "sm", resizeOptions: { width: 2, height: 2 } },
      { name: "lg", resizeOptions: { width: 4, height: 4 } },
    ],
  })) as PipeResult[];

  expect(Array.isArray(result)).toBeTruthy();
  expect(result).toHaveLength(2);

  const [small, large] = result;

  expect(Buffer.isBuffer(small.output)).toBeTruthy();
  expect(small.metadata).toEqual({ ...pngMetadata, width: 2, height: 2, breakpoint: "sm" });

  expect(Buffer.isBuffer(large.output)).toBeTruthy();
  expect(large.metadata).toEqual({ ...pngMetadata, width: 4, height: 4, breakpoint: "lg" });
});
