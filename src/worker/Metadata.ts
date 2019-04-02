// Responsive Image Builder - Worker/Metadata
// Reads image metadata
import sharp, { Metadata } from "sharp";
import { WORKER_ERRORS, WorkerError } from "./Interfaces";

/**
 * Reads image metadata using SHARP
 * @param {string} file The path to the image file
 */
export async function readMetadata(file: string): Promise<Metadata> {
  try {
    return await sharp(file).metadata();
  } catch (originalError) {
    throw new WorkerError(WORKER_ERRORS.metadataError, originalError);
  }
}
