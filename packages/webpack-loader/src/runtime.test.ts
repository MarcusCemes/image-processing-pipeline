/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataObject, Metadata, PipelineFormat, sampleMetadata } from "@ipp/common";
import { executePipeline } from "@ipp/core";
import { randomBytes } from "crypto";
import { interpolateName } from "loader-utils";
import { LoaderContext } from "webpack";
import { ManifestExport, runtime, SimpleExport } from "./runtime";

jest.mock("@ipp/core");
jest.mock("loader-utils");

describe("function runtime()", () => {
  const ctx = {
    emitFile: jest.fn(),
    mode: "production",
    resourcePath: "/some_path/image",
  } as unknown as LoaderContext<Record<string, never>>;

  const buffer = randomBytes(8);
  const initialMetadata = { path: ctx.resourcePath };
  const sampleMeta = sampleMetadata(256, "jpeg");
  const metadata: Metadata = {
    ...sampleMeta,
    source: { ...sampleMeta.source, path: ctx.resourcePath },
  };

  const source: DataObject = { buffer, metadata };

  const options = {
    esModule: false,
    devBuild: false,
    outputPath: "[hash:16][ext]",
    pipeline: [],
    manifest: { source: { w: "width" }, format: { w: "width" } },
  };

  const format: PipelineFormat = {
    data: {
      buffer: randomBytes(8),
      metadata: {
        ...source.metadata,
        current: {
          ...source.metadata.current,
          width: 128,
          height: 128,
        },
      },
    },
    saveKey: true,
  };

  const coreResult = {
    source,
    formats: [format],
  };

  const expected: ManifestExport = {
    s: {
      w: metadata.current.width,
    },
    f: [{ w: format.data.metadata.current.width }],
  };

  /* -- Mocks -- */

  const executePipelineMock = executePipeline as jest.MockedFunction<typeof executePipeline>;
  const interpolateMock = interpolateName as jest.MockedFunction<typeof interpolateName>;

  beforeAll(() => executePipelineMock.mockImplementation(async () => coreResult));
  beforeEach(() => {
    let counter = 0;
    interpolateMock.mockImplementation(() => `image-${++counter}`);
  });

  afterAll(() => executePipelineMock.mockRestore());
  afterEach(() => jest.clearAllMocks());

  test("runs a simple test case", async () => {
    const result = runtime(ctx, options, buffer);

    await expect(result).resolves.toMatchObject<ManifestExport>(expected);
    expect(executePipelineMock).toHaveBeenCalledWith<Parameters<typeof executePipeline>>(
      options.pipeline,
      buffer,
      initialMetadata
    );
  });

  test("supports development mode", async () => {
    const result = runtime({ ...ctx, mode: "development" }, options, buffer);

    await expect(result).resolves.toMatchObject<ManifestExport>(expected);
    expect(executePipelineMock).toHaveBeenCalledWith<Parameters<typeof executePipeline>>(
      [{ pipe: "passthrough", save: true }],
      buffer,
      initialMetadata
    );
  });

  test("emits a webpack file", async () => {
    const result = runtime(ctx, options, buffer);

    await expect(result).resolves.toMatchObject<ManifestExport>(expected);
    expect(ctx.emitFile).toHaveBeenCalledWith(expect.any(String), format.data.buffer, undefined);
  });

  test("supports simple mode", async () => {
    const result = runtime(
      ctx,
      { ...options, manifest: void 0, outputPath: "[width][ext]" },
      buffer
    );

    await expect(result).resolves.toMatchObject<SimpleExport>({
      srcset: {
        "image/jpeg": "128.jpg 128w",
      },
      width: metadata.current.width,
      height: metadata.current.height,
    });
  });

  test("determines the most suitable image for the src property", async () => {
    const targets: [number, string][] = [
      [1920, "svg"], // should start with
      [1920, "webp"], // should upgrade
      [1920, "svg"], // should ignore
      [256, "jpeg"], // should upgrade
      [512, "jpeg"], // best src candidate, because jpeg and closes to 1920w
      [3840, "jpeg"], // should ignore
      [1920, "svg"], // should ignore
    ];

    // builds formats based on simulated targets
    const formats: PipelineFormat[] = targets.map((x) => ({
      data: { buffer: source.buffer, metadata: sampleMetadata(...x) },
      saveKey: true,
    }));

    // construct srcset properties
    const expectedSrcset = targets.map(([size, format]) => [`${format}-${size} ${size}w`, format]);
    const getSrcset = (format: string) =>
      expectedSrcset
        .filter((x) => x[1] === format)
        .map((x) => x[0])
        .join(", ");

    executePipelineMock.mockImplementationOnce(async () => ({ ...coreResult, source, formats }));
    const result = runtime(
      ctx,
      { ...options, outputPath: "[format]-[width]", manifest: void 0 },
      buffer
    );

    await expect(result).resolves.toMatchObject<SimpleExport>({
      src: "jpeg-512",
      srcset: {
        "image/jpeg": getSrcset("jpeg"),
        "image/webp": getSrcset("webp"),
        "image/svg+xml": getSrcset("svg"),
      },
      width: metadata.current.width,
      height: metadata.current.height,
    });
  });

  test("supports manifest mode", async () => {
    const result = runtime(
      ctx,
      { ...options, manifest: { source: {}, format: { f: "format" } } },
      buffer
    );

    await expect(result).resolves.toMatchObject<ManifestExport>({
      f: [{ f: "jpeg" }],
    });
  });

  test("supports 'save' and 'path' manifest keys", async () => {
    executePipelineMock.mockImplementation(async () => ({
      ...coreResult,
      formats: [{ ...format, saveKey: "abc" }],
    }));

    const result = runtime(
      ctx,
      { ...options, manifest: { format: { s: "save", p: "path" } } },
      buffer
    );

    await expect(result).resolves.toMatchObject<ManifestExport>({
      f: [{ s: "abc", p: expect.any(String) }],
    });
  });

  describe("Detects MIME types", () => {
    test.each([
      ["jpeg", "image/jpeg"],
      ["png", "image/png"],
      ["svg", "image/svg+xml"],
      ["webp", "image/webp"],
      ["undefined", "application/octet-stream"],
    ])("Detects %s as %s", async (testFormat, expectedMime) => {
      expect.assertions(1);
      executePipelineMock.mockImplementationOnce(async () => ({
        source,
        formats: [
          {
            ...format,
            data: {
              ...format.data,
              metadata: {
                ...format.data.metadata,
                current: { ...format.data.metadata.current, format: testFormat },
              },
            },
          },
        ],
      }));

      const result = runtime(ctx, { ...options, manifest: void 0 }, buffer);
      await expect(result).resolves.toMatchObject<SimpleExport>({
        width: metadata.current.width,
        height: metadata.current.height,
        srcset: {
          [expectedMime]: expect.stringMatching(
            new RegExp(`^.* ${format.data.metadata.current.width}w$`)
          ),
        },
      });
    });
  });
});
