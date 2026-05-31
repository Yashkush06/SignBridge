"use client";

/**
 * Motion Layer (`src/lib/motion.ts`)
 *
 * Centralizes all animation configuration for the UI premium polish work so
 * durations stay within requirement bounds and reduced-motion handling lives in
 * exactly one place. Surfaces and primitives consume the named `motionVariants`
 * catalog through `useReducedMotionVariants`, which resolves any variant to its
 * final visible state instantly when the user prefers reduced motion.
 *
 * Requirements: 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.6
 */

import { useReducedMotion, type Transition } from "framer-motion";

/**
 * Animated property keys permitted by Req 4.7 — opacity, transform, and color
 * families only. Layout-affecting properties (width, height, margin, padding,
 * top, left, …) are intentionally excluded to preserve layout stability and
 * rendering performance.
 */
export type AnimatableProperty =
  | "opacity"
  | "color"
  | "backgroundColor"
  | "borderColor"
  | "x"
  | "y"
  | "scale"
  | "scaleX"
  | "scaleY"
  | "rotate";

export interface MotionVariant {
  /** State before entrance / on exit. Only AnimatableProperty keys allowed. */
  initial: Partial<Record<AnimatableProperty, number | string>>;
  /** Final, fully-visible resting state. `opacity` always resolves to 1. */
  animate: Partial<Record<AnimatableProperty, number | string>>;
  /** Transition timing, in SECONDS (Framer Motion units), sourced from MOTION_DURATIONS. */
  transition: Pick<Transition, 'duration' | 'ease' | 'delay'>;
  /** True when this variant communicates progress / system state (Req 5.2). */
  isProgressIndicator?: boolean;
}

/**
 * Durations in MILLISECONDS, validated against requirement bounds. These mirror
 * the CSS motion tokens in `globals.css`:
 *   --duration-hover    180ms
 *   --duration-activate 160ms
 *   --duration-overlay  200ms
 *   --duration-reveal   320ms
 */
export const MOTION_DURATIONS = {
  hover: 180, // Req 4.1: 150–250ms
  activate: 160, // Req 4.2: 100–250ms
  overlay: 200, // Req 4.4 / 4.5: 150–250ms
  sectionReveal: 320, // Req 4.3: 200–400ms
} as const;

/** Calm ease-out curve mirroring `--ease-standard` cubic-bezier in globals.css. */
export const MOTION_EASING = [0.16, 1, 0.3, 1] as const;

/** Convert a millisecond duration token to the seconds Framer Motion expects. */
const seconds = (ms: number): number => ms / 1000;

/**
 * Reusable named variants consumed by surfaces and primitives. Every variant's
 * `initial`/`animate` use only AnimatableProperty keys (Req 4.7), and every
 * `animate.opacity` resolves to 1 so content is fully visible (Req 5.4).
 */
export const motionVariants = {
  /** Simple opacity fade for general content entrances. */
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: seconds(MOTION_DURATIONS.overlay), ease: [...MOTION_EASING] },
  },

  /** Section reveal: fade + small upward translate, run once on viewport entry. */
  sectionReveal: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: seconds(MOTION_DURATIONS.sectionReveal), ease: [...MOTION_EASING] },
  },

  /** Hover emphasis: subtle scale-up while remaining fully visible. */
  hover: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: 1, scale: 1.02 },
    transition: { duration: seconds(MOTION_DURATIONS.hover), ease: [...MOTION_EASING] },
  },

  /** Activation/press feedback: subtle scale-down while remaining fully visible. */
  activate: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: 1, scale: 0.98 },
    transition: { duration: seconds(MOTION_DURATIONS.activate), ease: [...MOTION_EASING] },
  },

  /** Dialog / dropdown open transition: fade + slight scale to the rest state. */
  overlayEnter: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: seconds(MOTION_DURATIONS.overlay), ease: [...MOTION_EASING] },
  },

  /**
   * Progress / system-state pulse (e.g. recording / processing indicators).
   * Flagged as a progress indicator so it is preserved under reduced motion
   * (Req 5.2). Its final visible opacity is still 1 (Req 5.4).
   */
  progressPulse: {
    initial: { opacity: 0.4 },
    animate: { opacity: 1 },
    transition: { duration: seconds(MOTION_DURATIONS.overlay), ease: [...MOTION_EASING] },
    isProgressIndicator: true,
  },
} satisfies Record<string, MotionVariant>;

export type MotionVariantName = keyof typeof motionVariants;

/**
 * Resolves a variant for the active motion preference. PURE and deterministic:
 * it never mutates its input and identical inputs always produce identical output.
 *
 * - When reduced motion is OFF, the variant is returned unchanged.
 * - When reduced motion is ON and the variant is NOT a progress indicator,
 *   returns a variant whose `initial` deep-equals its `animate` (final visible)
 *   state and whose transition `duration` is 0 — so hover, activation,
 *   section-reveal, and dialog/dropdown open/close present their final state
 *   immediately (Req 4.8, 5.1, 5.3).
 * - When reduced motion is ON and the variant IS a progress indicator
 *   (`isProgressIndicator === true`), it is preserved unchanged (Req 5.2).
 */
export function resolveMotionVariant(
  variant: MotionVariant,
  prefersReducedMotion: boolean
): MotionVariant {
  if (!prefersReducedMotion || variant.isProgressIndicator === true) {
    return variant;
  }

  // Snapshot the final visible state; both initial and animate point at copies
  // of it so the element renders its resting state with no movement.
  const finalState = { ...variant.animate };

  return {
    ...variant,
    initial: { ...finalState },
    animate: { ...finalState },
    transition: { ...variant.transition, duration: 0 },
  };
}

/**
 * Hook wrapper around Framer Motion's `useReducedMotion` and
 * `resolveMotionVariant`. Framer Motion's hook subscribes to the
 * `prefers-reduced-motion` media query, so content rendered after a runtime
 * preference change uses the newly resolved variant (Req 5.6).
 *
 * When the preference cannot be determined (`null`), motion is treated as
 * enabled; content visibility is still guaranteed because every catalog
 * variant's `animate.opacity` resolves to 1.
 */
export function useReducedMotionVariants(variant: MotionVariant): MotionVariant {
  const prefersReducedMotion = useReducedMotion();
  return resolveMotionVariant(variant, prefersReducedMotion ?? false);
}
