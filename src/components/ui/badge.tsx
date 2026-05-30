import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--border)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700",
        primary: "border-transparent bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900/30 dark:text-brand-300",
        success: "border-transparent bg-success/15 text-success-foreground hover:bg-success/25",
        warning: "border-transparent bg-warning/15 text-warning-foreground hover:bg-warning/25",
        error: "border-transparent bg-error/15 text-error-foreground hover:bg-error/25",
        info: "border-transparent bg-info/15 text-info-foreground hover:bg-info/25",
        outline: "text-[var(--fg)] border-[var(--border)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
