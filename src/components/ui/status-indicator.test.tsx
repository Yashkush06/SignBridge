import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import fc from "fast-check";
import { render, screen, cleanup } from "@testing-library/react";
import {
  STATUS_PRESENTATION,
  StatusIndicator,
  type SurfaceStatus,
} from "./status-indicator";

/**
 * Property-based test for the surface status presentation map.
 *
 * Validates: Requirements 6.3, 8.3
 *
 * STATUS_PRESENTATION encodes the three defined app surface statuses with a
 * guaranteed non-empty visible text label and a non-color cue (a distinct
 * lucide icon), each pairwise distinct in visual treatment (label, icon, and
 * badge variant). This test exercises both the per-status guarantees (over a
 * generated status stream) and the pairwise-distinctness guarantee.
 */

// ---------------------------------------------------------------------------
// matchMedia mock (jsdom does not implement window.matchMedia)
// ---------------------------------------------------------------------------
//
// Rendering StatusIndicator pulls in framer-motion's useReducedMotion, which
// calls window.matchMedia on first use. jsdom omits matchMedia, so provide a
// minimal stub that reports "motion enabled" (matches: false). This keeps the
// optional render assertions robust without affecting the core property.
let originalMatchMedia: typeof window.matchMedia | undefined;

beforeAll(() => {
  originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) =>
      ({
        media: query,
        matches: false,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => true,
      }) as unknown as MediaQueryList,
  });
});

afterAll(() => {
  if (originalMatchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
  } else {
    delete (window as { matchMedia?: unknown }).matchMedia;
  }
});

afterEach(() => {
  cleanup();
});

// The closed domain of defined surface statuses.
const SURFACE_STATUSES = ["recording", "processing", "idle"] as const;

describe("STATUS_PRESENTATION", () => {
  // Feature: ui-premium-polish, Property 7: Every status presentation carries a non-color cue and is distinct
  it("Property 7: every status has a non-empty label and a non-color icon cue, and presentations are pairwise distinct", () => {
    // (a) Per-status guarantee, over a generated status stream: each defined
    // surface status maps to a presentation with a non-empty visible text
    // label and a defined icon (a cue independent of color).
    fc.assert(
      fc.property(
        fc.constantFrom<SurfaceStatus>(...SURFACE_STATUSES),
        (status) => {
          const presentation = STATUS_PRESENTATION[status];

          // Non-empty visible text label (Req 8.3, 6.3).
          expect(typeof presentation.label).toBe("string");
          expect(presentation.label.trim().length).toBeGreaterThan(0);

          // Non-color cue: a defined icon component reference (Req 6.3).
          expect(presentation.icon).toBeTruthy();
          expect(typeof presentation.icon).not.toBe("undefined");
        }
      ),
      { numRuns: 100 }
    );

    // (b) Pairwise distinctness across the three statuses: the visual treatment
    // (label, icon reference, and badge variant) is distinct for every pair.
    const presentations = SURFACE_STATUSES.map((s) => STATUS_PRESENTATION[s]);

    const labels = presentations.map((p) => p.label);
    const icons = presentations.map((p) => p.icon);
    const variants = presentations.map((p) => p.badgeVariant);

    // A set of distinct values has the same size as the source array.
    expect(new Set(labels).size).toBe(labels.length);
    expect(new Set(icons).size).toBe(icons.length);
    expect(new Set(variants).size).toBe(variants.length);

    // Explicit pairwise checks: icon references are mutually !== (distinct
    // non-color cues), and labels/variants differ for every pair.
    for (let i = 0; i < presentations.length; i++) {
      for (let j = i + 1; j < presentations.length; j++) {
        expect(presentations[i].label).not.toBe(presentations[j].label);
        expect(presentations[i].icon).not.toBe(presentations[j].icon);
        expect(presentations[i].badgeVariant).not.toBe(
          presentations[j].badgeVariant
        );
      }
    }
  });

  // Optional render coverage of the "visible text label" aspect (Req 8.3):
  // each rendered StatusIndicator surfaces its label as visible text.
  it("renders each status with its visible text label", () => {
    for (const status of SURFACE_STATUSES) {
      const { unmount } = render(<StatusIndicator status={status} />);
      expect(screen.getByText(STATUS_PRESENTATION[status].label)).toBeInTheDocument();
      unmount();
    }
  });
});
