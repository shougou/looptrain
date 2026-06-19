/**
 * Result type for representing success/error outcomes without throwing.
 *
 * Usage:
 *   Result<T, E> = { success: true; value: T } | { success: false; error: E }
 */

export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Creates a successful Result.
 */
export function success<T>(value: T): Result<T, never> {
  return { success: true, value };
}

/**
 * Creates a failed Result.
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * EngineResult describes the outcome of an engine operation.
 * This is the core result type returned by all LegacyEngineAdapter methods.
 */
export interface EngineResult {
  success: boolean;
  failureReason?: string;
  apCost: number;
  timeAdvanced: number;
  cluesUnlocked: string[];
  actionsUnlocked: string[];
  npcStateChanges: Record<string, unknown>;
  relationshipChanges: Record<string, unknown>;
  goalUpdates: Record<string, unknown>;
  flags: Record<string, unknown>;
}
