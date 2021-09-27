/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataObject, PipeException, sampleMetadata } from "@ipp/common";
import { randomBytes } from "crypto";
import sharp, { OutputInfo, Sharp } from "sharp";
import { ResizePipe } from "./resize";

jest.mock("sharp");

type UnPromise<T> = T extends Promise<infer U> ? U : never;

describe("built-in resize pipe", () => {
  /** The input value */
  const data: DataObject = {
    buffer: randomBytes(8),
    metadata: sampleMetadata(256, "jpeg"),
  };

  const resizeOptions = { width: 128, height: 128 };

  /** The return value of the mocked sharp.toBuffer() function */
  const toBufferResult: UnPromise<ReturnType<Sharp["toBuffer"]>> = {
    data: data.buffer,
    info: {
      width: resizeOptions.width,
      height: resizeOptions.height,
      channels: data.metadata.current.channels,
      size: data.buffer.length,
      format: data.metadata.current.format,
      premultiplied: false,
    } as OutputInfo,
  };

  /** The expected value */
  const newData: DataObject = {
    ...data,
    metadata: {
      ...data.metadata,
      current: {
        ...data.metadata.current,
        width: toBufferResult.info.width,
        height: toBufferResult.info.height,
      },
    },
  };

  const toBufferMock = jest.fn(async () => toBufferResult);
  const resizeMock = jest.fn(() => ({ toBuffer: toBufferMock }));
  const sharpMock = sharp as unknown as jest.Mock<{ resize: typeof resizeMock }>;
  const mocks = [toBufferMock, resizeMock, sharpMock];

  beforeAll(() => sharpMock.mockImplementation(() => ({ resize: resizeMock })));
  afterAll(() => sharpMock.mockRestore());
  afterEach(() => mocks.forEach((m) => m.mockClear()));

  test("resize a single image", async () => {
    const result = ResizePipe(data, { resizeOptions });

    await expect(result).resolves.toMatchObject<DataObject>(newData);

    expect(resizeMock).toHaveBeenCalledWith(expect.objectContaining(resizeOptions));
    expect(toBufferMock).toHaveBeenCalledWith({ resolveWithObject: true });
  });

  /** Should support multiple breakpoint sizes (not checking for duplicates) */
  test("resizes breakpoints", async () => {
    const names = ["sm", "md", "lg"];
    const breakpoints = names.map((name) => ({ name, resizeOptions }));
    const result = ResizePipe(data, { allowDuplicates: true, breakpoints });

    await expect(result).resolves.toMatchObject<DataObject[]>(
      names.map((breakpoint) => ({
        ...newData,
        metadata: {
          ...newData.metadata,
          current: {
            ...newData.metadata.current,
            ...resizeOptions,
            breakpoint,
          },
        },
      }))
    );

    expect(sharpMock).toHaveBeenCalledTimes(3);
    expect(resizeMock).toHaveBeenCalledWith(expect.objectContaining(resizeOptions));
  });

  /** Should be able to remove duplicate image sizes when using breakpoints */
  test("removes duplicates", async () => {
    const names = ["sm", "md", "lg"];
    const breakpoints = names.map((name) => ({ name, resizeOptions }));
    const result = ResizePipe(data, { breakpoints });

    await expect(result).resolves.toMatchObject<DataObject[]>([
      {
        ...newData,
        metadata: {
          ...newData.metadata,
          current: { ...newData.metadata.current, ...resizeOptions, breakpoint: "sm" },
        },
      },
    ]);

    expect(sharpMock).toHaveBeenCalledTimes(1);
    expect(resizeMock).toHaveBeenCalledWith(expect.objectContaining(resizeOptions));
  });

  test("does not upscale by default", async () => {
    const result = ResizePipe(data, { resizeOptions: { width: 1920 } });

    await expect(result).resolves.toMatchObject<DataObject>(newData);

    // This is the important part
    expect(data.metadata.current.width).toBeLessThan(1920);
    expect(resizeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 1920,
        withoutEnlargement: true,
      })
    );
  });

  test("should not upscale breakpoints by default", async () => {
    const names = ["sm", "md", "lg"];
    const breakpoints = names.map((name) => ({ name, resizeOptions: { width: 1920 } }));
    const result = ResizePipe(data, { breakpoints });

    await expect(result).resolves.toBeTruthy();

    expect(data.metadata.current.width).toBeLessThan(1920);
    expect(resizeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 1920,
        withoutEnlargement: true,
      })
    );
  });

  /**
   * The resize pipe should be able to detect the raw format, passing extra
   * contextual metadata to the sharp instance and retaining the raw format afterwards.
   */
  test("handles raw image data", async () => {
    const rawData: DataObject = {
      ...data,
      metadata: { ...data.metadata, current: { ...data.metadata.current, format: "raw" } },
    };
    const { width, height, channels } = rawData.metadata.current;
    const sharpRawReturnedInfo = {
      ...toBufferResult,
      info: { ...toBufferResult.info, format: "raw" },
    };

    // Special implementation for the RAW format
    toBufferMock.mockImplementationOnce(async () => sharpRawReturnedInfo);

    const result = ResizePipe(rawData, { resizeOptions });

    await expect(result).resolves.toMatchObject<DataObject>({
      ...rawData,
      metadata: {
        ...rawData.metadata,
        current: {
          ...rawData.metadata.current,
          ...resizeOptions,
        },
      },
    });

    expect(sharp).toHaveBeenCalledWith(rawData.buffer, { raw: { width, height, channels } });
    expect(resizeMock).toHaveBeenCalledWith(expect.objectContaining(resizeOptions));
  });

  test("handles missing options", async () => {
    const result = ResizePipe(data);

    await expect(result).rejects.toBeInstanceOf(PipeException);
  });
});
