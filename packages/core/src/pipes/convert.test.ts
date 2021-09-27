/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataObject, sampleMetadata } from "@ipp/common";
import { randomBytes } from "crypto";
import sharp, { Sharp } from "sharp";
import { ConvertOptions, ConvertPipe } from "./convert";

jest.mock("sharp");

type UnPromise<T> = T extends Promise<infer U> ? U : never;

describe("built-in ConvertPipe", () => {
  const baseData: DataObject = {
    buffer: randomBytes(8),
    metadata: sampleMetadata(256, "jpeg", "jpeg"),
  };

  const dataWithFormats = (original: string, current: string): DataObject => ({
    ...baseData,
    metadata: {
      ...baseData.metadata,
      current: {
        ...baseData.metadata.current,
        format: current,
      },
      source: {
        ...baseData.metadata.source,
        format: original,
      },
    },
  });

  /** Factory for the return value of the mocked sharp.toBuffer() function */
  const toBufferFactory = (
    data: DataObject,
    format: string
  ): UnPromise<ReturnType<Sharp["toBuffer"]>> => ({
    data: data.buffer,
    info: {
      width: 256,
      height: 256,
      channels: 3,
      size: 0,
      format,
      premultiplied: false,
    },
  });

  /* -- Mocks -- */

  const toBufferMock = jest.fn();
  const toFormatMock = jest.fn(() => ({ toBuffer: toBufferMock }));
  const sharpMock = sharp as unknown as jest.Mock<{ toFormat: typeof toFormatMock }>;
  const mocks = [toBufferMock, toFormatMock, sharpMock];

  beforeAll(() => sharpMock.mockImplementation(() => ({ toFormat: toFormatMock })));
  afterAll(() => mocks.forEach((m) => m.mockRestore()));
  afterEach(() => mocks.forEach((m) => m.mockClear()));

  /* -- Test generators -- */

  const testConversion = async (from: string, to: string) => {
    const data = dataWithFormats("__originalFormat", from);
    toBufferMock.mockImplementationOnce(async () => toBufferFactory(data, to));

    const result = ConvertPipe(data, { format: to });

    await expect(result).resolves.toMatchObject<DataObject>(
      dataWithFormats("__originalFormat", to)
    );

    expect(toFormatMock).toHaveBeenCalledWith(to, void 0);
    expect(toBufferMock).toHaveBeenCalled();
  };

  /* -- Tests -- */

  describe("simple conversions", () => {
    test.each([
      ["jpeg", "jpeg"],
      ["jpeg", "png"],
      ["jpeg", "webp"],
      ["png", "webp"],
    ])("converts %s → %s", testConversion);
  });

  describe("raw conversions", () => {
    test.each([
      ["jpeg", "raw"],
      ["raw", "jpeg"],
    ])("%s → %s", testConversion);
  });

  describe("dynamic conversions", () => {
    /** The existence of a format is not tested, only the attempt to convert */
    test("converts to original format", async () => {
      const data = dataWithFormats("__originalFormat", "jpeg");
      toBufferMock.mockImplementationOnce(async () =>
        toBufferFactory(data, data.metadata.source.format)
      );
      const result = ConvertPipe(data, { format: "original" });

      await expect(result).resolves.toMatchObject<DataObject>(
        dataWithFormats("__originalFormat", "__originalFormat")
      );

      // Expect format to have changed
      expect(((await result) as DataObject).metadata.format).not.toBe(data.metadata.current.format);
    });
  });

  /** Must know WHAT format to convert to */
  test("requires a format option", async () => {
    const data = dataWithFormats("jpeg", "jpeg");
    await expect(ConvertPipe(data, {} as any)).rejects.toHaveProperty(
      "message",
      'Missing "format" option'
    );
  });

  /** Check if special conversion parameters are passed to sharp */
  test("passes on conversion parameters", async () => {
    const data = dataWithFormats("jpeg", "jpeg");
    const options: ConvertOptions = { format: "png", convertOptions: { quality: 80 } };
    toBufferMock.mockImplementationOnce(async () => toBufferFactory(data, "png"));

    await expect(ConvertPipe(data, options)).resolves.toBeTruthy();
    expect(toFormatMock).toHaveBeenCalledWith(options.format, options.convertOptions);
  });
});
