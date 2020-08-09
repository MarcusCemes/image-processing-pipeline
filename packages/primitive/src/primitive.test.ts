/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataObject, sampleMetadata } from "@ipp/common";
import { randomBytes } from "crypto";
import execa from "execa";
import os from "os";
import { PrimitivePipe } from "./primitive";

/* -- Mock -- */

jest.mock("execa");
const actualExeca = jest.requireActual("execa");
const execaMock = (execa as unknown) as jest.Mock<
  { stdout: string },
  [string, string[], { input: Buffer }]
>;

describe("PrimitivePipe", () => {
  /* -- Data -- */

  const data: DataObject = {
    buffer: randomBytes(8),
    metadata: sampleMetadata(256, "jpeg"),
  };

  const svg = "<svg></svg>";

  /** Lifecycle */

  beforeAll(() => execaMock.mockImplementation((async () => ({ stdout: svg })) as any));
  afterAll(() => execaMock.mockRestore());
  afterEach(() => execaMock.mockClear());

  test("correctly attempts to call the executable", async () => {
    const result = PrimitivePipe(data);

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

    const parameters = execaMock.mock.calls[0];
    expect(parameters).toHaveLength(3);
    expect(parameters[0]).toMatch(/[\\/]primitive[a-z0-9-]*(:?.exe)?$/);
    expect(parameters[1]).toContain("-i");
    expect(parameters[1]).toContain("-o");
    expect(parameters[1]).toContain("-");
    expect(data.buffer.compare(parameters[2].input)).toBe(0); // equal
  });

  /* -- Tests -- */

  test("checks for supported formats", async () => {
    const formats: [string, boolean][] = [
      ["jpeg", true],
      ["png", true],
      ["svg", false],
      ["webp", false],
    ];

    for (const [format, resolve] of formats) {
      const result = PrimitivePipe({
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

  test.each(["win32", "darwin", "linux"])("Supports %s", async (p: string) => {
    const spy = jest.spyOn(os, "platform").mockImplementation(() => p as any);

    await expect(PrimitivePipe(data)).resolves.toBeTruthy();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  /** Check whether the primitive executable actually works */
  describe("[E2E] End to End testing", () => {
    test("processes a PNG pixel", async () => {
      execaMock.mockImplementationOnce(actualExeca);
      const pixel =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

      const data = {
        buffer: Buffer.from(pixel, "base64"),
        metadata: sampleMetadata(1, "png"),
      };

      const result = PrimitivePipe(data);
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
