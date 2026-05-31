/**
 * Async surface state (Design: "Async surface state" section).
 *
 * A tiny, pure reducer that standardizes loading / loaded / error handling
 * across async App_Surfaces (e.g. `history`, `analytics`). Surfaces start
 * loading-first so the skeleton can be shown within 100ms (Req 8.2), and the
 * reducer retains the most-recently loaded data when a load fails (Req 8.6).
 *
 * This module is framework-agnostic: it is a plain reducer usable with React's
 * `useReducer`. It contains no React, no side effects, and never mutates its
 * input state.
 */

/** Fallback message used when a `failure` event carries an empty message. */
export const DEFAULT_ERROR_MESSAGE = "Failed to load";

/**
 * The state of an async surface.
 *
 * - `loading`: a load is in progress. `data` is the last loaded value if any,
 *   otherwise `null`. Surfaces show the skeleton in this phase (Req 8.2).
 * - `loaded`: data has loaded successfully and is always present.
 * - `error`: a load failed. `message` is always non-empty and `data` retains
 *   the most-recently loaded value, if any (Req 8.6).
 */
export type AsyncState<T> =
  | { phase: "loading"; data: T | null }
  | { phase: "loaded"; data: T }
  | { phase: "error"; data: T | null; message: string };

/**
 * Events that drive {@link asyncReducer}.
 *
 * - `load`: a load has started (re-enter the loading phase).
 * - `success`: a load resolved with `data`.
 * - `failure`: a load rejected with a (possibly empty) `message`.
 */
export type AsyncEvent<T> =
  | { type: "load" }
  | { type: "success"; data: T }
  | { type: "failure"; message: string };

/**
 * The initial state for an async surface: loading-first with no data, so the
 * skeleton is eligible to display immediately (Req 8.2).
 */
export function initialAsyncState<T>(): AsyncState<T> {
  return { phase: "loading", data: null };
}

/**
 * Pure, deterministic reducer for async surface state. Never mutates `state`.
 *
 * - `load` → `loading`, retaining the current data if any (else `null`).
 * - `success` → `loaded` with the event's data.
 * - `failure` → `error` with a guaranteed non-empty message, retaining the
 *   current data (which may be `null`) (Req 8.6).
 */
export function asyncReducer<T>(
  state: AsyncState<T>,
  event: AsyncEvent<T>
): AsyncState<T> {
  switch (event.type) {
    case "load":
      return { phase: "loading", data: state.data };
    case "success":
      return { phase: "loaded", data: event.data };
    case "failure":
      return {
        phase: "error",
        data: state.data,
        message: event.message.trim() === "" ? DEFAULT_ERROR_MESSAGE : event.message,
      };
    default: {
      // Exhaustiveness guard: unknown events leave state unchanged.
      const _exhaustive: never = event;
      return state;
    }
  }
}
