/**
 * SerializedMemoryState - snapshot storage format.
 *
 * Used for persisting MemoryRuntime state to IndexedDB or other storage.
 * Full implementation in Slice 2 (IndexedDB Memory Runtime).
 *
 * Spec reference: Section 5 directory layout
 */

import type { MemoryEvent } from './MemoryEvent';

export interface SerializedMemoryState {
  snapshotId: string;
  playerId: string;
  runId: string;
  chapterId: string;
  episodeId: string;
  loopId: string;
  sceneId: string;
  eventSeq: number;
  events: MemoryEvent[];
  createdAt: string;
  schemaVersion: number;
}
