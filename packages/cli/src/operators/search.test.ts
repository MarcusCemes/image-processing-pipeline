/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs, { Dirent, Stats } from "fs";
import { parse } from "path";
import { PassThrough } from "stream";
import { searchForImages } from "./search";

jest.mock("fs", () => ({
  createReadStream: jest.fn(() => {
    const stream = new PassThrough();
    stream.end();
    return stream;
  }),
  createWriteStream: jest.fn(() => new PassThrough()),
  promises: {
    opendir: jest.fn(async () => []),
    readdir: jest.fn(async () => []),
    mkdir: jest.fn(async () => void 0),
    stat: jest.fn(async () => <Partial<Stats>>{ isFile: () => false, isDirectory: () => true }),
  },
}));

function statsEntry(file: boolean): Partial<Stats> {
  return { isFile: () => file, isDirectory: () => !file };
}

async function collect<T>(it: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of it) result.push(item);
  return result;
}

async function* fakeOpendirIterator(files: string[]): AsyncIterableIterator<Dirent> {
  for (const file of files) {
    const isFile = parse(file).ext !== "";
    yield {
      isDirectory: () => !isFile,
      isFile: () => isFile,
      name: file,
    } as Dirent;
  }
}

describe("CLI image searching", () => {
  afterEach(() => jest.clearAllMocks());

  const statMock = fs.promises.stat as jest.Mock;
  const opendirMock = fs.promises.opendir as jest.Mock;

  test("handles a single image input", async () => {
    statMock.mockResolvedValue(statsEntry(true));
    const images = await collect(searchForImages(["/path/to/image.jpg"]));
    expect(images).toEqual([{ root: "/path/to", file: "image.jpg" }]);
  });

  test("differentiates image and directory paths", async () => {
    statMock.mockResolvedValue(statsEntry(true));

    // The image should be found, the folder is mocked to any empty array
    const paths = ["/path/to/supported.png", "/path/to/folder/"];
    const foundImages = await collect(searchForImages(paths));
    expect(foundImages).toEqual([{ root: "/path/to", file: "supported.png" }]);
    expect(foundImages).toHaveLength(1);
  });

  test("walks a directory and resolves images", async () => {
    opendirMock.mockImplementation(async () =>
      fakeOpendirIterator(
        ["image1.png", "image2.jpg", "image3.svg", "file.txt"].map((file) => `/path/to/${file}`)
      )
    );

    statMock.mockResolvedValue(statsEntry(true));
    [true, false].forEach((isFile) => statMock.mockResolvedValueOnce(statsEntry(isFile)));

    const foundImages = await collect(searchForImages(["/path/to/image.png", "/path/to"]));

    expect(foundImages).toEqual(
      ["image.png", "image1.png", "image2.jpg", "image3.svg"].map((file) => ({
        root: "/path/to",
        file,
      }))
    );

    expect(foundImages).toHaveLength(4);
  });
});
