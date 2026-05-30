import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-[var(--bg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "button";
    
    if (asChild) {
      return (
        <Comp>
          {React.cloneElement(children as React.ReactElement<any>, {
            ref: ref as any,
            className: cn(buttonVariants({ variant, size, className })),
            ...props,
          })}
        </Comp>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
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
