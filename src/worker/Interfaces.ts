// Responsive Image Builder - Worker/Interfaces
// Exports the worker interfaces
import { IConfig } from "../Config";
import { IExport, IFailedExport } from "../Interfaces";
import { IFile } from "../Preparation";

export const WORKER_ERRORS = {
  unknownError: "E200 Unknown error",
  metadataError: "E201 Metadata error",
  fingerprintError: "E202 Fingerprint error",
  resizeError: "E203 Resize error",
  webpError: "E204 WebP error",
  optimizeError: "E205 Optimize error",
  tmpFileError: "E206 Temporary file error",
  saveError: "E207 Save error",
  imageExistsError: "E208 Image already exists",
  noStreamError: "E209 No streams error",
  jobCancelled: "E210 Job cancelled"
};

/** Received command format from main process */
export interface ICommand {
  cmd: "INIT" | "FILE" | "KILL";
  config?: IConfig;
  file?: IFile;
  accelerate?: boolean;
}

export interface IWorkerResponse {
  status: "COMPLETE" | "FAILED";
  data: IExport | IFailedExport;
}

/** The result from the ImageProcessor class */
export interface IProcessorResult {
  success: boolean;
  export: IExport | IFailedExport;
}

export class WorkerError extends Error {
  public message: string;
  public error: Error;
  constructor(message: string, error?: Error) {
    super(message);
    this.name = "WorkerError";
    this.message = message;
    if (error) {
      this.error = error;
    }
  }
}
