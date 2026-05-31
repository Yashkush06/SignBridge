import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  resolveMotionVariant,
  motionVariants,
  type AnimatableProperty,
  type MotionVariant,
} from "./motion";

/**
 * Runtime list of the permitted AnimatableProperty keys. Kept in sync with the
 * `AnimatableProperty` type so generators can build records over a subset of
 * these keys.
 */
const ANIMATABLE_PROPERTIES: readonly AnimatableProperty[] = [
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
];

/** Record over a subset of AnimatableProperty keys with number|string values. */
const propertyRecordArb = fc.dictionary(
  fc.constantFrom(...ANIMATABLE_PROPERTIES),
  fc.oneof(fc.integer(), fc.string())
) as fc.Arbitrary<Partial<Record<AnimatableProperty, number | string>>>;

/** Transition with a strictly positive duration (and an optional ease). */
const transitionArb = fc.record(
  {
    duration: fc.double({ min: 0.001, max: 10, noNaN: true }),
    ease: fc.constantFrom<MotionVariant["transition"]["ease"]>(
      [0.16, 1, 0.3, 1],
      "easeOut",
      "linear"
    ),
  },
  { requiredKeys: ["duration"] }
);

const variantArb: fc.Arbitrary<MotionVariant> = fc.record({
  initial: propertyRecordArb,
  animate: propertyRecordArb,
  transition: transitionArb,
  isProgressIndicator: fc.boolean(),
});

/**
 * Asserts the full reduced-motion contract for a single (variant, preference)
 * pair, including that the input is never mutated.
 */
function assertResolution(variant: MotionVariant, prefersReducedMotion: boolean): void {
  const before = structuredClone(variant);
  const resolved = resolveMotionVariant(variant, prefersReducedMotion);

  // Assertion 4: resolveMotionVariant must not mutate its input.
  expect(variant).toEqual(before);

  if (!prefersReducedMotion) {
    // Assertion 3: motion enabled -> resolved deep-equals the original.
    expect(resolved).toEqual(variant);
    return;
  }

  if (variant.isProgressIndicator === true) {
    // Assertion 2: progress indicators are preserved unchanged.
    expect(resolved).toEqual(variant);
    return;
  }

  // Assertion 1: reduced motion + non-progress -> instant final visible state.
  // initial deep-equals animate, both deep-equal the ORIGINAL animate state,
  // and the transition duration collapses to 0.
  expect(resolved.initial).toEqual(resolved.animate);
  expect(resolved.initial).toEqual(variant.animate);
  expect(resolved.animate).toEqual(variant.animate);
  expect(resolved.transition.duration).toBe(0);
}

describe("resolveMotionVariant reduced-motion resolution", () => {
  // Feature: ui-premium-polish, Property 2: Reduced motion resolves to the final visible state instantly, except progress indicators
  it("Property 2: reduced motion yields the final visible state instantly, except progress indicators", () => {
    fc.assert(
      fc.property(variantArb, fc.boolean(), (variant, prefersReducedMotion) => {
        assertResolution(variant, prefersReducedMotion);
      }),
      { numRuns: 100 }
    );
  });

  it("Property 2: holds across the real motionVariants catalog for both preferences", () => {
    for (const variant of Object.values(motionVariants) as MotionVariant[]) {
      assertResolution(variant, true);
      assertResolution(variant, false);
    }
  });
});
