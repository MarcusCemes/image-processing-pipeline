/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BaseMetadata,
  DataObject,
  Metadata,
  MetadataFragment,
  Pipe,
  Pipeline,
  PipelineBranch,
  PipelineException,
  PipelineFormats,
  PipelineResult,
  PipelineTest,
  PrimitiveValue,
} from "@ipp/common";
import { Mutex } from "async-mutex";
import { produce } from "immer";
import sharp from "sharp";
import { hash } from "./hash";
import { PIPES } from "./pipes";

interface CoreOptions {
  /** Parallelise pipe operations, otherwise limited to one pipe operation at a time (default: false) */
  parallel?: boolean;
}

/**
 * Takes an input buffer and pipeline schema, and runs the buffer recursively
 * through the pipeline, returning all output formats that were marked to be saved.
 *
 * Internally uses a heavily recursive and parallel iteration that will walk through
 * the pipeline schema, returning an array of all generated results in order of
 * definition.
 */
export async function executePipeline(
  pipeline: Pipeline,
  source: Buffer,
  sourceMetadata: MetadataFragment = {},
  options: CoreOptions = {}
): Promise<PipelineResult> {
  const { parallel = false } = options;

  const generatedMetadata = await generateMetadata(source);
  const fragment = {
    ...generatedMetadata,
    ...sourceMetadata,
  };

  const metadata: Metadata = {
    current: fragment,
    source: fragment,
  };

  const mutex = parallel ? void 0 : new Mutex();
  const dataObject: DataObject = { buffer: source, metadata };

  const formats = await processPipeline(pipeline, dataObject, mutex);

  return {
    source: dataObject,
    formats: formats,
  };
}

/**
 * Runs the data object through a pipeline, yielding a collection of pipeline results */
async function processPipeline(
  pipeline: Pipeline,
  formats: DataObject | DataObject[],
  mutex?: Mutex
): Promise<PipelineFormats> {
  const groupedFormats: Promise<PipelineFormats>[] = [];

  for (const format of wrapInArray(formats)) {
    for (const branch of pipeline) {
      if (branch.test !== undefined && !processBranchTest(branch.test, format.metadata)) {
        groupedFormats.push(processBranchNoop(branch, format));
        continue;
      }
      groupedFormats.push(processBranch(branch, format, mutex));
    }
  }

  // Execute all branch/format trees in parallel
  return (await Promise.all(groupedFormats)).flat();
}

function processBranchTest(test: PipelineTest, metadata: Metadata): boolean {
  if (typeof test === "boolean") return test; // test boolean

  const filePath = metadata.source.path as string;
  if (typeof test === "string") return test === filePath; // path strict equal check

  if (!Array.isArray(test)) test = [test];

  for (const t of test) {
    if (
      (filePath && t instanceof RegExp && !t.test(filePath)) ||
      (typeof t === "function" && !t(filePath, metadata))
    ) {
      return false;
    }
  }

  return true;
}

/** Runs the data object through a pipeline branch, processing any remaining pipelines */
async function processBranch(
  branch: PipelineBranch,
  data: DataObject,
  mutex?: Mutex
): Promise<PipelineFormats> {
  const groupedFormats: PipelineFormats = [];

  // Generate the pipe result for the head of the branch
  const { pipe, name } = await resolvePipe(branch.pipe);
  const pipeResults = await processPipe(pipe, data, name, branch.options, mutex);

  if (branch.save) {
    const pipeFormats = wrapInArray(pipeResults).map((data) => ({
      data,
      saveKey: branch.save as PrimitiveValue,
    }));
    groupedFormats.push(...pipeFormats);
  }

  // Pass it to a subsequent pipeline
  if (branch.then) {
    groupedFormats.push(...(await processPipeline(branch.then, pipeResults, mutex)));
  }

  return groupedFormats;
}

/** Runs the data object through a pipeline branch, processing any remaining pipelines */
async function processBranchNoop(
  branch: PipelineBranch,
  dataObject: DataObject
): Promise<PipelineFormats> {
  return wrapInArray(dataObject).map((data) => ({
    data,
    saveKey: branch.save as PrimitiveValue,
  }));
}

/** Runs the data object through a single pipe */
async function processPipe(
  pipe: Pipe,
  data: DataObject,
  name: string,
  options?: any,
  mutex?: Mutex
): Promise<DataObject | DataObject[]> {
  const release = mutex && (await mutex.acquire());
  try {
    const result = await pipe(data, options);

    if (!result) return [];

    if (result instanceof Array) {
      return result.map(updateHash);
    }

    return updateHash(result);
  } catch (err) {
    throw new PipelineException(`[${name}] ${(err as Error).message}`);
  } finally {
    if (release) release();
  }
}

/** Calculates some basic initial metadata for the pipeline process, such as the format */
async function generateMetadata(input: Buffer): Promise<BaseMetadata> {
  try {
    const { width, height, channels, format } = await sharp(input).metadata();
    if (!width || !height || !channels || !format) throw new Error("missing properties");
    const inputHash = hash(input);

    const baseMeta: BaseMetadata = {
      width,
      height,
      channels,
      format,
      hash: inputHash,
    };
    return baseMeta;
  } catch (err) {
    throw new PipelineException(`Metadata error: ${(err as Error)?.message || err}`);
  }
}

/** Dynamically attempts to resolve the given pipe using the import() function */
async function resolvePipe(pipe: PipelineBranch["pipe"]): Promise<{ pipe: Pipe; name: string }> {
  const serialisedPipe = typeof pipe === "string" ? pipe : JSON.stringify(pipe);

  try {
    if (typeof pipe === "string") return { pipe: PIPES[pipe], name: pipe };

    if (typeof pipe === "object" && pipe !== null && "resolve" in pipe) {
      const importedPipe = await import(pipe.resolve);
      if (pipe.module) {
        return { pipe: importedPipe[pipe.module], name: `${pipe.resolve}.${pipe.module}` };
      }

      if (typeof importedPipe !== "function") {
        throw new PipelineException(`Could not import ${serialisedPipe}, not a function`);
      }

      return { pipe: importedPipe, name: pipe.resolve };
    }

    if (typeof pipe === "function") return { pipe, name: pipe.name };

    throw new PipelineException("Unknown pipe resolution scheme");
  } catch (err) {
    if (err instanceof PipelineException) throw err;
    throw new PipelineException(`Could not resolve pipe: ${serialisedPipe}`).extend(err as Error);
  }
}

/** Generates a new hash from a DataObject and returns a new DataObject */
function updateHash(data: DataObject): DataObject {
  return produce(data, (draft) => {
    draft.metadata.current.hash = hash(data.buffer);
  });
}

/** Wraps an item in an array, or returns the item if it is an array
 *
 * @example
 * wrapInArray(obj) === obj instanceof Array ? obj : [obj]
 */
function wrapInArray<T>(obj: T): T extends any[] ? T : T[] {
  return (obj instanceof Array ? obj : [obj]) as unknown as T extends any[] ? T : [T];
}
