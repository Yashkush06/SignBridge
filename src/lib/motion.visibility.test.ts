// Feature: ui-premium-polish, Property 4: Content remains fully visible for every motion preference
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  resolveMotionVariant,
  motionVariants,
  type AnimatableProperty,
  type MotionVariant,
} from "./motion";

/**
 * Property 4: Content remains fully visible for every motion preference.
 *
 * "For any motion variant and either value of the reduced-motion preference,
 * the resolved final (animate) state leaves content fully visible — its
 * resolved opacity is 1 and it never resolves to a hidden state — so content
 * visible under default motion stays visible and readable under reduced motion."
 *
 * Target under test: `resolveMotionVariant` and the `motionVariants` catalog.
 *
 * Validates: Requirements 5.4
 */

// Permitted non-opacity AnimatableProperty keys. Transform-family keys carry
// numeric values; color-family keys carry string values.
const TRANSFORM_KEYS: AnimatableProperty[] = [
  "x",
  "y",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
];
const COLOR_KEYS: AnimatableProperty[] = [
  "color",
  "backgroundColor",
  "borderColor",
];

// A finite, fully-visible opacity value (1) — the "fully visible" target.
const VISIBLE_OPACITY = 1;

/** Arbitrary numeric value for transform-family keys. */
const transformValue = fc.oneof(
  fc.integer({ min: -200, max: 200 }),
  fc.double({ min: -2, max: 2, noNaN: true })
);

/** Arbitrary color string value for color-family keys. */
const colorValue = fc.constantFrom(
  "#1F6FEB",
  "rgb(0, 0, 0)",
  "var(--color-brand-500)",
  "transparent",
  "currentColor"
);

/** Build a partial state record from arbitrary transform/color keys. */
function stateRecordArb() {
  return fc
    .record({
      transforms: fc.dictionary(fc.constantFrom(...TRANSFORM_KEYS), transformValue),
      colors: fc.dictionary(fc.constantFrom(...COLOR_KEYS), colorValue),
    })
    .map(({ transforms, colors }) => ({
      ...transforms,
      ...colors,
    }));
}

/**
 * Smart generator producing arbitrary MotionVariant values whose
 * `animate.opacity` is 1 (fully visible), plus arbitrary permitted keys, an
 * arbitrary `initial` opacity, an arbitrary transition duration, and an
 * arbitrary `isProgressIndicator` flag.
 */
const motionVariantArb: fc.Arbitrary<MotionVariant> = fc
  .record({
    initialExtra: stateRecordArb(),
    animateExtra: stateRecordArb(),
    initialOpacity: fc.double({ min: 0, max: 1, noNaN: true }),
    duration: fc.double({ min: 0, max: 1, noNaN: true }),
    isProgressIndicator: fc.boolean(),
  })
  .map(({ initialExtra, animateExtra, initialOpacity, duration, isProgressIndicator }) => ({
    initial: { opacity: initialOpacity, ...initialExtra },
    // animate.opacity is always the fully-visible value (1).
    animate: { opacity: VISIBLE_OPACITY, ...animateExtra },
    transition: { duration },
    isProgressIndicator,
  }));

describe("Property 4: Content remains fully visible for every motion preference", () => {
  it("keeps every catalog variant's resolved animate.opacity at 1 for both preferences", () => {
    const variants = Object.entries(motionVariants);
    expect(variants.length).toBeGreaterThan(0);

    for (const [name, variant] of variants) {
      for (const prefersReducedMotion of [true, false]) {
        const resolved = resolveMotionVariant(variant, prefersReducedMotion);

        // Resolved final (animate) state leaves content fully visible.
        expect(
          resolved.animate.opacity,
          `${name} (prefersReducedMotion=${prefersReducedMotion}) animate.opacity`
        ).toBe(1);

        // It never resolves to a hidden state.
        expect(resolved.animate.opacity).not.toBe(0);
      }
    }
  });

  it("preserves final visibility (opacity 1, never hidden) for any variant under either preference", () => {
    fc.assert(
      fc.property(motionVariantArb, fc.boolean(), (variant, prefersReducedMotion) => {
        const resolved = resolveMotionVariant(variant, prefersReducedMotion);

        // Resolution preserves the fully-visible final opacity.
        expect(resolved.animate.opacity).toBe(VISIBLE_OPACITY);

        // Resolution never produces an animate state with opacity 0 (hidden).
        expect(resolved.animate.opacity).not.toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});
