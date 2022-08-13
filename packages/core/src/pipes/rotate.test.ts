/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataObject, sampleMetadata } from "@ipp/common";

import { randomBytes } from "crypto";
import sharp, { OutputInfo, Sharp } from "sharp";

import { RotateOptions, RotatePipe } from "./rotate";

jest.mock("sharp");

type UnPromise<T> = T extends Promise<infer U> ? U : never;

describe("built-in rotate pipe", () => {
  /** The input value */
  const data: DataObject = {
    buffer: randomBytes(8),
    metadata: sampleMetadata(256, "jpeg"),
  };

  const rotateOptions = <RotateOptions>{ angle: 45 };

  /** The return value of the mocked sharp.toBuffer() function */
  const toBufferResult: UnPromise<ReturnType<Sharp["toBuffer"]>> = {
    data: data.buffer,
    info: {
      width: 256,
      height: 256,
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
  const rotateMock = jest.fn(() => ({ toBuffer: toBufferMock }));
  const sharpMock = sharp as unknown as jest.Mock<{ rotate: typeof rotateMock }>;
  const mocks = [toBufferMock, rotateMock, sharpMock];

  beforeAll(() => sharpMock.mockImplementation(() => ({ rotate: rotateMock })));
  afterAll(() => sharpMock.mockRestore());
  afterEach(() => mocks.forEach((m) => m.mockClear()));

  test("rotate image", async () => {
    const result = RotatePipe(data, rotateOptions);

    await expect(result).resolves.toMatchObject<DataObject>(newData);

    expect(rotateMock).toHaveBeenCalledWith(rotateOptions.angle, rotateOptions?.rotateOptions);
    expect(toBufferMock).toHaveBeenCalledWith({ resolveWithObject: true });
  });
});
