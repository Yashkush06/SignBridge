import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  asyncReducer,
  initialAsyncState,
  DEFAULT_ERROR_MESSAGE,
  type AsyncEvent,
  type AsyncState,
} from "./async-state";

describe("asyncReducer", () => {
  // Feature: ui-premium-polish, Property 5: Async surface state is loading-first and preserves data on failure
  it("Property 5: stays loading until a terminal event, loads data on success, and on failure carries a non-empty message while retaining the last loaded data", () => {
    // Data type under test is integers; failure messages include empty and
    // whitespace-only values to exercise the DEFAULT_ERROR_MESSAGE substitution.
    const eventArb: fc.Arbitrary<AsyncEvent<number>> = fc.oneof(
      fc.constant<AsyncEvent<number>>({ type: "load" }),
      fc.integer().map<AsyncEvent<number>>((data) => ({ type: "success", data })),
      fc
        .oneof(fc.string(), fc.constantFrom("", " ", "   ", "\t\n"))
        .map<AsyncEvent<number>>((message) => ({ type: "failure", message }))
    );

    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 30 }), (events) => {
        let state: AsyncState<number> = initialAsyncState<number>();

        // The initial state is loading-first so the skeleton is eligible (Req 8.2).
        expect(state.phase).toBe("loading");
        expect(state.data).toBeNull();

        // `expectedData` mirrors the data the reducer should currently carry:
        // null initially, the event's data after a success, and retained
        // (unchanged) across `load` and `failure` events (Req 8.6).
        let expectedData: number | null = null;
        // True once a success or failure has occurred; before that the prefix
        // is all `load` events and the state must remain in the loading phase.
        let seenTerminal = false;

        for (const event of events) {
          // 1. Before any success/failure event, the state stays loading.
          if (!seenTerminal) {
            expect(state.phase).toBe("loading");
          }

          // 4. The reducer never mutates its input state.
          const inputRef = state;
          const inputSnapshot = structuredClone(state);

          const next = asyncReducer(inputRef, event);

          expect(inputRef).toEqual(inputSnapshot);

          if (event.type === "load") {
            // Re-enters loading, retaining the current data.
            expect(next.phase).toBe("loading");
            expect(next.data).toBe(expectedData);
          } else if (event.type === "success") {
            // 2. Success -> loaded carrying the event's data.
            seenTerminal = true;
            expectedData = event.data;
            expect(next.phase).toBe("loaded");
            expect(next.data).toBe(event.data);
          } else {
            // 3. Failure -> error with a guaranteed non-empty message and the
            // most-recently loaded data retained (or null if none).
            seenTerminal = true;
            expect(next.phase).toBe("error");
            if (next.phase === "error") {
              expect(next.data).toBe(expectedData);
              expect(next.message.length).toBeGreaterThan(0);
              expect(next.message.trim().length).toBeGreaterThan(0);
              // Empty / whitespace-only input is substituted by the default.
              if (event.message.trim() === "") {
                expect(next.message).toBe(DEFAULT_ERROR_MESSAGE);
              } else {
                expect(next.message).toBe(event.message);
              }
            }
          }

          state = next;
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe("asyncReducer (examples)", () => {
  it("starts loading with no data", () => {
    const state = initialAsyncState<number>();
    expect(state).toEqual({ phase: "loading", data: null });
  });

  it("success transitions to loaded with the data", () => {
    const next = asyncReducer(initialAsyncState<number>(), { type: "success", data: 42 });
    expect(next).toEqual({ phase: "loaded", data: 42 });
  });

  it("failure after a success retains the loaded data and keeps a message", () => {
    const loaded = asyncReducer(initialAsyncState<number>(), { type: "success", data: 7 });
    const errored = asyncReducer(loaded, { type: "failure", message: "boom" });
    expect(errored).toEqual({ phase: "error", data: 7, message: "boom" });
  });

  it("failure with an empty message substitutes the default message", () => {
    const errored = asyncReducer(initialAsyncState<number>(), { type: "failure", message: "   " });
    expect(errored).toEqual({ phase: "error", data: null, message: DEFAULT_ERROR_MESSAGE });
  });

  it("load after a success retains the loaded data while loading again", () => {
    const loaded = asyncReducer(initialAsyncState<number>(), { type: "success", data: 99 });
    const reloading = asyncReducer(loaded, { type: "load" });
    expect(reloading).toEqual({ phase: "loading", data: 99 });
  });
});
