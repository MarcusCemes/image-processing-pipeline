/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { fork } from "child_process";
import { platform } from "os";
import { env, on } from "process";
import { main } from "./bin";
import { BYPASS_VARIABLE, FORKED_VARIABLE } from "./constants";
import { init } from "./init";

jest.mock("./init", () => ({ init: jest.fn() }));

jest.mock("os", () => ({
  cpus: jest.fn(() => new Array(4)),
  platform: jest.fn(),
}));

jest.mock("process", () => ({
  env: { NODE_ENV: "test" },
  argv: ["ipp"],
  on: jest.fn(),
  stdout: {
    write: jest.fn(),
  },
}));

jest.mock("child_process", () => ({ fork: jest.fn() }));

describe("bin entry script", () => {
  beforeAll(() => (env.ALLOW_BIN = "1"));
  afterAll(() => delete env.ALLOW_BIN);

  describe("executes platform specific behavior", () => {
    afterEach(() => jest.clearAllMocks());

    test.each<[string, NodeJS.Platform, boolean]>([
      ["Windows", "win32", true],
      ["macOS", "darwin", false],
      ["Linux", "linux", false],
    ])("for %s", async (_, currentPlatform, shouldFork) => {
      (platform as jest.MockedFunction<typeof platform>).mockReturnValue(currentPlatform);

      await expect(main()).resolves.toBeUndefined();

      expect(platform).toHaveBeenCalled();

      if (shouldFork) {
        expect(fork).toHaveBeenCalled();
        expect(on).toHaveBeenCalledWith("SIGINT", expect.any(Function));
        expect(init).not.toHaveBeenCalled();
      } else {
        expect(fork).not.toHaveBeenCalled();
        expect(on).not.toHaveBeenCalled();
        expect(init).toHaveBeenCalled();
      }
    });
  });

  describe(`respects the`, () => {
    afterEach(() => jest.clearAllMocks());

    describe.each([FORKED_VARIABLE, BYPASS_VARIABLE])("%s env variable", (variable) => {
      test.each([void 0, "1"])("when it is %s", async (value) => {
        (platform as jest.MockedFunction<typeof platform>).mockReturnValue("win32");
        env[variable] = value;

        await expect(main()).resolves.toBeUndefined();

        if (value) {
          expect(fork).not.toHaveBeenCalled();
        } else {
          expect(fork).toHaveBeenCalled();
        }

        delete env[variable];
      });
    });
  });
});
