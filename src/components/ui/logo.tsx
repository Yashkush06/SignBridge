"use client";

import { cn } from "@/lib/cn";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  showText?: boolean;
  iconClassName?: string;
  textClassName?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({
  showText = true,
  iconClassName,
  textClassName,
  size = "md",
  className,
  ...props
}: LogoProps) {
  const sizes = {
    sm: { icon: "h-5 w-5", text: "text-base tracking-tight" },
    md: { icon: "h-6 w-6", text: "text-lg tracking-tight" },
    lg: { icon: "h-8 w-8", text: "text-2xl tracking-tight" },
  };

  const currentSize = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)} {...props}>
      {/* Premium SVG Icon representing connection nodes and bridge */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          currentSize.icon,
          "text-brand-500 shrink-0 transition-transform hover:scale-105 duration-300",
          iconClassName
        )}
      >
        {/* Outer connection bridge arch */}
        <path
          d="M6 20C6 12.268 10.4772 7 16 7C21.5228 7 26 12.268 26 20"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-brand-500"
        />
        {/* Inner bridge line */}
        <path
          d="M10 23C10 19.134 12.6863 16 16 16C19.3137 16 22 19.134 22 23"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stroke-brand-500 opacity-60 dark:opacity-75"
        />
        {/* Connection tracking nodes */}
        <circle cx="16" cy="7" r="3" className="fill-brand-500 animate-pulse" />
        <circle cx="6" cy="20" r="2.5" className="fill-brand-400 dark:fill-brand-300" />
        <circle cx="26" cy="20" r="2.5" className="fill-brand-400 dark:fill-brand-300" />
        <circle cx="10" cy="23" r="2" className="fill-brand-600 dark:fill-brand-500" />
        <circle cx="22" cy="23" r="2" className="fill-brand-600 dark:fill-brand-500" />
      </svg>

      {/* Dynamic Text Logo */}
      {showText && (
        <span className={cn("font-sans font-semibold text-[var(--fg)] tracking-tight select-none", currentSize.text, textClassName)}>
          <span className="text-brand-500 font-extrabold">Sign</span>
          <span className="text-[var(--fg)]">Bridge</span>
        </span>
      )}
    </div>
  );
}
