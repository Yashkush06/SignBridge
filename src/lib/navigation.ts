/**
 * Active navigation selector (App Shell Layer support).
 *
 * Pure, deterministic helper used by the App_Shell (sidebar / top-nav) to pick
 * the single navigation item that should display the active state for a given
 * pathname. It replaces the ad-hoc `startsWith` logic that could light up more
 * than one item for nested routes.
 *
 * Design: .kiro/specs/ui-premium-polish/design.md — "App Shell" / Property 6.
 * Requirements: 8.5.
 */

import type { LucideIcon } from "lucide-react";

/**
 * A single navigation entry rendered in the App_Shell.
 */
export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Returns `true` when `pathname` is `href` itself or a nested sub-route of it.
 *
 * A nested sub-route is detected on a segment boundary (`href + "/"`), so
 * `"/analytics"` does NOT match `"/anal"` and the root `"/"` only matches the
 * exact pathname `"/"` rather than every path that begins with a slash.
 */
function isMatch(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }

  // Guard against false prefix matches: require a segment boundary. The root
  // href "/" would otherwise prefix every path, so the explicit trailing-slash
  // check means "/" only matches when pathname === "/" (handled above).
  const boundary = href.endsWith("/") ? href : `${href}/`;
  return pathname.startsWith(boundary);
}

/**
 * Returns the single active nav item for a pathname, or `null`.
 *
 * Behavior:
 * - An item is a "match" when `pathname === item.href` OR `pathname` is a
 *   nested sub-route of `item.href` (i.e. `pathname` starts with
 *   `item.href + "/"`). The segment-boundary check prevents false prefix
 *   matches such as `"/analytics"` matching an item whose href is `"/anal"`,
 *   and prevents the root href `"/"` from matching every route.
 * - Among all matching items, the one with the longest `href` (the longest
 *   matching prefix) wins, so nested routes resolve to exactly one item even
 *   when hrefs nest (e.g. `"/"` and `"/history"`).
 * - When two matches tie on href length (should not happen for distinct
 *   hrefs), the first match in list order wins, keeping the result
 *   deterministic.
 * - When no item matches, returns `null`.
 *
 * The function is PURE and DETERMINISTIC and never mutates its inputs.
 *
 * @param pathname The current route pathname (e.g. `"/history/123"`).
 * @param items The navigation items to choose from.
 * @returns The single active `NavItem`, or `null` when none match.
 */
export function selectActiveNavItem(
  pathname: string,
  items: NavItem[]
): NavItem | null {
  let active: NavItem | null = null;

  for (const item of items) {
    if (!isMatch(pathname, item.href)) {
      continue;
    }

    // Strictly-greater comparison keeps the FIRST item on a length tie,
    // guaranteeing deterministic single-item selection.
    if (active === null || item.href.length > active.href.length) {
      active = item;
    }
  }

  return active;
}
