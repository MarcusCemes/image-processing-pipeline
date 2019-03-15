// tslint:disable
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import { Duplex, PassThrough } from "stream";

import { IConfig } from "./Config";
import { IExport, IExportSize, IFailedExport } from "./Interfaces";
import { IFile } from "./Preparation";

const pngOptimizer = require("imagemin-pngquant");
const jpegOptimizer = require("imagemin-mozjpeg");
const svgOptimizer = require("imagemin-svgo");
const gifOptimizer = require("imagemin-gifsicle");
const debug = require("debug")(
  "RIBThread" + (process.env.WORKER_ID ? ":" + process.env.WORKER_ID : "")
);
// tslint:enable

export interface ICommand {
  cmd: "INIT" | "FILE" | "KILL";
  config?: IConfig;
  file?: IFile;
  accelerate?: boolean; // Unlock multi-threading
}

export interface IThreadResponse {
  status: "COMPLETE" | "FAILED";
  data: IExport | IFailedExport;
}

/** Contains useful path elements for the export */
interface IExportPaths {
  parsed: path.ParsedPath; // Parsed path
  relative: string; // Relative (to base) output URL-type path WITHOUT extension
  output: string; // Absolute output path WITHOUT extension
}

/** A simple way to store width and height dimensions */
interface IDimensions {
  width: number;
  height: number;
}

/** Contains information about each resize job, such as the dimensions and the name */
interface IResizeJob {
  width: number;
  height: number;
  name: string;
  default?: true;
}

/** Contains the pipeline stream, as well as open WriteStreams */
interface ImagePipeline {
  pipeline: sharp.Sharp | PassThrough;
  writeStreams: fs.WriteStream[];
  export: IExport;
}

class ProcessThread {
  // Used for thread termination
  public activeJobs: number = 0;
  public queueExit: boolean = false;

  // INIT variables
  public config: IConfig;

  // Set single thread operation
  constructor() {
    sharp.concurrency(1);
  }

  /**
   * Start listening for thread commands
   */
  public listenForCommands(): void {
    debug("Thread start");
    process.on("message", this.handleCommand.bind(this));
  }

  /** Generate path information that is needed for the export */
  public generatePaths(file: IFile): IExportPaths {
    const parsed = path.parse(file.path);
    const relative = path.relative(file.base, path.join(parsed.dir, parsed.name));
    const output = path.join(this.config.out, this.config.flatExport ? parsed.name : relative);
    return { parsed, relative, output };
  }

  /**
   * Generate the image export pipeline, returning the file writers and export job
   * @returns {ImagePipeline} The completed image pipeline, with relevant information
   */
  public async generateImagePipeline(
    file: IFile,
    metadata: sharp.Metadata
  ): Promise<ImagePipeline> {
    const resizeJobs = this.generateSizes(metadata);
    const paths = this.generatePaths(file);
    const shouldExportWebp = this.getOption("exportWebp", metadata.format);

    let pipeline: ImagePipeline["pipeline"];
    const writeStreams: ImagePipeline["writeStreams"] = [];
    const manifestExport: IExport = {
      name: paths.parsed.name,
      fullName: paths.relative,
      extension: paths.parsed.ext,
      webp: shouldExportWebp
    };

    await fs.ensureDir(path.parse(paths.output).dir);

    try {
      if (!resizeJobs) {
        // Generate a single type export

        pipeline = new PassThrough();
        writeStreams.push(
          ...this.saveImage(pipeline, paths.output, paths.parsed.ext, metadata, shouldExportWebp)
        );
      } else {
        // Generate a multiple type export
        manifestExport.sizes = [];

        pipeline = sharp();
        for (const resizeJob of resizeJobs) {
          const resizedImage = pipeline
            .clone()
            .resize(resizeJob.width, resizeJob.height, { fit: "inside", withoutEnlargement: true });
          writeStreams.push(
            ...this.saveImage(
              resizedImage,
              paths.output + "_" + resizeJob.name,
              paths.parsed.ext,
              metadata,
              shouldExportWebp
            )
          );

          const size: IExportSize = {
            name: resizeJob.name,
            width: resizeJob.width,
            height: resizeJob.height
          };
          if (resizeJob.default) {
            size.default = resizeJob.default;
          }
          manifestExport.sizes.push(size);
        }
      }
    } catch (err) {
      // Perform cleanup
      for (const writer of writeStreams) {
        writer.on("finish", () => fs.unlink(writer.path));
        writer.end();
      }
      throw err;
    }

    return {
      pipeline,
      writeStreams,
      export: manifestExport
    };
  }

  /**
   * Generate the required export sizes, or return false if resizing is disabled.
   * @returns {IResizeJob[]|false} An array of resize jobs, or false if resize is not necessary
   */
  public generateSizes(metadata: sharp.Metadata): IResizeJob[] | false {
    if (!this.getOption("resize", metadata.format)) {
      return false;
    }

    // An array of exported sizes to prevent duplicate exports
    // These are also used for the manifest "sizes" entry
    const resizeJobs: IResizeJob[] = [];

    const exportPresets = this.getOption("exportPresets", metadata.format);

    // Decide whether the each preset should be exported
    // Priority is given first comes first served
    for (const exportPreset of exportPresets) {
      let shouldExport: boolean = true;

      // Generate "downscaled" size
      const exportDimensions: IDimensions = this.constrainSize(
        { width: metadata.width, height: metadata.height },
        { width: exportPreset.width, height: exportPreset.height }
      );

      // If the preset isn't forced, check if the size has already been added
      if (exportPreset.force !== true) {
        for (const size of resizeJobs) {
          if (size.width === exportDimensions.width || size.height === exportDimensions.height) {
            shouldExport = false;
            break;
          }
        }
      }

      if (shouldExport === true) {
        const exportSize: IResizeJob = {
          name: exportPreset.name,
          width: exportDimensions.width,
          height: exportDimensions.height
        };
        if (exportPreset.default) {
          exportSize.default = true;
        }
        resizeJobs.push(exportSize);
      }
    }

    return resizeJobs;
  }

  /** Get option from configuration, with priority going to codec overrides */
  public getOption(option: string, codec?: string) {
    if (codec && typeof (this.config[codec] || {})[option] !== "undefined") {
      return this.config[codec][option];
    } else {
      return this.config[option];
    }
  }

  /**
   * Cluster message event handler
   */
  private handleCommand(message: any): void {
    if (typeof message === "object" && message.cmd) {
      switch (message.cmd) {
        case "INIT":
          this.config = message.config || {};
          break;
        case "FILE":
          if (message.accelerate === true) {
            sharp.concurrency(0);
          }
          this.convert(message.file);
          break;
        case "KILL":
          if (this.activeJobs > 0) {
            this.queueExit = true;
          } else {
            this.exit();
          }
      }
    }
  }

  /**
   * Hard exit the thread
   */
  private exit(): void {
    debug("Thread exit");
    process.disconnect();
    process.exit(0);
  }

  /**
   * The main function of the thread, process a single image file
   *
   * @param {string} file The path of the file to process
   */
  private async convert(file: IFile): Promise<void> {
    this.activeJobs++;
    debug("Starting new job");

    try {
      // Check the existence
      await this.checkImageExists(file.path);

      // Get the image metadata, or fail if it's not a valid image
      const metadata = await sharp(file.path).metadata();

      const exportedImage = await this.processImage(file, metadata);
      process.send({ status: "COMPLETE", data: exportedImage });
    } catch (err) {
      const error = err instanceof Error ? err.message : err;
      const response: IThreadResponse = {
        status: "FAILED",
        data: { path: file.path, reason: error }
      };
      process.send(response);
    }

    debug("Finished job");
    this.activeJobs--;
    if (this.queueExit && this.activeJobs === 0) {
      this.exit();
    }
  }

  /**
   * Check if the image exists, and return the full absolute path
   */
  private async checkImageExists(filePath: string): Promise<void> {
    let stat: fs.Stats;
    try {
      stat = await fs.stat(filePath);
    } catch (err) {
      if (err.code === "ENOENT") {
        throw new Error("Image not found");
      }
      throw err;
    }

    if (!stat.isFile()) {
      throw new Error("The given path is not a file");
    }
  }

  /**
   * Processes the received file. This will generate an image pipeline and feed image data into it.
   */
  private async processImage(file: IFile, metadata: sharp.Metadata): Promise<IExport> {
    const imagePipeline = await this.generateImagePipeline(file, metadata);

    try {
      // Create streams hooks to resolve when all streams have gracefully closed
      const termination = Promise.all(
        imagePipeline.writeStreams.map(
          writer =>
            new Promise((resolve, reject) => {
              writer.on("finish", () => resolve()).on("error", reject);
            })
        )
      );

      // Start feeding data into the pipeline, it will flow into each branch
      fs.createReadStream(file.path).pipe(imagePipeline.pipeline);

      await termination;

      return imagePipeline.export;
    } catch (err) {
      // Cleanup
      for (const writer of imagePipeline.writeStreams) {
        writer.on("finish", () => fs.unlink(writer.path));
        writer.end();
      }
      throw err;
    }
  }

  /**
   * A factory function for a NodeJS image optimizing duplex stream
   *
   * As the optimizer function requires a buffer, the stream will be entirely buffered.
   * Once the stream has ended, the image will be optimized and written to the stream,
   * before being closed as well.
   * @returns {Duplex} A duplex (read/write) stream
   */
  private optimizer(codec: string): Duplex {
    const buffer = [];
    const shouldOptimize = this.getOption("optimize", codec);
    const optimizerSettings = (this.config[codec] || {}).optimizerSettings || {};

    let optimizerFunction;
    switch (codec) {
      case "png":
        optimizerFunction = pngOptimizer(optimizerSettings);
        break;
      case "jpeg":
        optimizerFunction = jpegOptimizer(optimizerSettings);
        break;
      case "gif":
        optimizerFunction = gifOptimizer(optimizerSettings);
        break;
      case "svg":
        optimizerFunction = svgOptimizer(optimizerSettings);
        break;
      default:
        optimizerFunction = data => data;
    }

    return new Duplex({
      write(chunk, encoding, callback) {
        if (shouldOptimize) {
          buffer.push(chunk); // Add to buffer
        } else {
          this.push(chunk); // Pass through
        }
        callback();
      },
      final(callback) {
        if (shouldOptimize) {
          let data: string | Buffer;
          data = Buffer.isBuffer(buffer[0]) ? Buffer.concat(buffer) : buffer.join("");
          optimizerFunction(data).then((optimizedImage: string | Buffer) => {
            this.push(optimizedImage);
            this.push(null);
            callback();
          });
        } else {
          this.push(null);
          callback();
        }
      },
      read(size) {
        /* */
      }
    });
  }

  /**
   * Takes a stream of raw image data and passes it through an optimizer before saving to disk.
   * If saveWebp is set to true, a copy will be converted to WebP and saved alongside
   */
  private saveImage(
    stream: sharp.Sharp | PassThrough,
    exportPath: string,
    extension: string,
    metadata: sharp.Metadata,
    saveWebp: boolean
  ): fs.WriteStream[] {
    const writeStreams: fs.WriteStream[] = [];
    const writePermission = this.config.force ? "w" : "wx"; // Will cause error if file already exists without force

    try {
      const fallbackWriteStream = fs.createWriteStream(exportPath + extension, {
        flags: writePermission
      });
      stream.pipe(this.optimizer(metadata.format)).pipe(fallbackWriteStream);
      writeStreams.push(fallbackWriteStream);

      if (saveWebp) {
        const webpWriteStream = fs.createWriteStream(exportPath + ".webp", {
          flags: writePermission
        });
        // @ts-ignore
        if (typeof stream.clone === "function") {
          stream
            // @ts-ignore
            .clone()
            .webp({ quality: this.config.webpQuality, alphaQuality: this.config.webpAlphaQuality })
            .pipe(webpWriteStream);
        } else {
          stream
            .pipe(sharp())
            .webp({ quality: this.config.webpQuality, alphaQuality: this.config.webpAlphaQuality })
            .pipe(webpWriteStream);
        }
        writeStreams.push(webpWriteStream);
      }
    } catch (err) {
      for (const writer of writeStreams) {
        writer.on("finish", () => fs.unlink(writer.path));
        writer.end();
      }
      if (err.code === "EEXIST") {
        throw new Error("EEXIST - Image already exists");
      }
      throw err;
    }

    return writeStreams;
  }

  /**
   * Constrain a set of dimensions to a target set of dimensions, while
   * preserving aspect ratio
   */
  private constrainSize(source: IDimensions, constrainTo: IDimensions) {
    const newDimensions: IDimensions = { width: source.width, height: source.height };
    if (newDimensions.height > constrainTo.height) {
      newDimensions.height = constrainTo.height;
      newDimensions.width *= newDimensions.height / source.height;
    }
    if (newDimensions.width > constrainTo.width) {
      newDimensions.width = constrainTo.width;
      newDimensions.height = (source.height * newDimensions.width) / source.width;
    }
    newDimensions.width = Math.round(newDimensions.width);
    newDimensions.height = Math.round(newDimensions.height);
    return newDimensions;
  }
}

const worker = new ProcessThread();
worker.listenForCommands();
