import { PrimitivePipe } from "./primitive";
import { PipeResult } from "@rib/common";

const pngPixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABBQECz6AuzQAAAABJRU5ErkJggg==",
  "base64"
);

const metadata = {
  format: "png",
  width: 1,
  height: 1,
  channels: 3,
};

test("generates a primitive image", async () => {
  const result = (await PrimitivePipe(pngPixel, metadata)) as PipeResult;

  expect(Buffer.isBuffer(result.output)).toBeTruthy();
  expect(result.metadata).toEqual({ ...metadata, format: "svg" });
});
