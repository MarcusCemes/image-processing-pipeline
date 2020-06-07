import { Metadata, Pipe, Pipeline, PipelineException, PipeResult } from "@ipp/common";
import sharp from "sharp";

import { PIPES } from "./pipes";

interface PipelineResult {
  data: Buffer;
  metadata: Metadata;
  save: string;
}

export async function processPipeline(
  input: Buffer,
  pipeline: Pipeline[],
  metadata?: { [index: string]: any }
): Promise<PipelineResult[]> {
  const fullMetadata = { ...metadata, ...(await readMetadata(input)) };
  return Promise.all(pipeline.map((chunk) => processPipelineChunk(input, chunk, fullMetadata))).then((chunks) =>
    chunks.reduce((p, c) => [...p, ...c], [])
  );
}

async function readMetadata(input: Buffer): Promise<Metadata> {
  try {
    const { width, height, channels, format } = await sharp(input).metadata();
    if (!width || !height || !channels || !format) throw new Error("missing properties");
    return {
      width,
      height,
      channels,
      format,
      originalFormat: format,
    };
  } catch (err) {
    throw new PipelineException(`Metadata error: ${err.message || err}`);
  }
}

async function processPipelineChunk(input: Buffer, pipeline: Pipeline, metadata: Metadata): Promise<PipelineResult[]> {
  const { pipe, name } = await resolvePipe(pipeline.pipe);
  if (typeof pipe !== "function")
    throw new PipelineException(
      `Could not resolve pipe: ${
        typeof pipeline.pipe === "object"
          ? `${pipeline.pipe.resolve}${pipeline.pipe.module ? `.${pipeline.pipe.module}` : ""}`
          : pipeline.pipe
      }`
    );

  const result = await processPipe(pipe, input, metadata, name, pipeline.options);

  const nextPipes: Pipeline[] = Array.isArray(pipeline.then) ? pipeline.then : pipeline.then ? [pipeline.then] : [];
  const results: PipelineResult[] = [];

  for (const item of Array.isArray(result) ? result : [result]) {
    if (pipeline.save) {
      results.push({
        data: item.output,
        metadata: item.metadata,
        save: pipeline.save,
      });
    }

    const nextPipesResults = await Promise.all(
      nextPipes.map((next) => processPipelineChunk(item.output, next, item.metadata))
    );

    for (const nextItems of nextPipesResults) {
      results.push(...nextItems);
    }
  }

  return results;
}

async function resolvePipe(pipe: Pipeline["pipe"]): Promise<{ pipe: Pipe; name: string }> {
  if (typeof pipe === "string") return { pipe: PIPES[pipe], name: pipe };

  if (typeof pipe === "object" && "resolve" in pipe) {
    const importedPipe = await import(pipe.resolve);
    if (pipe.module) return { pipe: importedPipe[pipe.module], name: `${pipe.resolve}.${pipe.module}` };
    return { pipe: importedPipe, name: pipe.resolve };
  }

  return { pipe, name: pipe?.name || "NO_PIPE" };
}

async function processPipe(
  pipe: Pipe,
  input: Buffer,
  metadata: Metadata,
  name: string,
  options?: PipeOptions
): Promise<PipeResult | PipeResult[]> {
  try {
    const result = await pipe(input, metadata, options);
    return result;
  } catch (err) {
    throw new PipelineException(`[${name}] ${err.message}`);
  }
}
