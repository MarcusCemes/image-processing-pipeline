/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { randomBytes } from "crypto";
import { createManifestItem } from "./metadata";
import { PipelineResult } from "./pipeline";
import { sampleMetadata } from "./utils";

describe("function createManifestItem()", () => {
  /** Creates a sample pipeline result with two formats */
  function samplePipelineResult(): PipelineResult {
    const buffer = randomBytes(8);
    const sourceMeta = sampleMetadata(256, "webp", "jpeg");
    const formatMeta = sampleMetadata(256, "webp", "jpeg");
    const source = { buffer, metadata: sourceMeta };
    const format = { data: { buffer, metadata: formatMeta }, saveKey: true };

    // Mocked source metadata propagation
    sourceMeta.source.extra = "src";
    sourceMeta.current.extra = "src";
    formatMeta.source.extra = "src";
    formatMeta.current.extra = "cur";

    return {
      source,
      formats: [format, format],
    };
  }

  test("creates a manifest item", () => {
    const item = createManifestItem(samplePipelineResult(), {
      source: {
        w: "width",
        h: "hash",
      },
    });

    if (!item.s) throw null;
    expect(item.s.w).toBe(256);
    expect(typeof item.s.h).toBe("string");
  });

  test("ignores undefined metadata", () => {
    const item = createManifestItem(samplePipelineResult(), {
      source: {
        h: "hash",
        n: "non_existent_value",
      },
    });

    if (!item.s) throw null;
    expect(item.s.n).toBeUndefined();
    expect(typeof item.s.h).toBe("string");
  });

  test("limits metadata values", () => {
    const item = createManifestItem(samplePipelineResult(), {
      source: {
        h1: "hash",
        h2: "hash:8",
      },
    });

    if (!item.s) throw null;
    expect(typeof item.s.h1).toBe("string");
    expect(item.s.h2).toHaveLength(8);
  });

  test("ignores a non-numerical limit", () => {
    const item = createManifestItem(samplePipelineResult(), {
      source: {
        h1: "hash",
        h2: "hash:NaN",
      },
    });

    if (!item.s) throw null;
    expect(item.s.h2).toBeUndefined();
  });

  test("maps each format", () => {
    const item = createManifestItem(samplePipelineResult(), {
      format: {
        w: "width",
        h: "height",
      },
    });

    if (!item.f) throw null;
    expect(item.f).toHaveLength(2);

    item.f.forEach((v) => {
      expect(v).toHaveProperty("w", 256);
      expect(v).toHaveProperty("h", 256);
    });
  });

  /** Test that selectors are identified and a default selector is used */
  test("handles selectors", () => {
    const item = createManifestItem(samplePipelineResult(), {
      source: {
        e1: "extra",
        e2: "current.extra",
        s: "source.extra",
      },
      format: {
        e1: "extra",
        e2: "current.extra",
        s: "source.extra",
      },
    });

    if (!item.s) throw null;
    if (!item.f) throw null;
    expect(item.f).toHaveLength(2);

    ["e1", "e2", "s"].forEach((prop) => expect(item.s).toHaveProperty(prop, "src"));

    item.f.forEach((format) => {
      expect(format).toHaveProperty("s", "src");
      ["e1", "e2"].forEach((prop) => expect(format).toHaveProperty(prop, "cur"));
    });
  });

  test("removes unused manifest objects", () => {
    const item = createManifestItem(samplePipelineResult(), {
      source: {},
      format: {},
    });

    expect(item.s).toBeUndefined();
    expect(item.f).toBeUndefined();
  });
});
