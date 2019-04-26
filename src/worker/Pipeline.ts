// Responsive Image Builder - Worker/Pipeline
// Generates the image processing pipeline (Node.js streams)
import { posix } from "path";
import sharp, { Metadata, Sharp } from "sharp";
import { PassThrough, Readable } from "stream";

import { IConfig, IExportPreset, IUniversalSettings } from "../Config";
import { IExport, IExportSize } from "../Interfaces";
import { IFile } from "../Preparation";
import { convert } from "./Convert";
import { fingerprintFactory, IFingerprint } from "./Fingerprint";
import { optimize } from "./Optimize";
import { resize } from "./Resize";
import { ITemporaryFile, temporarySave } from "./Save";
import { trace } from "./Trace";
import { getFirstDefined } from "./Utility";
import { webp } from "./WebP";

interface IPipeline {
  stream: Sharp | PassThrough;
  temporaryFiles: ITemporaryFile[];
  fingerprint: Promise<string | null>;
  manifestExport: IExport;
}

/** Dimensions */
interface IDim {
  w: number; // width
  h: number; // height
}

export interface IImageStream {
  stream: Readable;
  format: string;
  size?: IExportSize;
  template: string;
}

export type IImageStreams = IImageStream[];

export async function generatePipeline(
  config: IConfig,
  job: IFile,
  metadata: Metadata
): Promise<IPipeline> {
  // decide what needs to be done for this job
  const {
    targetFormat,
    shouldConvert,
    exportSizes,
    original,
    shouldFallback,
    shouldOptimize,
    shouldWebp,
    shouldFingerprint,
    shouldTrace
  } = calculateJobInformation(config, metadata, job);

  // Generate the pipeline using extensible "plug-and-play modules"
  const pipelineRoot = new PassThrough();

  // * FINGERPRINT - hijack the stream and digest
  let fingerprint: IFingerprint;
  if (shouldFingerprint) {
    fingerprint = fingerprintFactory(config.hashAlgorithm);
    pipelineRoot.pipe(fingerprint.stream);
  }

  // * TRACE - hijack the stream and trace an SVG
  let traceStream: IImageStream;
  if (shouldTrace) {
    const traceTemplate = getFirstDefined(
      ((config[targetFormat] as IUniversalSettings) || {}).traceTemplate,
      config.traceTemplate
    );
    const traceOptions = getFirstDefined(
      ((config[targetFormat] as IUniversalSettings) || {}).traceOptions,
      config.traceOptions
    );
    traceStream = trace(pipelineRoot, traceTemplate, traceOptions);
  }

  let pipeline: Readable = pipelineRoot;

  // * CONVERT - convert the source format
  if (shouldConvert) {
    pipeline = convert(pipelineRoot, metadata.format, targetFormat);
  }

  // * RESIZE - the first step of the pipeline, also converts if necessary
  const singleExportTemplate = getFirstDefined(
    ((config[targetFormat] as IUniversalSettings) || {}).singleExportTemplate,
    config.singleExportTemplate
  );
  const multipleExportTemplate = getFirstDefined(
    ((config[targetFormat] as IUniversalSettings) || {}).multipleExportTemplate,
    config.multipleExportTemplate
  );
  let imageStreams: IImageStreams = resize(
    pipeline,
    targetFormat,
    exportSizes,
    singleExportTemplate,
    multipleExportTemplate
  );

  // * WEBP - create the webp streams
  const webpOptimizerSettings = (config.webp || {}).optimizerSettings;
  imageStreams = webp(imageStreams, webpOptimizerSettings, shouldFallback, shouldWebp);

  // * OPTIMIZE - optimize the non-webp streams
  if (shouldOptimize) {
    const optimizerSettings = getFirstDefined(
      ((config[targetFormat] as IUniversalSettings) || {}).optimize,
      config.optimize
    );
    imageStreams = optimize(imageStreams, optimizerSettings);
  }

  // * SAVE - save the image data to temporary files
  if (traceStream) {
    imageStreams.push(traceStream);
  }
  const temporaryFiles = await temporarySave(imageStreams, config.out, job, config.flatExport);

  const parsedPath = posix.parse(job.path);
  const manifestExport: IExport = {
    original,
    export: {
      format: targetFormat,
      fallback: shouldFallback && targetFormat !== "webp",
      webp: shouldWebp,
      relativeDir: posix.relative(job.base, parsedPath.dir)
    }
  };

  return {
    stream: pipelineRoot,
    temporaryFiles,
    fingerprint: fingerprint ? fingerprint.fingerprint : null,
    manifestExport
  };
}

/** Calculate the job information, such as the target format, sizes, options, etc... */
function calculateJobInformation(config: IConfig, metadata: Metadata, job: IFile) {
  const parsedPath = posix.parse(job.path);

  const targetFormat = getFirstDefined(
    ((config[metadata.format] as IUniversalSettings) || {}).convert,
    config.convert,
    metadata.format
  );

  const shouldConvert = targetFormat === metadata.format;

  const original: IExport["original"] = {
    name: parsedPath.name,
    fullName: posix.relative(job.base, posix.join(parsedPath.dir, parsedPath.name)),
    extension: parsedPath.ext
  };

  const shouldResize = getFirstDefined(
    ((config[targetFormat] as IUniversalSettings) || {}).resize,
    config.resize
  );
  const shouldOptimize = getFirstDefined(
    ((config[targetFormat] as IUniversalSettings) || {}).optimize,
    config.optimize
  );
  const shouldWebp = getFirstDefined(
    ((config[targetFormat] as IUniversalSettings) || {}).exportWebp,
    config.exportWebp
  );
  const shouldFallback = getFirstDefined(
    ((config[targetFormat] as IUniversalSettings) || {}).exportFallback,
    config.exportFallback
  );
  const shouldFingerprint = getFirstDefined(
    ((config[targetFormat] as IUniversalSettings) || {}).fingerprint,
    config.fingerprint
  );
  const shouldTrace = getFirstDefined(
    ((config[targetFormat] as IUniversalSettings) || {}).trace,
    config.trace
  );

  let exportSizes: IExportSize[];
  if (shouldResize) {
    const exportPresets = getFirstDefined(
      ((config[targetFormat] as IUniversalSettings) || {}).exportPresets,
      config.exportPresets
    );
    exportSizes = calculateSizes(metadata, exportPresets);
  }

  return {
    targetFormat,
    shouldConvert,
    original,
    exportSizes,
    shouldOptimize,
    shouldWebp,
    shouldFallback,
    shouldFingerprint,
    shouldTrace
  };
}

/**
 * Returns a list of export jobs based on the export presets and image metadata.
 *
 * Intelligently calculates sizes to prevent duplicate images, while retaining at least one
 * full-resolution export (as long as it's smaller than the largest preset)
 */
function calculateSizes(metadata: sharp.Metadata, exportPresets: IExportPreset[]): IExportSize[] {
  const resizeJobs: IExportSize[] = [];

  for (const exportPreset of exportPresets) {
    let shouldExportSize: boolean = true;

    // Calculate the constrained preset dimensions
    const exportDimensions = constrainSize(
      { w: metadata.width, h: metadata.height },
      { w: exportPreset.width, h: exportPreset.height }
    );

    // If the preset isn't forced, check if the size has already been added
    if (exportPreset.force !== true) {
      for (const size of resizeJobs) {
        if (size.width === exportDimensions.w || size.height === exportDimensions.h) {
          shouldExportSize = false;
          break;
        }
      }
    }

    if (shouldExportSize === true) {
      const exportSize: IExportSize = {
        name: null,
        width: exportDimensions.w,
        height: exportDimensions.h,
        preset: exportPreset.name
      };
      if (exportPreset.default) {
        exportSize.default = true;
      }
      resizeJobs.push(exportSize);
    }
  }

  return resizeJobs;
}

/** Constrains a set of image dimensions to a target "box" */
function constrainSize(source: IDim, target: IDim): IDim {
  const newDimensions: IDim = { w: source.w, h: source.h };
  if (newDimensions.h > target.h) {
    newDimensions.h = target.h;
    newDimensions.w *= newDimensions.h / source.h;
  }
  if (newDimensions.w > target.w) {
    newDimensions.w = target.w;
    newDimensions.h = (source.h * newDimensions.w) / source.w;
  }
  newDimensions.w = Math.round(newDimensions.w);
  newDimensions.h = Math.round(newDimensions.h);
  return newDimensions;
}
