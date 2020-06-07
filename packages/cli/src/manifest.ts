import { Metadata, slash } from "@ipp/common";
import { promises } from "fs";
import { join, relative } from "path";

import { JobResult } from "./common";
import { Config } from "./config";

const MANIFEST_FILE = "manifest.json";

type StringMap = { [key: string]: string };

interface ManifestFormat {
  p: string;
  m?: StringMap;
}

interface ManifestItem {
  p: string;
  m?: StringMap;
  f: ManifestFormat[];
}

type Manifest = ManifestItem[];

export async function saveManifest(config: Config, jobs: JobResult[]): Promise<void> {
  const manifest: Manifest = [];

  for (const job of jobs) {
    if (!job.formats || job.formats.length === 0) continue;

    const formats: ManifestFormat[] = [];

    for (const format of job.formats)
      formats.push({
        p: slash(relative(config.output + "/", format.file)),
        m: !config.manifest?.format ? void 0 : processMetadata(config.manifest.format, format.metadata),
      });

    manifest.push({
      f: formats,
      p: slash(relative(config.input + "/", job.source)),
      m: !config.manifest?.source ? void 0 : processMetadata(config.manifest.source, job.formats[0].metadata),
    });
  }

  await promises.writeFile(join(config.output, MANIFEST_FILE), JSON.stringify(manifest));
}

function processMetadata(mappings: StringMap, metadata: Metadata): StringMap {
  const map: StringMap = {};

  for (const [key, value] of Object.entries(mappings)) {
    const [selector, limit] = separateValue(value);
    if (typeof metadata[selector] !== "undefined")
      map[key] = limit ? String(metadata[selector]).substr(0, limit) : metadata[selector];
  }

  return map;
}

function separateValue(value: string): [string, number?] {
  const index = value.indexOf(":");
  if (index === -1) return [value];

  const limit = parseInt(value.substr(index + 1), 10);
  if (!limit) return [value];

  return [value.substr(0, index), limit];
}
