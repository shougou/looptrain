/**
 * RuntimeClientState - mandatory request-scoped state contract.
 *
 * All server Runtime APIs MUST receive RuntimeClientState.
 * AssistantAskRequest MUST include clientState.
 *
 * In Slice 0, this is the server/browser state bridge. The full
 * browser-side TypeScript MemoryRuntime / IndexedDB implementation
 * is not in scope for Slice 0.
 *
 * Spec reference: Section 4.8
 */

import type { MemoryEvent } from './MemoryEvent';

export interface RuntimeClientState {
  playerId: string;
  runId: string;
  chapterId: string;
  episodeId: string;
  loopId: string;
  sceneId: string;
  snapshotId: string | null;
  lastEventId: string | null;
  eventSeq: number;
  eventsSinceSnapshot: MemoryEvent[];
}
