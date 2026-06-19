/**
 * MemoryEventDraft - server-side event draft contract.
 *
 * The server returns drafts. The browser MemoryRuntime (or legacy state bridge)
 * is responsible for generating formal MemoryEvent records (eventId, eventSeq,
 * prevEventId, createdAt) and persisting them.
 *
 * Spec reference: Section 8.2
 */

import type { MemoryEventType } from '../memory/MemoryEvent';

export interface MemoryEventDraft<TPayload = unknown> {
  type: MemoryEventType;
  runId: string;
  loopId: string;
  chapterId: string;
  episodeId: string;
  sceneId: string;
  payload: TPayload;
}
