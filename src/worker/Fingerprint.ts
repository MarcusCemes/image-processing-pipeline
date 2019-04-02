// Responsive Image Builder - Worker/Fingerprint
// Generates the source image fingerprint
import { createHash, Hash } from "crypto";

import { WORKER_ERRORS, WorkerError } from "./Interfaces";

export interface IFingerprint {
  stream: Hash;
  fingerprint: Promise<string>;
}

/**
 * Creates a hash stream and promise pair to resolve the stream's fingerprint
 */
export function fingerprintFactory(algorithm: string): IFingerprint {
  try {
    const stream = createHash(algorithm).setEncoding("hex");
    const fingerprint = new Promise<string>((resolve, reject) => {
      stream
        .once("data", (hash: string) => {
          resolve(hash);
        })
        .once("error", streamError => {
          reject(new WorkerError(WORKER_ERRORS.fingerprintError, streamError));
        });
    });

    return {
      stream,
      fingerprint
    };
  } catch (originalError) {
    throw new WorkerError(WORKER_ERRORS.fingerprintError, originalError);
  }
}
