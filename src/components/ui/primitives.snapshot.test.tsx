import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import * as React from "react";

import { Button } from "./button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { Badge } from "./badge";
import { StatusIndicator, type SurfaceStatus } from "./status-indicator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./dropdown-menu";

/**
 * Snapshot tests for the shared UI primitives in BOTH themes.
 *
 * These guard the de-glassing (no `backdrop-blur`), achromatic shadows, and the
 * new radii (Req 2.1, 2.2, 2.4) and that surfaces consume the shared primitives
 * (Req 3.2). The captured markup is the regression net for the styling refactor.
 *
 * Validates: Requirements 2.1, 2.2, 2.4, 3.2
 *
 * Determinism: Radix (Dialog/DropdownMenu) generates random element ids via
 * `useId`, and framer-motion (StatusIndicator) writes transient inline styles.
 * Neither is part of the styling contract we are guarding, so they are masked
 * by `sanitize()` before snapshotting. What remains stable — and what the
 * snapshots assert — is the className/structure markup.
 */

// ---------------------------------------------------------------------------
// Environment mocks (jsdom lacks matchMedia + ResizeObserver)
// ---------------------------------------------------------------------------
// framer-motion's `useReducedMotion` reads `window.matchMedia`, and Radix's
// Popper (used by DropdownMenu) observes element size via `ResizeObserver`.
// jsdom implements neither, so we provide minimal no-op stand-ins.

let originalMatchMedia: typeof window.matchMedia | undefined;
let originalResizeObserver: typeof globalThis.ResizeObserver | undefined;

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
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });

  originalResizeObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof globalThis.ResizeObserver;
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

  if (originalResizeObserver) {
    globalThis.ResizeObserver = originalResizeObserver;
  } else {
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  }
});

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Theme = "light" | "dark";
const THEMES: Theme[] = ["light", "dark"];

/**
 * Mask attribute values that are non-deterministic across runs (Radix-generated
 * ids and the aria references that point at them) plus framer-motion's transient
 * inline `style`. The stable className/structure markup is preserved.
 */
function sanitize(html: string): string {
  return html
    .replace(
      /(id|for|aria-controls|aria-labelledby|aria-describedby|aria-owns|aria-activedescendant)="[^"]*"/g,
      '$1="<id>"'
    )
    .replace(/ style="[^"]*"/g, ' style="<style>"');
}

/** Apply the theme by toggling the `.dark` class on the document element. */
function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/**
 * Render an in-tree primitive inside a themed wrapper and return the sanitized
 * markup of that wrapper. The wrapper carries `class="dark"` in the dark case,
 * so the theme context is visible in the snapshot itself.
 */
function renderInTree(theme: Theme, ui: React.ReactNode): string {
  setTheme(theme);
  const { container } = render(
    <div className={theme === "dark" ? "dark" : undefined}>{ui}</div>
  );
  const wrapper = container.firstElementChild as HTMLElement;
  return sanitize(wrapper.outerHTML);
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

describe("Button snapshots (both themes)", () => {
  for (const theme of THEMES) {
    it(`renders a representative variant set in ${theme}`, () => {
      const markup = renderInTree(
        theme,
        <>
          <Button variant="primary" size="md">
            Primary
          </Button>
          <Button variant="secondary" size="md">
            Secondary
          </Button>
          <Button variant="ghost" size="md">
            Ghost
          </Button>
        </>
      );
      expect(markup).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

describe("Card snapshots (both themes)", () => {
  for (const theme of THEMES) {
    it(`renders a card with header/content in ${theme}`, () => {
      const markup = renderInTree(
        theme,
        <Card>
          <CardHeader>
            <CardTitle>Session summary</CardTitle>
            <CardDescription>Recent translation activity</CardDescription>
          </CardHeader>
          <CardContent>Body content</CardContent>
        </Card>
      );
      expect(markup).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// Badge + StatusIndicator
// ---------------------------------------------------------------------------

describe("Badge snapshots (both themes)", () => {
  for (const theme of THEMES) {
    it(`renders an info badge in ${theme}`, () => {
      const markup = renderInTree(theme, <Badge variant="info">Info</Badge>);
      expect(markup).toMatchSnapshot();
    });
  }
});

describe("StatusIndicator snapshots (both themes)", () => {
  const statuses: SurfaceStatus[] = ["recording", "processing", "idle"];

  for (const theme of THEMES) {
    it(`renders every surface status in ${theme}`, () => {
      const markup = renderInTree(
        theme,
        <>
          {statuses.map((status) => (
            <StatusIndicator key={status} status={status} />
          ))}
        </>
      );
      expect(markup).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// Dialog (portal)
// ---------------------------------------------------------------------------

describe("Dialog snapshots (both themes)", () => {
  for (const theme of THEMES) {
    it(`renders an open dialog overlay + content in ${theme}`, () => {
      setTheme(theme);
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm action</DialogTitle>
              <DialogDescription>
                This guards the de-glassed overlay and content surface.
              </DialogDescription>
            </DialogHeader>
            <div>Dialog body</div>
          </DialogContent>
        </Dialog>
      );

      const content = document.querySelector('[role="dialog"]') as HTMLElement | null;
      expect(content).not.toBeNull();
      const overlay = content?.previousElementSibling as HTMLElement | null;

      expect({
        overlay: overlay ? sanitize(overlay.outerHTML) : null,
        content: content ? sanitize(content.outerHTML) : null,
      }).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// DropdownMenu (portal)
// ---------------------------------------------------------------------------

describe("DropdownMenu snapshots (both themes)", () => {
  for (const theme of THEMES) {
    it(`renders an open dropdown menu in ${theme}`, () => {
      setTheme(theme);
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const menu = document.querySelector('[role="menu"]') as HTMLElement | null;
      expect(menu).not.toBeNull();
      expect(menu ? sanitize(menu.outerHTML) : null).toMatchSnapshot();
    });
  }
});
