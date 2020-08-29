/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataObject, sampleMetadata } from "@ipp/common";
import { randomBytes } from "crypto";
import potrace from "potrace";
import { TracePipe } from "./trace";

/* -- Mock -- */

jest.mock("potrace");
const actualPotrace = jest.requireActual<typeof potrace>("potrace");

const traceMock = potrace.trace as jest.Mock<
  ReturnType<typeof potrace["trace"]>,
  Parameters<typeof potrace["trace"]>
>;

const posterizeMock = potrace.posterize as jest.Mock<
  ReturnType<typeof potrace["posterize"]>,
  Parameters<typeof potrace["posterize"]>
>;

describe("TracePipe", () => {
  /* -- Data -- */

  const data: DataObject = {
    buffer: randomBytes(8),
    metadata: sampleMetadata(256, "jpeg"),
  };

  const svg = "<svg></svg>";

  /** Lifecycle */

  beforeAll(() => {
    [traceMock, posterizeMock].forEach((fn) =>
      fn.mockImplementation((_data, _options, cb) => cb(void 0, svg))
    );
  });
  afterAll(() => jest.restoreAllMocks());
  afterEach(() => jest.clearAllMocks);

  /* -- Tests -- */

  test("correctly calls potrace", async () => {
    const result = TracePipe(data);

    await expect(result).resolves.toMatchObject<DataObject>({
      buffer: Buffer.from(svg),
      metadata: {
        ...data.metadata,
        current: {
          ...data.metadata.current,
          format: "svg",
        },
      },
    });

    expect(traceMock).toHaveBeenCalledWith(data.buffer, expect.any(Object), expect.any(Function));
  });

  test("passes through trace options", async () => {
    const traceOptions = { steps: 2 };
    const result = TracePipe(data, { traceOptions });

    await expect(result).resolves.toMatchObject<DataObject>({
      buffer: Buffer.from(svg),
      metadata: {
        ...data.metadata,
        current: {
          ...data.metadata.current,
          format: "svg",
        },
      },
    });

    expect(traceMock).toHaveBeenCalledWith(data.buffer, traceOptions, expect.any(Function));
  });

  test.each([
    ["trace", traceMock],
    ["posterize", posterizeMock],
  ])('correctly implements the "%s" mode', async (mode, fn) => {
    const result = TracePipe(data, { mode: mode as any });

    await expect(result).resolves.toMatchObject<DataObject>({
      buffer: Buffer.from(svg),
      metadata: {
        ...data.metadata,
        current: {
          ...data.metadata.current,
          format: "svg",
        },
      },
    });

    expect(fn).toHaveBeenCalledWith(data.buffer, expect.any(Object), expect.any(Function));
  });

  test("checks for supported formats", async () => {
    const formats: [string, boolean][] = [
      ["jpeg", true],
      ["png", true],
      ["svg", false],
      ["webp", false],
    ];

    for (const [format, resolve] of formats) {
      const result = TracePipe({
        ...data,
        metadata: { ...data.metadata, current: { ...data.metadata.current, format } },
      });
      if (resolve) {
        await expect(result).resolves.toBeTruthy();
      } else {
        await expect(result).rejects.toHaveProperty(
          "message",
          `Unsupported image format: "${format}"`
        );
      }
    }
  });

  test("handles potrace errors", async () => {
    const error = new Error("test");
    traceMock.mockImplementation((_data, _options, cb) => cb(error));

    const result = TracePipe(data);

    await expect(result).rejects.toBe(error);
    expect(traceMock).toHaveBeenCalled();
  });

  describe("[E2E] End to End testing", () => {
    test("processes a PNG pixel", async () => {
      traceMock.mockImplementationOnce(actualPotrace.trace);
      const pixel =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

      const data = {
        buffer: Buffer.from(pixel, "base64"),
        metadata: sampleMetadata(1, "png"),
      };

      const result = TracePipe(data);
      await expect(result).resolves.toBeTruthy();

      const r = (await result) as DataObject;
      expect(r.metadata).toMatchObject({
        ...data.metadata,
        current: { ...data.metadata.current, format: "svg" },
      });

      // Check whether the general form is OK
      const image = r.buffer.toString();
      expect(image).toMatch(/^<svg.*<\/svg>$/s);
      expect(image.length).toBeGreaterThan(16); // arbitrary number
    });
  });
});
