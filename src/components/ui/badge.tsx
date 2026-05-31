import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { resolveVariant, warnInvalidVariant } from "@/lib/variant";

/**
 * Canonical Badge variant definitions (Req 3.1: exactly one set of variant
 * definitions). Every variant references only defined Design_Tokens from
 * `src/app/globals.css`:
 * - neutral scale (`--color-neutral-*`) for `default`
 * - brand scale (`--color-brand-*`) for `primary`
 * - semantic tokens (`--color-{success,warning,error,info}` and their
 *   `-light`/`-dark` companions) for the status variants
 * - theme surface vars (`--fg`, `--border`) for `outline`
 *
 * No hardcoded hex values and no colored glows (achromatic only).
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--border)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700",
        primary:
          "border-transparent bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900/30 dark:text-brand-300",
        success:
          "border-transparent bg-success/15 text-success-dark hover:bg-success/25 dark:text-success-light",
        warning:
          "border-transparent bg-warning/15 text-warning-dark hover:bg-warning/25 dark:text-warning-light",
        error:
          "border-transparent bg-error/15 text-error-dark hover:bg-error/25 dark:text-error-light",
        info:
          "border-transparent bg-info/15 text-info-dark hover:bg-info/25 dark:text-info-light",
        outline: "text-[var(--fg)] border-[var(--border)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/** The single allowed set of badge variants (Req 3.1). */
export const BADGE_VARIANTS = [
  "default",
  "primary",
  "success",
  "warning",
  "error",
  "info",
  "outline",
] as const;

export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

/** Defined default variant used when a requested variant is absent/unknown (Req 3.8). */
export const DEFAULT_BADGE_VARIANT: BadgeVariant = "default";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  // Variant fallback (Req 3.8): route the requested variant through the shared
  // resolver so an unknown/absent value degrades to the default variant and the
  // invalid selection is signalled to the caller via warnInvalidVariant.
  const resolved = resolveVariant(
    variant,
    BADGE_VARIANTS,
    DEFAULT_BADGE_VARIANT,
    (requested) => {
      // An absent variant (empty string) is a valid request for the default
      // and is not "invalid"; only warn when a non-empty unknown value is passed.
      if (requested !== "") {
        warnInvalidVariant(requested, "Badge variant");
      }
    }
  );

  return (
    <div className={cn(badgeVariants({ variant: resolved }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
