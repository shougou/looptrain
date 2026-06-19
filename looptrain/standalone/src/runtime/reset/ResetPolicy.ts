/**
 * ResetPolicy — defines what resets and what carries over between loops.
 */

import type { MemoryEventType } from '../memory/MemoryEvent';

export interface ResetPolicy {
  resets: MemoryEventType[];
  carries: MemoryEventType[];
}

export function getResetPolicy(): ResetPolicy {
  return {
    resets: [
      'TIME_RESET' as MemoryEventType,
      'AP_RESET' as MemoryEventType,
      'SCENE_CHANGED' as MemoryEventType,
    ],
    carries: [
      'KNOWLEDGE_CONFIRMED' as MemoryEventType,
      'BELIEF_CREATED' as MemoryEventType,
      'BELIEF_UPDATED' as MemoryEventType,
      'RELATIONSHIP_UPDATED' as MemoryEventType,
      'TIMELINE_ENTRY_CREATED' as MemoryEventType,
      'ARCHIVE_ENTRY_CREATED' as MemoryEventType,
      'CARRYOVER_MEMORY_RECORDED' as MemoryEventType,
      'CARRYOVER_MEMORY_APPLIED' as MemoryEventType,
    ],
  };
}
