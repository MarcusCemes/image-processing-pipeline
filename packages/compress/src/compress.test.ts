import { PipeResult } from "@rib/common";

import { CompressPipe } from "./compress";

const jpegPixel = Buffer.from(
  "/9j/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=",
  "base64"
);

const pngPixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABBQECz6AuzQAAAABJRU5ErkJggg==",
  "base64"
);

const svgImage = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"></svg>`, "utf-8");

test("compresses a jpeg image", async () => {
  const metadata = {
    width: 1,
    height: 1,
    format: "jpeg",
    channels: 3,
    testValue: Math.random().toString(),
  };

  const result = (await CompressPipe(jpegPixel, metadata)) as PipeResult;

  expect(Buffer.isBuffer(result.output)).toBeTruthy();
  expect(result.metadata).toEqual(metadata);
});

test("compresses a png image", async () => {
  const metadata = {
    width: 1,
    height: 1,
    format: "png",
    channels: 3,
    testValue: Math.random().toString(),
  };

  const result = (await CompressPipe(pngPixel, metadata)) as PipeResult;

  expect(Buffer.isBuffer(result.output)).toBeTruthy();
  expect(result.metadata).toEqual(metadata);
});

test("compresses an svg image", async () => {
  const metadata = {
    width: 1,
    height: 1,
    format: "svg",
    channels: 3,
    testValue: Math.random().toString(),
  };

  const result = (await CompressPipe(svgImage, metadata)) as PipeResult;

  expect(Buffer.isBuffer(result.output)).toBeTruthy();
  expect(result.metadata).toEqual(metadata);
});
