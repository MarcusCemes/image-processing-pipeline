import { processPipeline } from "./core";

const pipeline = [
  {
    pipe: "passthrough",
    save: "output",
  },
];
const pngPixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABBQECz6AuzQAAAABJRU5ErkJggg==",
  "base64"
);

const randomValue = Math.random().toString();

test("processes a pipeline", async () => {
  const result = await processPipeline(pngPixel, pipeline, { preservedValue: randomValue });

  expect(result).toHaveLength(1);

  const [format] = result;

  expect(Buffer.isBuffer(format.data)).toBe(true);
  expect(format.metadata.format).toBe("png");
  expect(format.metadata.preservedValue).toBe(randomValue);
  expect(format.save).toBe("output");
});
