import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { resolveVariant, warnInvalidVariant } from "@/lib/variant";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium select-none ring-offset-[var(--bg)] transition-[color,background-color,border-color,transform,opacity] duration-[var(--duration-hover)] ease-[var(--ease-standard)] active:scale-[0.98] active:duration-[var(--duration-activate)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
        secondary: "bg-[var(--bg-secondary)] text-[var(--fg)] hover:bg-[var(--bg-tertiary)] border border-[var(--border)]",
        ghost: "hover:bg-[var(--bg-secondary)] text-[var(--fg)] hover:text-[var(--fg)]",
        danger: "bg-error text-white hover:bg-error/90 shadow-sm",
        outline: "border border-[var(--border)] bg-transparent hover:bg-brand-50 text-[var(--fg)] hover:text-brand-700 hover:border-brand-200 dark:hover:bg-brand-950/30 dark:hover:text-brand-300",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

/** Canonical variant/size vocabularies and defaults (single source of truth, Req 3.1). */
const BUTTON_VARIANTS = ["primary", "secondary", "ghost", "danger", "outline"] as const;
const BUTTON_SIZES = ["sm", "md", "lg", "icon"] as const;
const DEFAULT_VARIANT = "primary" satisfies (typeof BUTTON_VARIANTS)[number];
const DEFAULT_SIZE = "md" satisfies (typeof BUTTON_SIZES)[number];

type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
type ButtonSize = (typeof BUTTON_SIZES)[number];

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    // Resolve requested variant/size to a known value so an unknown selection
    // degrades to the default instead of rendering unstyled (Req 3.8). An absent
    // request (undefined/null) is the normal case and resolves silently to the
    // default; only a provided-but-unknown value signals the caller.
    const resolvedVariant = resolveVariant<ButtonVariant>(
      variant ?? undefined,
      BUTTON_VARIANTS,
      DEFAULT_VARIANT,
      (requested) => {
        if (requested !== "") warnInvalidVariant(requested, "Button variant");
      }
    );
    const resolvedSize = resolveVariant<ButtonSize>(
      size ?? undefined,
      BUTTON_SIZES,
      DEFAULT_SIZE,
      (requested) => {
        if (requested !== "") warnInvalidVariant(requested, "Button size");
      }
    );

    const Comp = asChild ? React.Fragment : "button";

    if (asChild) {
      return (
        <Comp>
          {React.cloneElement(children as React.ReactElement<any>, {
            ref: ref as any,
            className: cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize, className })),
            ...props,
          })}
        </Comp>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize, className }))}
        ref={ref}
        disabled={props.disabled || loading}
        aria-disabled={props.disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
