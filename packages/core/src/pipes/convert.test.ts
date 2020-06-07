import { PipeException, PipeResult } from "@ipp/common";

import { ConvertPipe } from "./convert";

const pngPixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

const metadata = {
  width: 1,
  height: 1,
  format: "png",
  channels: 4,
  testValue: Math.random().toString(),
};

test("converts an image", async () => {
  const result = (await ConvertPipe(pngPixel, metadata, { format: "webp" })) as PipeResult;

  expect(Array.isArray(result)).toBeFalsy();
  expect(Buffer.isBuffer(result.output)).toBeTruthy();
  expect(result.metadata).toEqual({ ...metadata, format: "webp" });
});

test("expects a format option", async () => {
  await expect(ConvertPipe(pngPixel, metadata, {} as any)).rejects.toThrowError(PipeException);
});
