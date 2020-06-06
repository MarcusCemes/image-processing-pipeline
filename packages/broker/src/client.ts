import { Metadata, Pipeline } from "@rib/common";
import { processPipeline } from "@rib/core";
import { F_OK } from "constants";
import { promises } from "fs";
import { join, parse } from "path";
import { serializeError } from "serialize-error";

import { BrokerException, ClientAction, ClientResponse } from "./common";
import { hashBuffer } from "./hash";

const { access, mkdir, readFile, writeFile } = promises;

interface ClientJob {
  id: string;
  input: string;
  output: string;
  pipeline: Pipeline[];
}

const EXPANSION_MATCHER = /{{([a-zA-Z0-9]+)(:[0-9]+)?}}/g;

const FORMAT_EXTENSIONS: { [index: string]: string } = {
  jpeg: ".jpg",
  webp: ".webp",
  png: ".png",
  gif: ".gif",
  tiff: ".tiff",
  raw: ".raw",
  svg: ".svg",
};

if (process.connected) {
  let active = true;

  const messageHandler = async (message: ClientAction): Promise<void> => {
    if (typeof message !== "object" || message === null) return;

    switch (message.type) {
      case "KILL":
        active = false;
        process.off("message", messageHandler);
        break;

      case "JOB": {
        if (!active) return;
        const job: ClientJob = {
          id: message.id,
          input: message.input,
          pipeline: message.pipeline,
          output: message.outDir,
        };

        let result: ClientResponse;
        try {
          const image = await readFile(job.input);
          const formatedName = parse(job.input);
          const results = await processPipeline(image, job.pipeline, {
            originalName: formatedName.name,
            originalExt: formatedName.ext,
            originalHash: hashBuffer(image),
          });

          const resultOutputs: Array<{ file: string; metadata: Metadata }> = [];

          mkdir(job.output, { recursive: true });
          await Promise.all(
            results.map(async (result) => {
              const hash = hashBuffer(result.data);
              const finalMetadata = {
                ...result.metadata,
                hash,
                ext: formatToExt(result.metadata.format),
              };
              const path = join(job.output, processFilename(result.save, finalMetadata));

              try {
                await access(path, F_OK);
                throw new BrokerException("Output file already exists: " + path);
              } catch (err) {
                if (err instanceof BrokerException) throw err;
              }

              try {
                await writeFile(path, result.data);
                resultOutputs.push({
                  file: path,
                  metadata: finalMetadata,
                });
              } catch (err) {
                throw new Error("Write failure: " + err.message);
              }
            })
          );

          result = { id: job.id, type: "DONE", outputs: resultOutputs };
        } catch (err) {
          result = { id: message.id, type: "ERROR", err: serializeError(err) };
        }

        if (process.send) process.send(result);

        break;
      }
    }
  };

  process.on("message", messageHandler);
  if (typeof process.send === "function") {
    process.send({ type: "READY" } as ClientResponse);
  }
}

function processFilename(filename: string, metadata: { [index: string]: any }): string {
  const matches: string[][] = [];

  let match: RegExpExecArray | null;
  while ((match = EXPANSION_MATCHER.exec(filename)) !== null) {
    matches.push(match);
  }

  let newFilename = filename;
  for (const match of matches) {
    let replacement: string = metadata[match[1]] || "";
    if (match[2]) replacement = replacement.substr(0, parseInt(match[2].substr(1)));

    newFilename = newFilename.replace(new RegExp(match[0], "g"), replacement);
  }

  return newFilename;
}

function formatToExt(format: string): string {
  if (format in FORMAT_EXTENSIONS) return FORMAT_EXTENSIONS[format];
  return "";
}
