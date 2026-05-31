import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { resolveVariant } from "./variant";

describe("resolveVariant", () => {
  // Feature: ui-premium-polish, Property 1: Variant resolution always yields a defined variant
  it("Property 1: always yields a defined variant; falls back deterministically and signals invalid selection exactly once", () => {
    fc.assert(
      fc.property(
        // A non-empty set of distinct allowed variant strings.
        fc
          .uniqueArray(fc.string(), { minLength: 1, maxLength: 8 })
          .chain((allowed) =>
            fc.record({
              allowed: fc.constant(allowed),
              // default is always a member of `allowed`.
              defaultVariant: fc.constantFrom(...allowed),
              // requested mixes values inside `allowed`, arbitrary strings,
              // the empty string, and `undefined` to exercise both branches.
              requested: fc.oneof(
                fc.constantFrom(...allowed),
                fc.string(),
                fc.constant(""),
                fc.constant(undefined)
              ),
            })
          ),
        ({ allowed, defaultVariant, requested }) => {
          let invalidCount = 0;
          const onInvalid = () => {
            invalidCount += 1;
          };

          const result = resolveVariant(requested, allowed, defaultVariant, onInvalid);

          // 1. The result is always a member of the allowed set.
          expect(allowed).toContain(result);

          const requestedIsAllowed =
            requested !== undefined && allowed.includes(requested);

          if (requestedIsAllowed) {
            // 3. Requested is in `allowed` -> returns it, no invalid signal.
            expect(result).toBe(requested);
            expect(invalidCount).toBe(0);
          } else {
            // 2. Requested absent or not in `allowed` -> default + one signal.
            expect(result).toBe(defaultVariant);
            expect(invalidCount).toBe(1);
          }

          // 4. Determinism: identical inputs produce identical output.
          let secondInvalidCount = 0;
          const secondResult = resolveVariant(
            requested,
            allowed,
            defaultVariant,
            () => {
              secondInvalidCount += 1;
            }
          );
          expect(secondResult).toBe(result);
          expect(secondInvalidCount).toBe(invalidCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
