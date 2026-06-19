/**
 * ISO-8601 UTC time utilities.
 *
 * On ES2020 target, Date.prototype.toISOString is natively available.
 * This module provides a thin shim that wraps the native implementation
 * and ensures consistent UTC formatting across the runtime.
 */

/**
 * Returns the current time as an ISO-8601 UTC string.
 * Equivalent to new Date().toISOString().
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Formats a Date object as an ISO-8601 UTC string.
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Formats a Unix timestamp (milliseconds) as an ISO-8601 UTC string.
 */
export function fromTimestamp(ms: number): string {
  return new Date(ms).toISOString();
}
