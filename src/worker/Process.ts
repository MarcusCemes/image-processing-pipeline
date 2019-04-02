// Responsive Image Builder - Worker/Process
// The entry point to the image processing logic
import { createReadStream } from "fs-extra";
import sharp from "sharp";

import { IConfig } from "../Config";
import { SHORT_HASH_LENGTH } from "../Constants";
import { IExport } from "../Interfaces";
import { IFile } from "../Preparation";
import { IProcessorResult, WORKER_ERRORS, WorkerError } from "./Interfaces";
import { readMetadata } from "./Metadata";
import { generatePipeline } from "./Pipeline";
import { cleanupTmpFiles, commitSave, ITemporaryFile } from "./Save";
import { debug } from "./Utility";

sharp.concurrency(1); // Set for single thread operation

/** Ingests an image into the system and process it, returning an Export or a Failure */
export async function ingest(config: IConfig, job: IFile): Promise<IProcessorResult> {
  let temporaryFiles: ITemporaryFile[];

  try {
    // Read metadata, create the pipeline
    debug("Reading metadata", "INGEST");
    const metadata = await readMetadata(job.path);

    debug("Generating pipeline", "INGEST");
    const pipeline = await generatePipeline(config, job, metadata);
    temporaryFiles = pipeline.temporaryFiles;

    // Pipe data into the pipeline
    debug("Starting data flow", "INGEST");
    createReadStream(job.path).pipe(pipeline.stream);

    // Wait for all write streams to close, or throw an error
    await Promise.all(temporaryFiles.map(tmpfile => tmpfile.closed));
    debug("Data flow exhausted", "INGEST");

    let fingerprint: string;
    if (pipeline.fingerprint) {
      debug("Fingerprint generated", "INGEST");
      fingerprint = await pipeline.fingerprint;
    }

    debug("Committing save", "INGEST");
    const commitedSave = await commitSave(
      temporaryFiles,
      pipeline.manifestExport.original.name,
      fingerprint,
      config
    );

    const manifestExport: IExport = { ...pipeline.manifestExport };

    if (fingerprint) {
      manifestExport.original.fingerprint = config.shortHash
        ? fingerprint.substring(0, SHORT_HASH_LENGTH)
        : fingerprint;
    }

    // Add the correct entry to the manfiest export
    if (commitedSave.single) {
      manifestExport.export.single = { name: commitedSave.single };
    }
    if (commitedSave.sizes) {
      manifestExport.export.multiple = commitedSave.sizes;
    }

    return {
      success: true,
      export: manifestExport
    };
  } catch (processError) {
    cleanupTmpFiles(temporaryFiles);
    const failedExport: IProcessorResult = {
      success: false,
      export: {
        path: job.path,
        error: serializeError(processError)
      }
    };
    return failedExport;
  }
}

/** Serializes a WorkerError into a normal object */
function serializeError(error: WorkerError): { message: string } {
  const serializedError: any = {};
  if (error && error.message) {
    serializedError.message = error.message;
    if (error.error && error.error.message) {
      serializedError.error = error.error.message;
    }
  } else {
    serializedError.message = WORKER_ERRORS.unknownError;
  }
  return serializedError;
}
