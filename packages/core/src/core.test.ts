/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataObject, Metadata, PipelineBranch, PipelineFormat, PipelineResult } from "@ipp/common";
import { randomBytes } from "crypto";
import produce from "immer";
import sharp from "sharp";
import { executePipeline } from "./core";
import { hash } from "./hash";

jest.mock("sharp");

jest.mock(
  "./pipes/cjs_pipe_mock",
  () => {
    const PassThrough = async (x: any) => x;
    PassThrough["__esModule"] = true; // a jest "hack" that creates a non-ES module export
    return PassThrough;
  },
  { virtual: true }
);

describe("function executePipeline()", () => {
  /* -- Reused utility data -- */
  const buffer = randomBytes(8);
  const sharpMetadata = { width: 256, height: 256, channels: 3, format: "jpeg" };
  const metadata: Metadata = {
    source: {
      ...sharpMetadata,
      hash: hash(buffer),
    },
    current: {
      ...sharpMetadata,
      hash: hash(buffer),
    },
  };

  const data: DataObject = { buffer, metadata };

  /* -- Mocks -- */

  const metadataMock = jest.fn(async () => sharpMetadata);
  const sharpMock = sharp as unknown as jest.Mock<{ metadata: typeof metadataMock }>;
  const mocks = [metadataMock, sharpMock];

  /* -- Lifecycle -- */

  beforeAll(() => sharpMock.mockImplementation(() => ({ metadata: metadataMock })));
  afterAll(() => sharpMock.mockRestore());
  afterEach(() => mocks.forEach((m) => m.mockClear()));

  /* -- Tests -- */

  describe("execution", () => {
    test("accepts an empty pipeline", async () => {
      const result = executePipeline([], buffer);
      await expect(result).resolves.toMatchObject<PipelineResult>({
        source: data,
        formats: [],
      });
    });

    test("executes a single branch", async () => {
      const result = executePipeline([{ pipe: "passthrough" }], buffer);
      await expect(result).resolves.toMatchObject<PipelineResult>({
        source: data,
        formats: [],
      });
    });

    test("saves a format", async () => {
      const result = executePipeline([{ pipe: "passthrough", save: "name" }], buffer);
      await expect(result).resolves.toMatchObject<PipelineResult>({
        source: data,
        formats: [{ data, saveKey: "name" }],
      });
    });

    test("saves multiple formats", async () => {
      const result = executePipeline(
        [
          { pipe: "passthrough", save: "file1" },
          { pipe: "passthrough", save: "file2" },
        ],
        buffer
      );

      await expect(result).resolves.toMatchObject<PipelineResult>({
        source: data,
        formats: ["file1", "file2"].map((f) => ({ data, saveKey: f })),
      });
    });

    test("handles nested pipelines", async () => {
      const result = executePipeline(
        [{ pipe: "passthrough", save: "file1", then: [{ pipe: "passthrough", save: "file2" }] }],
        buffer
      );

      await expect(result).resolves.toMatchObject<PipelineResult>({
        source: data,
        formats: ["file1", "file2"].map((f) => ({ data, saveKey: f })),
      });
    });

    test("handles pipe rejections", async () => {
      const result = executePipeline(
        [
          {
            pipe: async function RejectionPipe() {
              throw new Error("I failed!");
            },
          },
        ],
        buffer
      );

      await expect(result).rejects.toThrow("[RejectionPipe] I failed!");
    });

    test("generates file hashes", async () => {
      const newData = randomBytes(8);
      const result = executePipeline(
        [{ pipe: async (data) => ({ ...data, buffer: newData }), save: true }],
        buffer
      );

      await expect(result).resolves.toMatchObject<PipelineResult>({
        source: data,
        formats: [
          {
            saveKey: true,
            data: {
              buffer: newData,
              metadata: produce(metadata, (draft) => {
                draft.current.hash = hash(newData);
                draft.source.hash = hash(buffer);
              }),
            },
          },
        ],
      });
    });
  });

  describe("pipe resolution", () => {
    test("correct resolution", async () => {
      const pipes: PipelineBranch["pipe"][] = [
        "passthrough",
        { resolve: "./pipes/cjs_pipe_mock" },
        { resolve: "./pipes/passthrough", module: "PassthroughPipe" },
        async (x) => x,
      ];

      for (const pipe of pipes) {
        const result = executePipeline([{ pipe }], buffer);
        await expect(result).resolves.toMatchObject<PipelineResult>({
          source: data,
          formats: [],
        });
      }
    });

    test("resolution failure", async () => {
      const pipes = [
        "non_existent_pipe",
        { resolve: "./pipes/non_existent_pipe" },
        { resolve: "./pipes/passthrough", module: "default" },
        { resolve: "./pipes/non_existent_pipe", module: "default" },
        { resolve: "./pipes/non_existent_pipe", module: "default" },
        { resolve: "fs" },
      ];

      for (const pipe of pipes) {
        const result = executePipeline([{ pipe }], buffer);
        await expect(result).rejects.toBeTruthy();
      }
    });

    test("handles malformed pipe syntax", async () => {
      const pipes = [null, true, 42];

      for (const pipe of pipes) {
        const result = executePipeline([{ pipe: pipe as any }], buffer);
        await expect(result).rejects.toThrow("Unknown pipe resolution scheme");
      }
    });
  });

  test("handles metadata errors", async () => {
    metadataMock.mockImplementationOnce(() => Promise.reject("I rejected!"));
    const result = executePipeline([{ pipe: () => Promise.reject() }], buffer);

    await expect(result).rejects.toThrow("Metadata error: I rejected!");
  });

  test("handles missing metadata values", async () => {
    metadataMock.mockImplementationOnce(async () => ({} as any));
    const result = executePipeline([{ pipe: () => Promise.reject() }], buffer);

    await expect(result).rejects.toThrow("Metadata error: missing properties");
  });

  test("handles no pipe output", async () => {
    const result = executePipeline(
      [
        {
          pipe: (async () => {
            /* */
          }) as any,
        },
      ],
      buffer
    );
    await expect(result).resolves.toMatchObject<PipelineResult>({
      source: data,
      formats: [],
    });
  });

  test("handles multiple pipe outputs", async () => {
    const result = executePipeline(
      [
        {
          pipe: async () => [
            { buffer, metadata },
            { buffer, metadata },
          ],
          save: true,
        },
      ],
      buffer
    );
    await expect(result).resolves.toMatchObject<PipelineResult>({
      source: data,
      formats: new Array<PipelineFormat>(2).fill({
        data: {
          buffer,
          metadata,
        },
        saveKey: true,
      }),
    });
  });
});
