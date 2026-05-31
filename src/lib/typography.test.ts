import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  HEADING_LEVELS,
  HEADING_SIZES_REM,
  HEADING_SCALE,
  headingSizeRem,
} from "./typography";

describe("heading type scale", () => {
  // Feature: ui-premium-polish, Property 8: Heading sizes strictly decrease by level
  it("Property 8: a higher-hierarchy level resolves to a strictly larger size, with one size per level", () => {
    const maxIndex = HEADING_LEVELS.length - 1;

    fc.assert(
      fc.property(
        // Two indices into HEADING_LEVELS; i is higher in the hierarchy (earlier
        // in the array = larger). Generate i, then j strictly greater than i.
        fc.integer({ min: 0, max: maxIndex - 1 }).chain((i) =>
          fc.record({
            i: fc.constant(i),
            j: fc.integer({ min: i + 1, max: maxIndex }),
          })
        ),
        ({ i, j }) => {
          const higher = HEADING_LEVELS[i];
          const lower = HEADING_LEVELS[j];

          // Strict monotonicity: earlier level is strictly larger than a later one.
          expect(headingSizeRem(higher)).toBeGreaterThan(headingSizeRem(lower));
        }
      ),
      { numRuns: 100 }
    );
  });

  it("each level maps to exactly one size and one type-size class (single type-size per level)", () => {
    for (const level of HEADING_LEVELS) {
      // headingSizeRem is the single resolved numeric size for the level.
      const size = headingSizeRem(level);
      expect(typeof size).toBe("number");
      expect(size).toBe(HEADING_SIZES_REM[level]);

      // HEADING_SCALE assigns exactly one (non-empty) class per level.
      const klass = HEADING_SCALE[level];
      expect(typeof klass).toBe("string");
      expect(klass.trim().split(/\s+/)).toHaveLength(1);
    }

    // The scale and size maps cover the same set of levels (one entry per level).
    expect(Object.keys(HEADING_SCALE).sort()).toEqual([...HEADING_LEVELS].sort());
    expect(Object.keys(HEADING_SIZES_REM).sort()).toEqual([...HEADING_LEVELS].sort());
  });
});
