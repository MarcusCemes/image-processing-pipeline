import { PipeResult } from "@ipp/common";
import sharp from "sharp";
import { ResizePipe } from "./resize";
import { randomBytes } from "crypto";

jest.mock("sharp");

describe("built-in resize pipe", () => {
  const data = randomBytes(8);

  const mockedSharp = (sharp as unknown) as jest.Mock<typeof sharp>;

  const metadata = { width: 256, height: 256, format: "jpeg", channels: 3 };
  const resizeOptions = { width: 128 };

  const mockToBuffer = jest.fn(() => ({
    data,
    info: metadata,
  }));

  const mockResize = jest.fn(() => ({ toBuffer: mockToBuffer }));

  beforeAll(() => {
    mockedSharp.mockImplementation(() => (({ resize: mockResize } as unknown) as typeof sharp));
  });

  afterAll(() => {
    mockedSharp.mockRestore();
  });

  afterEach(() => {
    [mockResize, mockToBuffer, mockedSharp].forEach((x) => x.mockClear());
  });

  test("resize a single image", async () => {
    const result = ResizePipe(data, metadata, { resizeOptions });

    expect(mockResize).toHaveBeenCalledWith(resizeOptions);

    await expect(result).resolves.toMatchObject<PipeResult>({
      output: data,
      metadata,
    });
  });

  /** Should support multiple breakpoint sizes (not checking for duplicates) */
  test("resizes breakpoints", async () => {
    const names = ["sm", "md", "lg"];
    const breakpoints = names.map((name) => ({ name, resizeOptions }));
    const result = ResizePipe(data, metadata, { allowDuplicates: true, breakpoints });

    expect(mockedSharp).toHaveBeenCalledTimes(3);
    expect(mockResize).toHaveBeenCalledWith(resizeOptions);

    await expect(result).resolves.toMatchObject<PipeResult[]>(
      names.map((breakpoint) => ({
        output: data,
        metadata: { ...metadata, breakpoint },
      }))
    );
  });

  /** Should be able to remove duplicate image sizes when using breakpoints */
  test("removes duplicates", async () => {
    const names = ["sm", "md", "lg"];
    const breakpoints = names.map((name) => ({ name, resizeOptions }));
    const result = ResizePipe(data, metadata, { breakpoints });

    expect(mockedSharp).toHaveBeenCalledTimes(1);
    expect(mockResize).toHaveBeenCalledWith(resizeOptions);

    await expect(result).resolves.toMatchObject<PipeResult[]>([
      {
        output: data,
        metadata: { ...metadata, breakpoint: "sm" },
      },
    ]);
  });

  /**
   * The resize pipe should be able to detect the raw format, passing extra
   * contextual metadata to the sharp instance and retaining the raw format afterwards.
   */
  test("handles raw image data", async () => {
    const rawMeta = { ...metadata, format: "raw" };
    mockToBuffer.mockImplementationOnce(() => ({ data, info: rawMeta }));

    const result = ResizePipe(data, rawMeta, { resizeOptions });

    expect(sharp).toHaveBeenCalledWith(data, { raw: { ...rawMeta, format: void 0 } });
    expect(mockResize).toHaveBeenCalledWith({ width: 128 });

    await expect(result).resolves.toMatchObject<PipeResult>({
      output: data,
      metadata: rawMeta,
    });
  });
});
