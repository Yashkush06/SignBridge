import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { motionVariants, type AnimatableProperty, type MotionVariant } from "./motion";

/**
 * The complete set of animated property keys permitted by Req 4.7: opacity,
 * the color family, and the transform family. Any key outside this set — in
 * particular layout-affecting keys like width/height/margin/padding/top/left —
 * is forbidden in a variant's `initial` or `animate` state.
 */
const PERMITTED_KEYS: readonly AnimatableProperty[] = [
  "opacity",
  "color",
  "backgroundColor",
  "borderColor",
  "x",
  "y",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
] as const;

/** Representative layout-affecting keys that must never be animated (Req 4.7). */
const FORBIDDEN_LAYOUT_KEYS = [
  "width",
  "height",
  "margin",
  "marginTop",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingLeft",
  "top",
  "left",
  "right",
  "bottom",
  "gap",
  "inset",
  "flexBasis",
] as const;

const PERMITTED_SET = new Set<string>(PERMITTED_KEYS);

/** Membership predicate: true iff `key` is an allowed AnimatableProperty. */
const isPermittedKey = (key: string): boolean => PERMITTED_SET.has(key);

/** Every animated key across a variant's initial and animate states. */
const animatedKeys = (variant: MotionVariant): string[] => [
  ...Object.keys(variant.initial),
  ...Object.keys(variant.animate),
];

describe("motion catalog animated-property safety", () => {
  // Feature: ui-premium-polish, Property 3: Animations only ever touch opacity, transform, and color properties
  it("Property 3: every animated key in every catalog variant is permitted and never layout-affecting", () => {
    // Core guarantee over the REAL catalog: assert directly so authorship
    // regressions surface immediately, independent of generation.
    for (const [name, variant] of Object.entries(motionVariants)) {
      for (const key of animatedKeys(variant)) {
        expect(
          isPermittedKey(key),
          `variant "${name}" animates non-permitted key "${key}"`
        ).toBe(true);
        expect(
          FORBIDDEN_LAYOUT_KEYS.includes(key as (typeof FORBIDDEN_LAYOUT_KEYS)[number]),
          `variant "${name}" animates layout-affecting key "${key}"`
        ).toBe(false);
      }
    }

    const catalogVariants = Object.values(motionVariants);

    fc.assert(
      fc.property(
        // (a) Pick a real catalog variant and re-assert the membership invariant
        //     so the catalog is exercised across generated runs.
        fc.constantFrom(...catalogVariants),
        // (b) Build an arbitrary variant from ONLY permitted keys; the invariant
        //     must hold for any such construction.
        fc.record({
          initial: fc.dictionary(
            fc.constantFrom(...PERMITTED_KEYS),
            fc.oneof(fc.double({ noNaN: true }), fc.string())
          ),
          animate: fc.dictionary(
            fc.constantFrom(...PERMITTED_KEYS),
            fc.oneof(fc.double({ noNaN: true }), fc.string())
          ),
        }),
        // (c) An arbitrary key mixing permitted and forbidden names, used to
        //     verify the membership predicate distinguishes them correctly.
        fc.oneof(
          fc.constantFrom(...PERMITTED_KEYS),
          fc.constantFrom(...FORBIDDEN_LAYOUT_KEYS),
          fc.string()
        ),
        (catalogVariant, generatedVariant, sampledKey) => {
          // (a) Catalog variant keys are all permitted, none layout-affecting.
          for (const key of animatedKeys(catalogVariant)) {
            expect(isPermittedKey(key)).toBe(true);
            expect(
              FORBIDDEN_LAYOUT_KEYS.includes(
                key as (typeof FORBIDDEN_LAYOUT_KEYS)[number]
              )
            ).toBe(false);
          }

          // (b) A variant constructed only from permitted keys satisfies the
          //     membership invariant for every key.
          for (const key of [
            ...Object.keys(generatedVariant.initial),
            ...Object.keys(generatedVariant.animate),
          ]) {
            expect(isPermittedKey(key)).toBe(true);
          }

          // (c) The predicate agrees exactly with the permitted set: a sampled
          //     key is permitted iff it is in PERMITTED_SET, and any forbidden
          //     layout key is rejected.
          expect(isPermittedKey(sampledKey)).toBe(PERMITTED_SET.has(sampledKey));
          if (
            FORBIDDEN_LAYOUT_KEYS.includes(
              sampledKey as (typeof FORBIDDEN_LAYOUT_KEYS)[number]
            )
          ) {
            expect(isPermittedKey(sampledKey)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
