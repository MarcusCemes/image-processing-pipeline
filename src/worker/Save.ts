// Responsive Image Builder - Worker/Save
// Saves image streams to disk
import isEqual from "fast-deep-equal";
import {
  access,
  constants as fsConstants,
  createWriteStream,
  ensureDir,
  rename,
  unlink
} from "fs-extra";
import { posix } from "path";
import { file as tmpFile } from "tmp";

import { IConfig } from "../Config";
import { INCREMENT_LIMIT, SHORT_HASH_LENGTH } from "../Constants";
import { IExportSize } from "../Interfaces";
import { IFile } from "../Preparation";
import { cleanUpPath } from "../Utility";
import { WORKER_ERRORS, WorkerError } from "./Interfaces";
import { IImageStreams } from "./Pipeline";

export interface ITemporaryFile {
  tmpFile: string;
  format: string;
  size?: IExportSize;
  closed: Promise<null | WorkerError>;
  template: string; // The file-naming template
}

/**
 * Redirects all image streams to a temporary file in the correct location.
 *
 * Returns ITemporaryFile objects, that contain a close promise and the necessary
 * information to rename the files to the correct name.
 */
export async function temporarySave(
  imageStreams: IImageStreams,
  outDir: string,
  job: IFile,
  flat: boolean = false
): Promise<ITemporaryFile[]> {
  const exportDir = flat
    ? outDir
    : posix.join(outDir, posix.parse(posix.relative(job.base, job.path)).dir);
  if (!flat) {
    await ensureDir(exportDir);
  }

  const tempFiles: Array<Promise<ITemporaryFile>> = [];

  try {
    for (const imageStream of imageStreams) {
      tempFiles.push(
        new Promise<ITemporaryFile>((resolve, reject) => {
          // Attempt to create the temporary file, set up all event listeners and pipe
          tmpFile(
            { dir: exportDir, prefix: ".rib-", keep: true, discardDescriptor: true },
            (err, tmpPath) => {
              if (err) {
                reject(new WorkerError(WORKER_ERRORS.tmpFileError, err));
                return;
              }

              const closed = new Promise<null | WorkerError>(resolveClosure => {
                imageStream.stream
                  .pipe(createWriteStream(tmpPath))
                  .once("finish", () => {
                    resolveClosure(null);
                  })
                  .once("error", saveError => {
                    resolveClosure(new WorkerError(WORKER_ERRORS.saveError, saveError));
                  });
              });

              resolve({
                tmpFile: cleanUpPath(tmpPath),
                format: imageStream.format,
                size: imageStream.size,
                closed,
                template: imageStream.template
              });
            }
          );
        })
      );
    }

    let resolvedTempFiles: ITemporaryFile[];
    resolvedTempFiles = await Promise.all(tempFiles);

    return resolvedTempFiles;
  } catch (err) {
    // Delete all temp files once they resolve
    tempFiles.forEach(promise =>
      promise
        .then(tempFile => cleanupTmpFiles([tempFile]))
        .catch(() => {
          /* */
        })
    );
    throw new WorkerError(WORKER_ERRORS.tmpFileError, err);
  }
}

interface ICommittedSave {
  sizes?: IExportSize[];
  single?: string;
}

/**
 * Commits the temporary files to the disk with proper names, parsing placeholders
 * with the correct variables.
 *
 * @returns {Promise<Array<IExportSize>|string>} A promise that resolves into an array
 * with export sizes if it's a multiple export or a string with the final image name
 * in the case of a single export
 */
export async function commitSave(
  temporaryFiles: ITemporaryFile[],
  imageName: string,
  fingerprint: string = "",
  config: IConfig
): Promise<ICommittedSave> {
  const promises: Array<Promise<IExportSize | string>> = [];

  const shortFingerprint =
    typeof fingerprint === "string" && fingerprint.length >= SHORT_HASH_LENGTH
      ? fingerprint.substring(0, SHORT_HASH_LENGTH)
      : "";

  for (const tmpFile of temporaryFiles) {
    const size = tmpFile.size || null;
    let newName = tmpFile.template;

    // These are hard coded as half of them depend on the export, and it has better performance
    // than using universal functions to generate each value on the fly
    newName = newName
      .replace(/\[name\]/g, imageName)
      .replace(/\[format\]/g, tmpFile.format)
      .replace(/\[hash\]/g, fingerprint)
      .replace(/\[shortHash\]/g, shortFingerprint);

    if (size) {
      newName = newName
        .replace(/\[preset\]/g, size.preset)
        .replace(/\[width\]/g, size.width.toString())
        .replace(/\[height\]/g, size.height.toString());
    }

    // Move the temporary files to its resting place
    promises.push(moveTmpFile(tmpFile, newName, config.force, config.incrementConflicts));
  }

  const committedSave: ICommittedSave = { sizes: [] };
  const resolvedPromises = await Promise.all(promises);
  for (const promise of resolvedPromises) {
    if (typeof promise === "string") {
      committedSave.single = promise;
    } else {
      committedSave.sizes.push(promise as IExportSize);
    }
  }

  if (committedSave.sizes.length === 0) {
    return { single: committedSave.single };
  }
  return { sizes: removeDuplicateObjects(committedSave.sizes) };
}

async function moveTmpFile(
  tmpFile: ITemporaryFile,
  newName: string,
  force: boolean,
  increment: boolean
): Promise<IExportSize | string> {
  let authDest: string;
  const tmpParsed = posix.parse(tmpFile.tmpFile);

  if (!force && (await fileExists(posix.join(tmpParsed.dir, newName)))) {
    if (increment) {
      authDest = await getIncrementedName(posix.join(tmpParsed.dir, newName));
    } else {
      throw new WorkerError(WORKER_ERRORS.imageExistsError + " (" + newName + ")");
    }
  } else {
    authDest = posix.join(tmpParsed.dir, newName);
  }

  return new Promise((resolve, reject) => {
    rename(tmpFile.tmpFile, authDest)
      .then(() => {
        const toResolve: IExportSize | string = tmpFile.size
          ? {
              name: posix.parse(authDest).name,
              preset: tmpFile.size.preset,
              width: tmpFile.size.width,
              height: tmpFile.size.height
            }
          : posix.parse(authDest).name;
        if (tmpFile.size && typeof tmpFile.size.default !== "undefined") {
          (toResolve as IExportSize).default = tmpFile.size.default;
        }
        resolve(toResolve);
      })
      .catch(saveError => {
        if (saveError instanceof WorkerError) {
          reject(saveError);
        } else {
          reject(new WorkerError(WORKER_ERRORS.saveError, saveError));
        }
      });
  });
}

async function getIncrementedName(filename: string) {
  let counter = 1;
  const { dir, name, ext } = posix.parse(filename);

  while (true) {
    if (counter === INCREMENT_LIMIT) {
      throw new WorkerError(WORKER_ERRORS.saveError, new Error("File increment limit reached"));
    }

    const newName = posix.join(dir, name + "_" + counter + ext);
    if (!(await fileExists(newName))) {
      return newName;
    }
    counter++;
  }
}

async function fileExists(file: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    access(file, fsConstants.F_OK, err => {
      if (!err) {
        resolve(true);
      } else if (err && err.code === "ENOENT") {
        resolve(false);
      } else {
        reject(err);
      }
    });
  });
}

/** Delete all given temporary files */
export function cleanupTmpFiles(files: ITemporaryFile | ITemporaryFile[]) {
  if (!files) {
    return;
  }
  if (Array.isArray(files)) {
    for (const file of files) {
      unlink(file.tmpFile).catch(() => {
        /* */
      });
    }
  } else {
    unlink(files.tmpFile).catch(() => {
      /* */
    });
  }
}

function removeDuplicateObjects<T>(arr: T[]): T[] {
  const newObjects = [];
  for (const obj of arr) {
    let duplicate = false;
    for (const existingObj of newObjects) {
      if (isEqual(obj, existingObj)) {
        duplicate = true;
        break;
      }
    }
    if (!duplicate) {
      newObjects.push(obj);
    }
  }
  return newObjects;
}
