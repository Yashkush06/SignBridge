/**
 * Variant resolver (Primitive Layer support).
 *
 * Pure, deterministic helper used by Component_Library primitives (Button,
 * Badge, ...) to degrade an unknown or absent size/variant request to a
 * defined default instead of rendering unstyled output.
 *
 * Design: .kiro/specs/ui-premium-polish/design.md — "Variant fallback".
 * Requirements: 3.1, 3.6, 3.8, 9.4.
 */

/**
 * Resolves a requested variant against the set of allowed variants.
 *
 * Behavior:
 * - If `requested` is present AND a member of `allowed`, returns it (typed as `T`).
 * - If `requested` is absent (`undefined`) OR not in `allowed`, returns
 *   `defaultVariant` and invokes `onInvalid` exactly once with the requested
 *   value. The absent case passes the empty string to `onInvalid`.
 *
 * The function is PURE and DETERMINISTIC: identical inputs always produce
 * identical output. The only permitted side effect is the single invocation
 * of the caller-provided `onInvalid` callback.
 *
 * @param requested The requested variant value, or `undefined` when absent.
 * @param allowed The set of allowed variants. The order is irrelevant to the result.
 * @param defaultVariant The fallback returned when `requested` is absent or unknown.
 * @param onInvalid Optional dev-time signal invoked once when the fallback is used.
 * @returns A member of `allowed`.
 */
export function resolveVariant<T extends string>(
  requested: string | undefined,
  allowed: readonly T[],
  defaultVariant: T,
  onInvalid?: (requested: string) => void
): T {
  if (requested !== undefined && (allowed as readonly string[]).includes(requested)) {
    return requested as T;
  }

  onInvalid?.(requested ?? "");
  return defaultVariant;
}

/**
 * Default `onInvalid` handler for primitives.
 *
 * Logs a development-time `console.warn` describing the invalid variant. The
 * warning is suppressed in production (`process.env.NODE_ENV === "production"`)
 * so it never spams real users. This env-guard lives here, not in
 * `resolveVariant`, keeping the resolver itself free of environment logic.
 *
 * @param requested The invalid (absent or unknown) variant value.
 * @param context Optional label identifying the calling component or prop.
 */
export function warnInvalidVariant(requested: string, context?: string): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const where = context ? ` for ${context}` : "";
  const value = requested === "" ? "(none)" : `"${requested}"`;
  console.warn(
    `[ui-premium-polish] Invalid variant ${value}${where}; falling back to the default variant.`
  );
}
