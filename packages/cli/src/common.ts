import { Format } from "@rib/broker";

/** Supported image extensions */
export const EXTENSIONS = ["jpg", "jpeg", "png", "gif", "tiff", "webp", "svg"];

export interface JobResult {
  source: string;
  formats: Format[];
}
