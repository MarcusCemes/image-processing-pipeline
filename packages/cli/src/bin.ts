#!/usr/bin/env node

/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { fork } from "child_process";
import { cpus, platform } from "os";
import { argv, env, on } from "process";
import { DEFAULT_LIBUV_THREADPOOL } from "./constants";

/** Environmental variable entry that signifies that process has already been forked */
const FORKED_VARIABLE = "IPP_FORKED";

const BYPASS_VARIABLE = "NO_FORK";

const CONCURRENCY_FLAGS = ["-c", "--concurrency"];

export async function main(): Promise<void> {
  // Prevent the script from running during testing
  if (typeof env.ALLOW_BIN === "undefined" && env.NODE_ENV === "test") return;

  const concurrency = elevateUvThreads();
  if (concurrency) {
    (await import("./init")).init(concurrency);
  }
}

main().catch((err) => console.error(err));

/**
 * Attempts to increase the number of UV threads available by setting
 * the UV_THREADPOOL_SIZE variable on supported platforms, otherwise
 * forks a new process.
 *
 * @returns {boolean} True on success, false if the process was forked
 * and execution should not continue.
 */
function elevateUvThreads(): number | false {
  if (typeof env[BYPASS_VARIABLE] !== "undefined") return DEFAULT_LIBUV_THREADPOOL;

  // Prevent an infinite loop of spawned processes
  if (typeof env[FORKED_VARIABLE] !== "undefined") {
    const detectedSize = parseInt(env.UV_THREADPOOL_SIZE as string);
    if (!detectedSize) return DEFAULT_LIBUV_THREADPOOL;
    return Math.max(detectedSize - DEFAULT_LIBUV_THREADPOOL, DEFAULT_LIBUV_THREADPOOL);
  }

  const concurrency = parseConcurrency() || cpus().length;
  const uvThreads = concurrency + DEFAULT_LIBUV_THREADPOOL;

  switch (platform()) {
    case "win32":
      // Ignore interrupts on the parent, there are no open handles apart from the
      // forked child process which will handle its own interrupts and exit accordingly
      on("SIGINT", () => null);

      fork(__filename, argv.slice(2), {
        env: {
          ...env,
          UV_THREADPOOL_SIZE: uvThreads.toString(),
          [FORKED_VARIABLE]: "1",
        },
      });
      return false;

    default:
      env.UV_THREADPOOL_SIZE = uvThreads.toString();
  }

  return uvThreads;
}

function parseConcurrency(): number | null {
  for (const flag of CONCURRENCY_FLAGS) {
    const index = argv.indexOf(flag);
    if (index !== -1) return parseInt(argv[index + 1]) || null;
  }

  return null;
}
