import { createHash, getHashes } from "crypto";

const HASH_ALGORITHMS = ["blake2b512", "sha3-512", "sha256", "md5"];

export function hashBuffer(input: Buffer): string | null {
  const algorithm = getBestAlgorithm();
  if (algorithm === null) return null;

  try {
    return createHash(algorithm).update(input).digest("hex");
  } catch {
    return null;
  }
}

let hashAlgorithm: string | null;

function getBestAlgorithm(): string | null {
  if (hashAlgorithm === null) return null;

  const availableAlgorithms = getHashes();
  for (const algorithm of HASH_ALGORITHMS) {
    if (availableAlgorithms.indexOf(algorithm) !== -1) {
      hashAlgorithm = algorithm;
      break;
    }
  }

  return hashAlgorithm;
}
