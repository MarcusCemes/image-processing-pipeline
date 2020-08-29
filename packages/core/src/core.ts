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
  PrimitiveValue,
} from "@ipp/common";
import { produce } from "immer";
import sharp from "sharp";
import { hash } from "./hash";
import { PIPES } from "./pipes";

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
  sourceMetadata: MetadataFragment = {}
): Promise<PipelineResult> {
  const generatedMetadata = await generateMetadata(source);
  const fragment = {
    ...generatedMetadata,
    ...sourceMetadata,
  };

  const metadata: Metadata = {
    current: fragment,
    source: fragment,
  };

  const dataObject: DataObject = { buffer: source, metadata };

  const formats = await processPipeline(pipeline, dataObject);

  return {
    source: dataObject,
    formats: formats,
  };
}

/**
 * Runs the data object through a pipeline, yielding a collection of pipeline results */
async function processPipeline(
  pipeline: Pipeline,
  formats: DataObject | DataObject[]
): Promise<PipelineFormats> {
  const groupedFormats: Promise<PipelineFormats>[] = [];

  for (const format of wrapInArray(formats)) {
    for (const branch of pipeline) {
      groupedFormats.push(processBranch(branch, format));
    }
  }

  // Execute all branch/format trees in parallel
  return (await Promise.all(groupedFormats)).flat();
}

/** Runs the data object through a pipeline branch, processing any remaining pipelines */
async function processBranch(branch: PipelineBranch, data: DataObject): Promise<PipelineFormats> {
  const groupedFormats: PipelineFormats = [];

  // Generate the pipe result for the head of the branch
  const { pipe, name } = await resolvePipe(branch.pipe);
  const pipeResults = await processPipe(pipe, data, name, branch.options);

  if (branch.save) {
    const pipeFormats = wrapInArray(pipeResults).map((data) => ({
      data,
      saveKey: branch.save as PrimitiveValue,
    }));
    groupedFormats.push(...pipeFormats);
  }

  // Pass it to a subsequent pipeline
  if (branch.then) {
    groupedFormats.push(...(await processPipeline(branch.then, pipeResults)));
  }

  return groupedFormats;
}

/** Runs the data object through a single pipe */
async function processPipe(
  pipe: Pipe,
  data: DataObject,
  name: string,
  options?: any
): Promise<DataObject | DataObject[]> {
  try {
    const result = await pipe(data, options);

    if (!result) return [];

    if (result instanceof Array) {
      return result.map(updateHash);
    }

    return updateHash(result);
  } catch (err) {
    throw new PipelineException(`[${name}] ${err.message}`);
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
    throw new PipelineException(`Metadata error: ${err.message || err}`);
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
    throw new PipelineException(`Could not resolve pipe: ${serialisedPipe}`).extend(err);
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
  return ((obj instanceof Array ? obj : [obj]) as unknown) as T extends any[] ? T : [T];
}
