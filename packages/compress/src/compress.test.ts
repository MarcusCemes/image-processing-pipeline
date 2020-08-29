/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataObject, sampleMetadata } from "@ipp/common";
import { getMock } from "@ipp/testing";
import { randomBytes } from "crypto";
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminPngquant from "imagemin-pngquant";
import imageminSvgo from "imagemin-svgo";
import { CompressPipe } from "./compress";

jest.mock("imagemin-mozjpeg");
jest.mock("imagemin-pngquant");
jest.mock("imagemin-svgo");

describe("external CompressPipe", () => {
  const mocks = {
    jpeg: getMock(imageminMozjpeg),
    png: getMock(imageminPngquant),
    svg: getMock(imageminSvgo),
  };

  /** A mock imagemin plugin function */
  const pluginMock = jest.fn(async (buffer: Buffer) => buffer);

  beforeAll(() =>
    Object.values(mocks).forEach((mock) => mock.mockImplementation(() => pluginMock as any))
  );
  afterEach(() => Object.values(mocks).forEach((mock) => mock.mockClear()));
  afterAll(() => Object.values(mocks).forEach((mock) => mock.mockRestore()));

  const data: DataObject = {
    buffer: randomBytes(8),
    metadata: sampleMetadata(256, "jpeg"),
  };

  test.each([
    ["jpeg", mocks.jpeg],
    ["png", mocks.png],
    ["svg", mocks.svg],
  ])("accepts a %s image", async (name, mock) => {
    const formatData = {
      ...data,
      metadata: { ...data.metadata, current: { ...data.metadata.current, format: name } },
    };

    const result = CompressPipe(formatData);

    await expect(result).resolves.toMatchObject<DataObject>(formatData);
    expect(mock).toHaveBeenCalled();
    expect(pluginMock).toHaveBeenCalledWith(formatData.buffer);
  });

  test("rejects on unsupported format", async () => {
    const result = CompressPipe({
      ...data,
      metadata: {
        ...data.metadata,
        current: {
          ...data.metadata.current,
          format: "__unsupportedFormat",
        },
      },
    });

    await expect(result).rejects.toThrowError("Unsupported format: __unsupportedFormat");
  });

  test("supports allowUnsupported option", async () => {
    const result = CompressPipe(
      {
        ...data,
        metadata: {
          ...data.metadata,
          current: {
            ...data.metadata.current,
            format: "__unsupportedFormat",
          },
        },
      },
      { allowUnsupported: true }
    );

    const formatData = {
      ...data,
      metadata: {
        ...data.metadata,
        current: { ...data.metadata.current, format: "__unsupportedFormat" },
      },
    };

    await expect(result).resolves.toMatchObject<DataObject>(formatData);
  });

  describe("E2E - End to End testing", () => {
    test("compresses a PNG image", async () => {
      mocks.png.mockImplementationOnce(jest.requireActual("imagemin-pngquant"));

      const pixel =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
      const pngDataObject = {
        buffer: Buffer.from(pixel, "base64"),
        metadata: sampleMetadata(1, "png"),
      };
      const result = CompressPipe(pngDataObject);

      // The compress function actually creates a lot of excess data
      // compared to the optimised PNG pixel
      await expect(result).resolves.toEqual(
        expect.objectContaining({ metadata: pngDataObject.metadata })
      );

      expect(((await result) as DataObject).buffer.compare(pngDataObject.buffer)).not.toBe(0);
      expect(mocks.png).toHaveBeenCalled();
    });
  });
});
