/**
 * Unit/example tests for primitive radius & font facts and theme rendering.
 *
 * Feature: ui-premium-polish, Task 6.8.
 *
 * Scope (Req 1.3, 1.4, 1.7, 1.8, 3.3, 3.4, 3.5, 3.6, 3.7):
 *   - Radius facts: Card renders the `--radius-2xl` utility (`rounded-2xl`) and
 *     Button renders the `--radius-xl` utility (`rounded-xl`). In Tailwind v4
 *     these utilities are generated from the `--radius-*` Design_Tokens declared
 *     under `@theme` in `src/app/globals.css`, so asserting the utility class is
 *     the practical proxy for the token (jsdom does not compute CSS vars).
 *   - Font facts: `headingClass(level)` applies `font-heading` (which maps to the
 *     `--font-heading` token) and `bodyClass()` applies `font-sans` (`--font-sans`).
 *   - Theme rendering: components consume tokens via `var(--…)`, so the active
 *     theme is driven entirely by the `.dark` class on an ancestor (next-themes).
 *     The same token-based classes therefore serve both themes; we assert the
 *     class output is theme-agnostic, that components mount before any theme
 *     class resolves (light tokens apply at `:root`), and that they survive a
 *     theme toggle without losing their token classes or crashing.
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { Button } from "./button";
import { Card } from "./card";
import {
  HEADING_LEVELS,
  headingClass,
  bodyClass,
  HEADING_FONT_CLASS,
  BODY_FONT_CLASS,
} from "@/lib/typography";

afterEach(() => {
  cleanup();
  // Reset any theme class left on the document between tests.
  document.documentElement.classList.remove("dark");
});

describe("primitive radius facts", () => {
  it("Button renders the --radius-xl utility (rounded-xl) (Req 1.4)", () => {
    // Tailwind v4 maps `rounded-xl` -> var(--radius-xl) (12px). Asserting the
    // utility class is the practical proxy since jsdom does not resolve CSS vars.
    render(<Button>Press</Button>);
    const button = screen.getByRole("button", { name: "Press" });
    expect(button.className).toContain("rounded-xl");
    // It must not regress to a different radius family.
    expect(button.className).not.toContain("rounded-2xl");
    expect(button.className).not.toContain("rounded-md");
  });

  it("Card renders the --radius-2xl utility (rounded-2xl) (Req 1.3)", () => {
    // Tailwind v4 maps `rounded-2xl` -> var(--radius-2xl) (16px).
    render(<Card data-testid="card">Body</Card>);
    const card = screen.getByTestId("card");
    expect(card.className).toContain("rounded-2xl");
    expect(card.className).not.toContain("rounded-xl ");
    expect(card.className).not.toContain("rounded-lg");
  });
});

describe("primitive font facts", () => {
  it("headingClass applies the --font-heading utility for every heading level (Req 1.7)", () => {
    for (const level of HEADING_LEVELS) {
      const klass = headingClass(level);
      expect(klass).toContain(HEADING_FONT_CLASS); // "font-heading" -> var(--font-heading)
    }
  });

  it("bodyClass applies the --font-sans utility (Req 1.8)", () => {
    expect(bodyClass()).toContain(BODY_FONT_CLASS); // "font-sans" -> var(--font-sans)
  });

  it("rendered heading/body elements carry the correct font utility classes (Req 1.7, 1.8)", () => {
    render(
      <div>
        <h1 className={headingClass("h1")}>Title</h1>
        <p className={bodyClass()}>Paragraph</p>
      </div>
    );
    expect(screen.getByRole("heading", { name: "Title" }).className).toContain(
      "font-heading"
    );
    expect(screen.getByText("Paragraph").className).toContain("font-sans");
  });
});

describe("theme rendering", () => {
  it("renders the same token-based classes in light and dark contexts (Req 3.3, 3.4)", () => {
    // jsdom does not resolve CSS vars, so the *single* token-based implementation
    // produces the same class output regardless of theme; the var(--…) values are
    // what differ per theme at the CSS layer. We assert that toggling `dark` on a
    // wrapping container does not change the component's emitted classes, which
    // demonstrates one implementation correctly serves both themes.
    const { rerender } = render(
      <div>
        <Button>Save</Button>
        <Card data-testid="card">Panel</Card>
      </div>
    );
    const lightButton = screen.getByRole("button", { name: "Save" }).className;
    const lightCard = screen.getByTestId("card").className;

    rerender(
      <div className="dark">
        <Button>Save</Button>
        <Card data-testid="card">Panel</Card>
      </div>
    );
    const darkButton = screen.getByRole("button", { name: "Save" }).className;
    const darkCard = screen.getByTestId("card").className;

    expect(darkButton).toBe(lightButton);
    expect(darkCard).toBe(lightCard);
    // Token classes are present in both themes.
    expect(darkButton).toContain("rounded-xl");
    expect(darkCard).toContain("rounded-2xl");
  });

  it("renders with light token classes before any theme resolves (Req 3.5)", () => {
    // No theme provider and no `dark` class anywhere: the :root (light) tokens
    // apply by default, so the primitive still mounts with its token classes.
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    render(
      <>
        <Button>Continue</Button>
        <Card data-testid="card">Content</Card>
      </>
    );
    const button = screen.getByRole("button", { name: "Continue" });
    const card = screen.getByTestId("card");

    expect(button).toBeInTheDocument();
    expect(card).toBeInTheDocument();
    expect(button.className).toContain("rounded-xl");
    expect(card.className).toContain("rounded-2xl");
  });

  it("re-renders intact when the theme toggles to dark (Req 3.7)", () => {
    render(
      <>
        <Button>Toggle</Button>
        <Card data-testid="card">Panel</Card>
      </>
    );
    const beforeButton = screen.getByRole("button", { name: "Toggle" }).className;
    const beforeCard = screen.getByTestId("card").className;

    // Simulate next-themes flipping the active theme on the document element.
    document.documentElement.classList.add("dark");

    const button = screen.getByRole("button", { name: "Toggle" });
    const card = screen.getByTestId("card");

    // Still present and functional, with no loss of token-based classes.
    expect(button).toBeInTheDocument();
    expect(card).toBeInTheDocument();
    expect(button.className).toBe(beforeButton);
    expect(card.className).toBe(beforeCard);
    expect(button.className).toContain("rounded-xl");
    expect(card.className).toContain("rounded-2xl");
  });

  it("renders identical spacing/padding classes for the same component+size (Req 3.6)", () => {
    // Two buttons of the same size must share identical class output, which means
    // identical token-driven padding/spacing for that size.
    render(
      <>
        <Button size="md">One</Button>
        <Button size="md">Two</Button>
      </>
    );
    const first = screen.getByRole("button", { name: "One" }).className;
    const second = screen.getByRole("button", { name: "Two" }).className;
    expect(first).toBe(second);
  });
});
