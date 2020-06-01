import { PipeResult } from "@rib/common";

import { PassthroughPipe } from "./passthrough";

const randomData = Buffer.of(Math.random());

const metadata = {
  width: 1,
  height: 1,
  format: "random",
  channels: 4,
  testValue: Math.random().toString(),
};

test("resizes an image", async () => {
  const result = (await PassthroughPipe(randomData, metadata, {})) as PipeResult;

  expect(Array.isArray(result)).toBeFalsy();

  expect(result.output).toBe(randomData);
  expect(result.metadata).toEqual(metadata);
});
