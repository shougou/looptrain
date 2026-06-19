/**
 * ResetApplier — applies a ResetPlan to a MemoryRuntime by appending all reset events.
 */

import type { MemoryRuntime } from '../MemoryRuntime';
import type { MemoryEvent } from '../memory/MemoryEvent';
import type { ResetPlan } from './ResetPlanner';

export function applyReset(
  runtime: MemoryRuntime,
  plan: ResetPlan
): MemoryEvent[] {
  return runtime.appendEvents(plan.drafts);
}
