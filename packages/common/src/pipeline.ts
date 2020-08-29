/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from "./metadata";

/** A primitive value that can be easily serialised and used in metadata */
export type PrimitiveValue = boolean | number | string | Buffer;

/** A binary buffer with an associated metadata object */
export interface DataObject {
  buffer: Buffer;
  metadata: Metadata;
}

/**
 * The template that a pipe function must conform to. A pipe is a function that applies
 * a transformation to an image buffer, with access to the image metadata, and returns
 * a new buffer, extending the metadata object if needed. The returned buffer and
 * metadata object will be passed to any future pipes down that chain.
 */
export type Pipe<O = any> = (
  data: DataObject,
  options?: O
) => Promise<undefined | DataObject | DataObject[]>;

/**
 * A saved chunk of the pipeline process. It is generated from a DataObject returned from a
 * pipe when that pipe is marked with a `save` property in the pipeline schema, indicating
 * that that particular pipe's result should be saved as an exported format. The value of
 * `saveKey` matches the value defined in the pipeline schema.
 */
export type PipelineFormat = { data: DataObject; saveKey: PrimitiveValue };

/** All array of PipelineResult objects that represents all exported formats of a pipeline process */
export type PipelineFormats = PipelineFormat[];

/**
 * The result of a pipeline process executed by @ipp/core.
 *
 * Contains the source data object, which is the initial input buffer
 * augmented with initial metadata, and the resulting formats from the pipeline
 * process.
 */
export interface PipelineResult {
  source: DataObject;
  formats: PipelineFormats;
}

/**
 * The template of a single branch of a pipeline schema. It may only have one input, but the
 * result of the first pipe may be sent to multiple consecutive pipes.
 *
 * The save property indicates whether the output of the pipe should also be exported as from
 * the pipeline branch, which can later be identified by the value of the save property.
 */
export interface PipelineBranch<O = any> {
  pipe: string | { resolve: string; module?: string } | Pipe;
  options?: O;
  save?: PrimitiveValue;
  then?: Pipeline;
}

/**
 * The template that a complete pipeline schema must adhere to. It is a collection of
 * "tree branches", where the beginning of each branch will receive the original
 * image, which will subsequently be piped into the next connected pipes.
 *
 * Once the pipeline has finished executing, any pipeline branch that have the `save` property
 * defined will have their output image buffer saved as an exported format of the pipeline.
 */
export type Pipeline = PipelineBranch[];
