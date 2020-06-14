import { Pipe, PipeException, PipelineException } from "@ipp/common";

import { processPipeline } from "./core";

const pngPixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABBQECz6AuzQAAAABJRU5ErkJggg==",
  "base64"
);

describe("function processPipeline()", () => {
  test("processes a png image", async () => {
    // Does a fairly complete test on the pipeline processing capabilities
    const passthroughSingle = jest
      .fn<ReturnType<Pipe>, Parameters<Pipe>>()
      .mockImplementation(async (i, m) => ({ output: i, metadata: m, then: null }));

    const passthroughMultiple = jest
      .fn<ReturnType<Pipe>, Parameters<Pipe>>()
      .mockImplementation(async (i, m) => ({ output: i, metadata: m, then: [] }));

    const pipeline = [
      {
        pipe: "passthrough", // built-in passthrough
        save: "parent",
        then: [
          // array of then
          {
            pipe: passthroughSingle, // custom passthrough
            save: "child1",
            then: [{ pipe: "passthrough" }],
          },
          {
            pipe: passthroughMultiple,
            save: "child2",
            then: [{ pipe: "passthrough" }],
          },
        ],
      },
    ];

    const result = await processPipeline(pngPixel, pipeline, { preserveValue: "preserve_me" });

    expect(result).toHaveLength(3);
    expect(passthroughSingle).toHaveBeenCalledTimes(1);
    expect(passthroughMultiple).toHaveBeenCalledTimes(1);

    const [parent, child1, child2] = result;

    for (const item of result) {
      expect(item).toMatchObject<Partial<typeof item>>({
        data: pngPixel,
        metadata: { ...item.metadata, preserveValue: "preserve_me" },
      });
    }

    expect(parent.save).toBe("parent");
    expect(child1.save).toBe("child1");
    expect(child2.save).toBe("child2");

    expect.assertions(9);
  });

  test("throws on invalid built=in pipe", async () => {
    await expect(processPipeline(pngPixel, [{ pipe: "NULL" }])).rejects.toBeInstanceOf(PipelineException);

    expect.assertions(1);
  });

  test("throws on invalid external pipe", async () => {
    await expect(
      processPipeline(pngPixel, [{ pipe: { resolve: "NULL_MODULE", module: "default" } }])
    ).rejects.toBeInstanceOf(PipelineException);

    expect.assertions(1);
  });

  test("handles pipe exceptions", async () => {
    const pipeline = [{ pipe: () => Promise.reject(new PipeException("msg_error")) }];
    const result = processPipeline(pngPixel, pipeline);

    await expect(result).rejects.toBeInstanceOf(PipelineException);
    expect.assertions(1);
  });
});
