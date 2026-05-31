"use client";

/**
 * StatusIndicator primitive + STATUS_PRESENTATION map (Primitive Layer).
 *
 * Encodes the three defined app surface statuses (recording, processing, idle)
 * with a guaranteed non-empty visible text label, a distinct token-based Badge
 * variant, and a distinct lucide-react icon (a non-color cue). The
 * recording/processing pulse communicates system state, so it is driven by the
 * `progressPulse` motion variant (flagged `isProgressIndicator`) and therefore
 * preserved under reduced motion. Idle carries no animation.
 *
 * Requirements: 6.3, 8.3, 5.2
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Circle, CircleDot, LoaderCircle, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { motionVariants, useReducedMotionVariants } from "@/lib/motion";

export type SurfaceStatus = "recording" | "processing" | "idle";

export interface StatusPresentation {
  /** Non-empty visible text label (Req 8.3, 6.3). */
  label: string;
  /** Distinct, token-backed Badge variant per status. */
  badgeVariant: "error" | "primary" | "default";
  /** Non-color cue: a distinct lucide icon per status (Req 6.3). */
  icon: LucideIcon;
  /** recording/processing pulse = progress indicator; idle = false. */
  animated: boolean;
}

/**
 * Maps each surface status to a pairwise-distinct presentation: every status
 * has a unique label, a unique Badge variant, and a unique icon. recording and
 * processing are animated (their pulse communicates system state); idle is not.
 * Property 7 (task 6.5) verifies the non-color cue and pairwise distinctness.
 */
export const STATUS_PRESENTATION: Record<SurfaceStatus, StatusPresentation> = {
  recording: {
    label: "Recording",
    badgeVariant: "error",
    icon: CircleDot,
    animated: true,
  },
  processing: {
    label: "Processing",
    badgeVariant: "primary",
    icon: LoaderCircle,
    animated: true,
  },
  idle: {
    label: "Idle",
    badgeVariant: "default",
    icon: Circle,
    animated: false,
  },
};

export interface StatusIndicatorProps {
  status: SurfaceStatus;
  className?: string;
}

/**
 * Renders a Badge containing the status icon (non-color cue) and its visible
 * text label. When the status is animated, the icon pulses via the
 * `progressPulse` variant, which is preserved under reduced motion because it
 * communicates system state (Req 5.2).
 */
export function StatusIndicator({
  status,
  className,
}: StatusIndicatorProps): React.JSX.Element {
  const presentation = STATUS_PRESENTATION[status];
  const Icon = presentation.icon;
  const pulse = useReducedMotionVariants(motionVariants.progressPulse);

  return (
    <Badge variant={presentation.badgeVariant} className={cn("gap-1.5", className)}>
      {presentation.animated ? (
        <motion.span
          className="inline-flex"
          initial={pulse.initial}
          animate={pulse.animate}
          transition={{ ...pulse.transition, repeat: Infinity, repeatType: "reverse" }}
          aria-hidden="true"
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
        </motion.span>
      ) : (
        <Icon className="h-3 w-3" aria-hidden="true" />
      )}
      <span>{presentation.label}</span>
    </Badge>
  );
}
