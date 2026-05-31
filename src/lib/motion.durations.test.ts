import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from "vitest";
import { render, renderHook, screen, fireEvent, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  MOTION_DURATIONS,
  motionVariants,
  useReducedMotionVariants,
} from "./motion";

/**
 * Unit tests for the Motion Layer's duration bounds, library usage, and
 * reduced-motion runtime behavior.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.5, 5.6
 *
 * These are example/unit assertions (not property-based); the universal
 * properties for this module live in the sibling `motion.*.test.ts` files.
 */

// ---------------------------------------------------------------------------
// matchMedia mock (jsdom does not implement window.matchMedia)
// ---------------------------------------------------------------------------
//
// Framer Motion's `useReducedMotion` lazily initializes once per module
// registry: on first use it calls `window.matchMedia("(prefers-reduced-motion)")`,
// reads `.matches`, and registers a single `change` listener that keeps its
// internal preference in sync. Subsequent hook mounts read that synced value.
//
// To model a runtime preference flip (Req 5.6) we keep a shared mutable
// `reducedMotionState` plus a shared set of `change` listeners. `setReducedMotion`
// updates the state and notifies the listener, so content rendered AFTER the
// change resolves against the new preference.

type ChangeListener = (event: { matches: boolean; media: string }) => void;

let reducedMotionState = false;
const changeListeners = new Set<ChangeListener>();
let originalMatchMedia: typeof window.matchMedia | undefined;

const isReducedMotionQuery = (query: string): boolean =>
  query.includes("prefers-reduced-motion");

const createMatchMedia = () =>
  vi.fn((query: string) => {
    const reducedQuery = isReducedMotionQuery(query);
    return {
      media: query,
      onchange: null,
      get matches() {
        return reducedQuery ? reducedMotionState : false;
      },
      // Modern API
      addEventListener: (type: string, listener: ChangeListener) => {
        if (type === "change" && reducedQuery) changeListeners.add(listener);
      },
      removeEventListener: (type: string, listener: ChangeListener) => {
        if (type === "change") changeListeners.delete(listener);
      },
      // Deprecated API (still used by some libraries)
      addListener: (listener: ChangeListener) => {
        if (reducedQuery) changeListeners.add(listener);
      },
      removeListener: (listener: ChangeListener) => {
        changeListeners.delete(listener);
      },
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  });

/** Set the reduced-motion preference and notify subscribers of the change. */
const setReducedMotion = (value: boolean): void => {
  reducedMotionState = value;
  const event = { matches: value, media: "(prefers-reduced-motion)" };
  for (const listener of changeListeners) listener(event);
};

beforeAll(() => {
  originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: createMatchMedia(),
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
    // jsdom had no matchMedia originally; remove the mock.
    delete (window as { matchMedia?: unknown }).matchMedia;
  }
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Duration bounds (Req 4.1–4.5)
// ---------------------------------------------------------------------------
describe("MOTION_DURATIONS bounds", () => {
  it("hover duration is within the 150–250ms window (Req 4.1)", () => {
    expect(MOTION_DURATIONS.hover).toBeGreaterThanOrEqual(150);
    expect(MOTION_DURATIONS.hover).toBeLessThanOrEqual(250);
  });

  it("activate duration is within the 100–250ms window (Req 4.2)", () => {
    expect(MOTION_DURATIONS.activate).toBeGreaterThanOrEqual(100);
    expect(MOTION_DURATIONS.activate).toBeLessThanOrEqual(250);
  });

  it("overlay open/close duration is within the 150–250ms window (Req 4.4, 4.5)", () => {
    expect(MOTION_DURATIONS.overlay).toBeGreaterThanOrEqual(150);
    expect(MOTION_DURATIONS.overlay).toBeLessThanOrEqual(250);
  });

  it("sectionReveal duration is within the 200–400ms window (Req 4.3)", () => {
    expect(MOTION_DURATIONS.sectionReveal).toBeGreaterThanOrEqual(200);
    expect(MOTION_DURATIONS.sectionReveal).toBeLessThanOrEqual(400);
  });

  it("every motion duration token is a positive finite number", () => {
    for (const value of Object.values(MOTION_DURATIONS)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Library usage (Req 4.6)
// ---------------------------------------------------------------------------
describe("motion module library usage", () => {
  it("imports its motion primitives from framer-motion (Req 4.6)", () => {
    // Resolve the module source relative to this test file's directory.
    // Vitest runs with the project root as cwd; the motion module sits next to
    // this test, so resolve from the known src/lib location.
    const motionSourcePath = resolve(process.cwd(), "src/lib/motion.ts");
    const source = readFileSync(motionSourcePath, "utf8");

    // The module must rely on the Motion_Library already in the codebase
    // (framer-motion) rather than a bespoke animation implementation.
    expect(source).toMatch(/from\s+["']framer-motion["']/);
  });
});

// ---------------------------------------------------------------------------
// Reduced-motion runtime behavior (Req 5.5, 5.6)
// ---------------------------------------------------------------------------
describe("useReducedMotionVariants runtime behavior", () => {
  it("resolves a non-progress variant to an instant final state when reduced motion is ON (Req 5.6)", () => {
    setReducedMotion(true);

    const { result } = renderHook(() =>
      useReducedMotionVariants(motionVariants.sectionReveal)
    );
    const resolved = result.current;

    // Instant: initial deep-equals the final visible (animate) state and there
    // is no animation duration, so content appears in its resting state at once.
    expect(resolved.initial).toEqual(resolved.animate);
    expect(resolved.transition.duration).toBe(0);
    expect(resolved.animate.opacity).toBe(1);
  });

  it("a runtime matchMedia flip changes subsequently resolved variants (Req 5.6)", () => {
    // Render once with reduced motion ON -> instant variant.
    setReducedMotion(true);
    const onRender = renderHook(() =>
      useReducedMotionVariants(motionVariants.sectionReveal)
    );
    expect(onRender.result.current.transition.duration).toBe(0);
    expect(onRender.result.current.initial).toEqual(onRender.result.current.animate);
    onRender.unmount();

    // Flip the preference at runtime, then render again. Content rendered after
    // the change resolves against the new (motion-enabled) preference.
    setReducedMotion(false);
    const offRender = renderHook(() =>
      useReducedMotionVariants(motionVariants.sectionReveal)
    );
    const full = offRender.result.current;

    expect(full.transition.duration).toBeGreaterThan(0);
    expect(full.initial).not.toEqual(full.animate);
    // The full variant still resolves to a fully visible final state.
    expect(full.animate.opacity).toBe(1);
  });

  it("keeps interactive handlers firing under reduced motion (Req 5.5)", () => {
    setReducedMotion(true);
    const onClick = vi.fn();

    // A tiny component that drives its timing through the reduced-motion hook
    // while exposing an interactive click handler. Authored with createElement
    // so the test stays a `.ts` file (no JSX transform required).
    const MotionButton = () => {
      const variant = useReducedMotionVariants(motionVariants.hover);
      return createElement(
        "button",
        {
          type: "button",
          onClick,
          "data-testid": "motion-button",
          "data-duration": String(variant.transition.duration),
        },
        "Activate"
      );
    };

    render(createElement(MotionButton));
    const button = screen.getByTestId("motion-button");

    // Reduced motion makes the interaction instant...
    expect(button).toHaveAttribute("data-duration", "0");

    // ...but the interactive handler still fires (functionality preserved).
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
