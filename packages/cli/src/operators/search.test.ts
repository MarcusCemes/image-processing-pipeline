/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { searchForImages } from "./search";
import { PassThrough } from "stream";
import fs, { Dir, Dirent, Stats } from "fs";
import { isTaskSource, TaskSource } from "./types";
import { Exception } from "common/src";

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
    stat: jest.fn(
      async () => <Partial<Stats>>{ isFile: jest.fn(() => false), isDirectory: jest.fn(() => true) }
    ),
  },
}));

const awaitTaskSource = async (source: AsyncIterable<TaskSource | Exception>) => {
  const resolved: TaskSource[] = [];
  for await (const tsk of source) {
    if (isTaskSource(tsk)) resolved.push(tsk);
  }
  return resolved;
};

describe("search.ts", () => {
  afterEach(() => jest.clearAllMocks());

  test("handle input of file paths properly", async () => {
    (fs.promises.stat as jest.Mock).mockResolvedValue({
      isFile: jest.fn(() => true),
      isDirectory: jest.fn(() => false),
    });

    expect(
      await searchForImages(["path/to/supported.png", "path/to/folder/"]).pipe(awaitTaskSource)
    ).toHaveLength(1);
  });

  test("handle input of file path and directory properly", async () => {
    // Setup two paths
    // 0 is file & 1 is dir
    (fs.promises.stat as jest.Mock)
      .mockResolvedValueOnce(<Partial<Stats>>{
        isFile: jest.fn(() => true),
        isDirectory: jest.fn(() => false),
      })
      .mockResolvedValueOnce(<Partial<Stats>>{
        isFile: jest.fn(() => false),
        isDirectory: jest.fn(() => true),
      });

    const folderPath = "path/to/folder/";
    // setup some read returns for the folder.
    // Returns 2 supported & one unsupported file
    (fs.promises.opendir as jest.Mock).mockResolvedValue(<Partial<Dir>>{
      [Symbol.asyncIterator]: () =>
        <AsyncIterableIterator<Dirent>>{
          next: jest
            .fn()
            .mockResolvedValueOnce({
              value: <Partial<Dirent>>{
                isDirectory: jest.fn(() => false),
                isFile: jest.fn(() => true),
                name: "valid1.png",
              },
            })
            .mockResolvedValueOnce({
              value: <Partial<Dirent>>{
                isDirectory: jest.fn(() => false),
                isFile: jest.fn(() => true),
                name: "valid2.png",
              },
            })
            .mockResolvedValueOnce({
              value: <Partial<Dirent>>{
                isDirectory: jest.fn(() => false),
                isFile: jest.fn(() => true),
                name: "invalid.file",
              },
            })
            .mockResolvedValueOnce({
              done: true,
            }) as unknown,
        },
      path: folderPath,
    });

    expect(
      await searchForImages(["path/to/supported.png", folderPath]).pipe(awaitTaskSource)
    ).toHaveLength(3);
  });
});
