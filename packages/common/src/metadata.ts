/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PipelineResult, PrimitiveValue } from "./pipeline";

const DEFAULT_SELECTOR = "current";

const EXPRESSION_BRACES = "[]";
const EXPRESSION_MATCHER = /\[([a-zA-Z0-9:._-]+)\]/g;

/* -- Types -- */

/**
 * A map of primitive values associated with keys that can
 * be grouped into a metadata object.
 */
export type MetadataFragment = Record<string, PrimitiveValue>;

/** Base metadata values that are are always present */
export interface BaseMetadata {
  format: string;
  width: number;
  height: number;
  channels: number;
  hash: string;
}

/**
 * An extensible object that is associated with each image buffer.
 * Certain properties are guaranteed to exist, as they are easily
 * calculable from the source and are required to understand a
 * RAW image buffer with no embedded image metadata.
 */
export interface Metadata<I extends MetadataFragment = Record<string, PrimitiveValue>> {
  current: BaseMetadata & MetadataFragment & I;
  source: BaseMetadata & MetadataFragment & I;

  [index: string]: MetadataFragment;
}

/** A single manifest entry, created from a single source image that
 * has gone through the pipeline process. It is generated using the
 * resulting metadata from that pipeline result and user-provided
 * metadata mappings.
 */
export interface ManifestItem {
  s?: MetadataFragment;
  f?: MetadataFragment[];
}

/** A collection of manifest entries for many source images */
export type Manifest = ManifestItem[];

/**
 * User defined mappings that are used to map a Metadata
 * into a ManifestItem object.
 */
export interface ManifestMappings {
  source?: Record<string, string>;
  format?: Record<string, string>;
}

/* -- Functions -- */

/**
 * Takes a pipeline result and a set of manifest mappings (provided by user) and generates
 * a ManifestItem entry. This allows the user to *map* combined metadata from the source
 * and for each format using user-defined property names and an optional length limiter.
 *
 * Essentially *compacts* metadata from a PipelineResult based on user-defined keys.
 *
 * @example
 * createManifestItem(result, config.manifest);
 * // { s: { ... }, f: [{ ... }, { ... }, ...]}
 */
export function createManifestItem(
  result: PipelineResult,
  mappings: ManifestMappings
): ManifestItem {
  const manifestItem: ManifestItem = {};

  if (mappings.format) {
    const formatMappings = mappings.format;
    const f = result.formats
      .map((format) => mapMetadata(format.data.metadata, formatMappings))
      .filter(voidIfEmpty);

    if (f.length !== 0) manifestItem.f = f;
  }

  if (mappings.source) {
    const s = voidIfEmpty(mapMetadata(result.source.metadata, mappings.source));
    if (s) manifestItem.s = s;
  }

  return manifestItem;
}

/** Replaces all template interpolations with it's corresponding metadata value. */
export function interpolateTemplates(metadata: Metadata, templateString: string): string {
  const [l, r] = EXPRESSION_BRACES;
  const expressions: Record<string, string> = {};

  let newString = templateString;

  // Extract all template expressions into a object
  let match: RegExpExecArray | null;
  while ((match = EXPRESSION_MATCHER.exec(templateString)) !== null) {
    expressions[match[1]] = match[1];
  }

  const mappedExpressions = mapMetadata(metadata, expressions);

  // Replace each expression with its mapped value
  for (const [key, value] of Object.entries(mappedExpressions)) {
    newString = newString.replace(new RegExp(`\\${l}${key}\\${r}`, "g"), String(value));
  }

  return newString;
}

/**
 * Takes a metadata object and user-providing mapping, and attempts to map
 * the metadata object to a new object based on the provided mappings,
 * using the key of the mapping object as the new key in the returned object,
 * and the value of the mappings as a template string to containing the property
 * to extract from the metadata object.
 *
 * @example
 * const metadata = { width: 1920, height: 1080 };
 * const mappings = { w: "width", h: "height" };
 * const result = mapMetadata(metadata, mappings);
 * expect(result).toMatchObject({ w: 1920, h: 1080 });
 */
export function mapMetadata(
  metadata: Metadata,
  mappings: Record<string, string>
): MetadataFragment {
  const mappedMetadata: MetadataFragment = {};

  for (const [key, template] of Object.entries(mappings)) {
    const mappedTemplate = mapTemplate(metadata, template);

    if (typeof mappedTemplate !== "undefined") {
      mappedMetadata[key] = mappedTemplate;
    }
  }

  return mappedMetadata;
}

/**
 * Takes a metadata object and a single template string, attempting to match
 * the template string to valid entry in the metadata source, with an optional
 * limit constraint (converts to a string);
 *
 * @example
 * expect(mapTemplate({ width: 1920 }, "width")).toBe(1920);
 * expect(mapTemplate({ width: 1920 }, "width:2")).toBe("19");
 */
export function mapTemplate(metadata: Metadata, template: string): PrimitiveValue | undefined {
  const { selector, key, limit } = parseTemplate(template);
  if (!key) return;

  const value = metadata[selector || DEFAULT_SELECTOR][key];
  if (typeof value === "undefined") return;

  return limit ? String(value).substr(0, limit) : value;
}

type ParsedTemplate = {
  selector?: string;
  key?: string;
  limit?: number;
};

/**
 * Matches three parts of a template, selector, key and limit, using the format
 * `selector.key:limit`
 */
const TEMPLATE_MATCHER = /^(?:([a-zA-Z0-9]+)\.)?([a-zA-Z0-9_-]+)(?::([0-9]+))?$/;

/**
 * Splits a template string into the a value and an optional numerical limit.
 * Returns an empty object if the template is invalid to allow for destructing.
 *
 * @example
 * expect(parseTemplate("hash:8")).toBe({ key: "hash", limit: 8 });
 */
function parseTemplate(value: string): ParsedTemplate {
  const result = TEMPLATE_MATCHER.exec(value);
  if (result === null) return {};

  const [, selector, key, limit] = (result as unknown) as [string, string, string, string?];

  const parsed: ParsedTemplate = {
    key,
  };

  if (selector) {
    parsed.selector = selector;
  }

  if (limit) {
    parsed.limit = parseInt(limit); // guaranteed numerical value from regex expression
  }

  return parsed;
}

/** Returns the object or undefined if the object has no properties */
function voidIfEmpty<T extends Record<string, unknown>>(obj: T): T | undefined {
  if (Object.keys(obj).length === 0) return;
  return obj;
}
