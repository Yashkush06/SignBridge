/**
 * Unit/example tests for App Shell keyboard/focus accessibility and responsive
 * off-canvas navigation.
 *
 * Feature: ui-premium-polish, Task 9.6.
 *
 * Scope (Req 6.6, 6.7, 6.8, 9.2):
 *   - 6.8 Focus order matches DOM/visual order: the sidebar renders its nav
 *     links as real anchors in the declared order (Workspace group then Insights
 *     group). DOM order equals reading order, and (because every link is a
 *     natively-focusable anchor) it equals tab/focus order.
 *   - 6.6 Keyboard reachable, no focus trap: every nav link is a real `<a>` with
 *     a non-empty href and is left in the natural tab order (not disabled, no
 *     `tabindex="-1"`, not `aria-hidden`). No focus-trapping wrapper (aria-modal)
 *     surrounds the sidebar. A full tab-cycle simulation is infeasible in jsdom,
 *     so "all interactive elements are natively focusable anchors/buttons with
 *     no trap" is the accepted proxy.
 *   - 6.7 Enter/Space activation: native anchors activate on Enter and native
 *     buttons activate on Enter/Space identically to a pointer click. We assert
 *     the nav links are anchors with href (native Enter activation) and that a
 *     native Button's pointer activation invokes its handler (the platform maps
 *     Enter/Space to that same activation path).
 *   - 9.2 Off-canvas mobile nav: the sidebar wrapper uses the off-canvas pattern
 *     — translated off-screen (`-translate-x-full`) when closed so it does not
 *     overlap content, `translate-x-0` when open, `lg:static lg:translate-x-0`
 *     on desktop — and the main content is a separate sibling (`min-w-0`, not
 *     nested inside the sidebar). The token scrim (`bg-[var(--overlay)]`) only
 *     appears when the sidebar is open.
 *
 * Notes on test doubles:
 *   - `next/navigation` is mocked (these are client components calling
 *     `usePathname`/`useRouter`).
 *   - `next/link` is mocked to a plain `<a href>` so anchors render
 *     deterministically in jsdom without app-router link context.
 *   - `window.matchMedia` is stubbed (jsdom omits it; next-themes/framer-motion
 *     read it on first use).
 *   - The zustand `useAppStore` is the real store; we drive `sidebarOpen`
 *     through its public setter inside `act(...)`.
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- Mocks ------------------------------------------------------------------

// Client components use next/navigation hooks; provide stable stubs.
vi.mock("next/navigation", () => ({
  usePathname: () => "/translator",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Render next/link as a plain anchor so links are real <a href> in jsdom.
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname?: string };
    children: React.ReactNode;
  } & Record<string, unknown>) => (
    <a href={typeof href === "string" ? href : (href?.pathname ?? "#")} {...props}>
      {children}
    </a>
  ),
}));

import { AppShell } from "./app-shell";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

// --- matchMedia stub --------------------------------------------------------

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
  // Reset shared store state between tests.
  act(() => {
    useAppStore.getState().setSidebarOpen(false);
  });
});

beforeEach(() => {
  // Reset shared store state before each test as well, so a test never starts
  // with stale `sidebarOpen` left over from a prior (possibly async) test.
  act(() => {
    useAppStore.getState().setSidebarOpen(false);
  });
});

// The declared navigation order (Workspace group, then Insights group). This is
// the visual reading order the DOM order must match (Req 6.8).
const DECLARED_NAV_ORDER = [
  "Live Translator",
  "Text to Sign",
  "Voice to Sign",
  "History Feed",
  "Analytics",
] as const;

// --- 6.8 Focus/DOM order ----------------------------------------------------

describe("Sidebar focus order matches DOM/visual order (Req 6.8)", () => {
  it("renders nav links as anchors in the declared Workspace-then-Insights order", () => {
    render(<Sidebar />);

    const links = screen.getAllByRole("link");

    // Locate each declared nav item by its visible label and record its index
    // in DOM order.
    const indices = DECLARED_NAV_ORDER.map((name) =>
      links.findIndex((link) => link.textContent?.includes(name))
    );

    // Every declared item is present.
    expect(indices.every((i) => i >= 0)).toBe(true);

    // DOM order is strictly increasing in the declared order => DOM/reading
    // order matches the declared (visual) navigation order.
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  it("renders each nav link as a focusable anchor with an href (in tab order)", () => {
    render(<Sidebar />);

    for (const name of DECLARED_NAV_ORDER) {
      const link = screen.getByRole("link", { name: new RegExp(name) });

      // Real anchor element.
      expect(link.tagName).toBe("A");

      // Non-empty href keeps it in the natural tab order and enables native
      // Enter activation.
      const href = link.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).not.toBe("#");
    }
  });

  it("advances keyboard focus through nav links in declared (visual) order", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    // Drive real Tab traversal and record the order in which the declared nav
    // links receive focus. Enough tab presses to pass the logo link and reach
    // every nav anchor.
    const focusedOrder: string[] = [];
    for (let i = 0; i < DECLARED_NAV_ORDER.length + 3; i++) {
      await user.tab();
      const active = document.activeElement;
      if (active && active.tagName === "A") {
        const label = DECLARED_NAV_ORDER.find((name) =>
          active.textContent?.includes(name)
        );
        if (label && !focusedOrder.includes(label)) {
          focusedOrder.push(label);
        }
      }
    }

    // Focus reached the nav links in exactly the declared visual order, so the
    // tab/focus order matches the DOM/reading order (Req 6.8).
    expect(focusedOrder).toEqual([...DECLARED_NAV_ORDER]);
  });
});

// --- 6.6 Keyboard reachable, no focus trap ----------------------------------

describe("Sidebar is keyboard reachable with no focus trap (Req 6.6)", () => {
  it("keeps every nav link in the natural focus order (no tabindex=-1 / aria-hidden)", () => {
    render(<Sidebar />);

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      // Not removed from focus order.
      expect(link.getAttribute("tabindex")).not.toBe("-1");
      // Not hidden from assistive tech / focus.
      expect(link.getAttribute("aria-hidden")).not.toBe("true");
      // Anchors are not disable-able, but guard against an inert attribute.
      expect(link.hasAttribute("inert")).toBe(false);
    }
  });

  it("does not wrap navigation in a focus-trapping modal container", () => {
    render(<Sidebar />);

    const nav = screen.getByRole("complementary");
    // No aria-modal trap around the sidebar nav.
    expect(nav.closest('[aria-modal="true"]')).toBeNull();
  });

  it("lets focus tab past the last nav link and out of the sidebar (no trap)", async () => {
    const user = userEvent.setup();
    // A trailing focusable sibling stands in for "the next interactive element
    // after the shell". If focus were trapped in the sidebar it could never
    // reach this button.
    render(
      <div>
        <Sidebar />
        <button data-testid="after-shell">After</button>
      </div>
    );

    const after = screen.getByTestId("after-shell");

    // Tab repeatedly; focus must be able to leave the sidebar and land on the
    // trailing control. Generous bound covers the logo link + every nav link.
    let escaped = false;
    for (let i = 0; i < DECLARED_NAV_ORDER.length + 5; i++) {
      await user.tab();
      if (document.activeElement === after) {
        escaped = true;
        break;
      }
    }

    // Focus successfully left the sidebar => there is no focus trap (Req 6.6).
    expect(escaped).toBe(true);
  });
});

// --- 6.7 Enter/Space activation ---------------------------------------------

describe("Enter/Space activation invokes the same action as click (Req 6.7)", () => {
  it("activates a native Button handler on pointer click (Enter/Space map to the same path)", () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Run</Button>);

    const button = screen.getByRole("button", { name: "Run" });

    // Native <button>: the platform routes Enter and Space activation through
    // the same click handler, so asserting it is a native button guarantees
    // keyboard activation equivalence.
    expect(button.tagName).toBe("BUTTON");

    fireEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("invokes the same handler for keyboard Enter, Space, and a pointer click", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Button onClick={handler}>Run</Button>);

    const button = screen.getByRole("button", { name: "Run" });

    // Move focus to the button via the keyboard, then activate with Enter.
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(handler).toHaveBeenCalledTimes(1);

    // Space activates the same handler.
    await user.keyboard(" ");
    expect(handler).toHaveBeenCalledTimes(2);

    // A pointer click goes through the same activation path.
    await user.click(button);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("exposes nav links as native anchors with href for native Enter activation", () => {
    render(<Sidebar />);

    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link.tagName).toBe("A");
      expect(link.getAttribute("href")).toBeTruthy();
    }
  });

  it("invokes a nav anchor's click handler when activated with Enter", async () => {
    const user = userEvent.setup();
    const handler = vi.fn((e: React.MouseEvent) => e.preventDefault());
    // Mirror the sidebar's anchor shape (real <a href>) to verify that keyboard
    // Enter routes through the same click handler a pointer click would.
    render(
      <a href="/translator" onClick={handler} data-testid="nav-anchor">
        Live Translator
      </a>
    );

    const anchor = screen.getByTestId("nav-anchor");
    await user.tab();
    expect(anchor).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(handler).toHaveBeenCalledTimes(1);

    await user.click(anchor);
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

// --- 9.2 Off-canvas mobile nav does not overlap content ---------------------

describe("AppShell off-canvas mobile navigation (Req 9.2)", () => {
  function findScrim(container: HTMLElement): HTMLElement | undefined {
    return Array.from(container.querySelectorAll("div")).find((el) =>
      el.className.includes("bg-[var(--overlay)]")
    );
  }

  it("keeps the sidebar off-screen and the scrim absent when closed", () => {
    const { container } = render(
      <AppShell>
        <div data-testid="content">Workspace content</div>
      </AppShell>
    );

    // The mount effect closes the sidebar; confirm closed state.
    expect(useAppStore.getState().sidebarOpen).toBe(false);

    const sidebarWrapper = screen.getByRole("complementary").parentElement!;

    // Off-canvas: translated fully off-screen when closed (does not overlap
    // primary content), but static & on-screen at the lg breakpoint.
    expect(sidebarWrapper.className).toContain("-translate-x-full");
    expect(sidebarWrapper.className).toContain("fixed");
    expect(sidebarWrapper.className).toContain("lg:static");
    expect(sidebarWrapper.className).toContain("lg:translate-x-0");

    // No scrim while closed.
    expect(findScrim(container)).toBeUndefined();
  });

  it("renders main content as a sibling of the sidebar, not nested inside it", () => {
    render(
      <AppShell>
        <div data-testid="content">Workspace content</div>
      </AppShell>
    );

    const aside = screen.getByRole("complementary");
    const main = screen.getByRole("main");

    // Main content is a separate region, not nested within the sidebar, so the
    // off-canvas nav cannot overlap it structurally.
    expect(aside.contains(main)).toBe(false);

    // Main content column owns min-w-0 so it can shrink without overflow.
    expect(main.parentElement!.className).toContain("min-w-0");

    // The rendered children live inside the main region.
    expect(main).toContainElement(screen.getByTestId("content"));
  });

  it("slides the sidebar on-screen and shows the token scrim when opened", () => {
    const { container } = render(
      <AppShell>
        <div data-testid="content">Workspace content</div>
      </AppShell>
    );

    // Open the off-canvas sidebar via the store's public setter.
    act(() => {
      useAppStore.getState().setSidebarOpen(true);
    });

    const sidebarWrapper = screen.getByRole("complementary").parentElement!;

    // On-screen when open; no longer translated off-canvas.
    expect(sidebarWrapper.className).toContain("translate-x-0");
    expect(sidebarWrapper.className).not.toContain("-translate-x-full");

    // The token scrim appears and is mobile-only (hidden at lg) so it never
    // covers desktop content.
    const scrim = findScrim(container);
    expect(scrim).toBeDefined();
    expect(scrim!.className).toContain("lg:hidden");
    expect(scrim!.getAttribute("aria-hidden")).toBe("true");
  });
});
