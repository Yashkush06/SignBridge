import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { LucideIcon } from "lucide-react";
import { selectActiveNavItem, type NavItem } from "./navigation";

// The selector never renders the icon, so a trivial component cast to the
// LucideIcon type is sufficient for generated NavItems.
const DUMMY_ICON = (() => null) as unknown as LucideIcon;

/**
 * Oracle that replicates the EXACT match rule of `selectActiveNavItem`.
 *
 * An item matches when `pathname === href` OR `pathname` begins with a
 * segment boundary `href + "/"`. Because the root href "/" already ends in a
 * slash, its boundary is "/" — so "/" matches every absolute path and only
 * loses to a longer matching prefix. This mirrors `isMatch` in navigation.ts.
 */
function oracleIsMatch(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }
  const boundary = href.endsWith("/") ? href : `${href}/`;
  return pathname.startsWith(boundary);
}

// A small, reusable pool of path segments. Reusing names (e.g. "anal" vs
// "analytics") makes nested-route and false-prefix collisions likely.
const SEGMENTS = [
  "a",
  "b",
  "c",
  "history",
  "analytics",
  "anal",
  "settings",
  "users",
  "x",
];

const segmentArb = fc.constantFrom(...SEGMENTS);

// Generates hrefs like "/", "/history", or "/history/a/b" (root + nested).
const hrefArb = fc.oneof(
  fc.constant("/"),
  fc
    .array(segmentArb, { minLength: 1, maxLength: 4 })
    .map((segs) => "/" + segs.join("/"))
);

const navItemArb: fc.Arbitrary<NavItem> = fc.record({
  name: fc.string(),
  href: hrefArb,
  icon: fc.constant(DUMMY_ICON),
});

// Generates an { items, pathname } pair. The pathname is sometimes a fully
// arbitrary path, sometimes derived from an item href (exact or nested) so
// matches are exercised frequently rather than only by chance.
const inputArb = fc.array(navItemArb, { maxLength: 6 }).chain((items) => {
  const baseOptions: fc.Arbitrary<string>[] = [hrefArb, fc.string()];

  const derivedOptions: fc.Arbitrary<string>[] =
    items.length === 0
      ? []
      : [
          // Exact match against an existing item href.
          fc.constantFrom(...items.map((i) => i.href)),
          // Nested sub-route of an existing item href.
          fc
            .record({
              base: fc.constantFrom(...items.map((i) => i.href)),
              extra: fc.array(segmentArb, { minLength: 1, maxLength: 3 }),
            })
            .map(
              ({ base, extra }) =>
                (base === "/" ? "" : base) + "/" + extra.join("/")
            ),
        ];

  return fc.record({
    items: fc.constant(items),
    pathname: fc.oneof(...baseOptions, ...derivedOptions),
  });
});

describe("selectActiveNavItem", () => {
  // Feature: ui-premium-polish, Property 6: Exactly one navigation item is active
  it("Property 6: returns at most one item, the longest matching prefix, or null", () => {
    fc.assert(
      fc.property(inputArb, ({ items, pathname }) => {
        const result = selectActiveNavItem(pathname, items);
        const matches = items.filter((item) =>
          oracleIsMatch(pathname, item.href)
        );

        // 1. Result is either null or exactly one item from the list.
        if (result !== null) {
          expect(items).toContain(result);
        }

        if (matches.length > 0) {
          // 2. With at least one match, the result is a match and its href is
          //    at least as long as every other matching item's href
          //    (longest-prefix wins; first match on a length tie).
          expect(result).not.toBeNull();
          expect(matches).toContain(result);

          const maxLen = Math.max(...matches.map((m) => m.href.length));
          expect(result!.href.length).toBe(maxLen);

          const expectedActive = matches.find((m) => m.href.length === maxLen);
          expect(result).toBe(expectedActive);
        } else {
          // 3. When no item matches, the result is null.
          expect(result).toBeNull();
        }

        // 4. Determinism: identical inputs yield an identical result.
        expect(selectActiveNavItem(pathname, items)).toBe(result);
      }),
      { numRuns: 100 }
    );
  });
});
