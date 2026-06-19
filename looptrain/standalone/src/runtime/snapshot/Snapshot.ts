/**
 * Snapshot — a point-in-time capture of the entire runtime state.
 *
 * Snapshot is a recovery accelerator, not source of truth.
 */

import type { Knowledge } from '../knowledge/Knowledge';
import type { Belief } from '../belief/Belief';
import type { Relationship } from '../relationship/Relationship';
import type { Timeline } from '../timeline/Timeline';
import type { Archive } from '../archive/Archive';

export interface Snapshot {
  snapshotId: string;
  runId: string;
  loopId: string;
  eventSeq: number;
  timestamp: string; // ISO-8601 UTC string
  knowledge: Knowledge[];
  beliefs: Belief[];
  relationships: Relationship[];
  timeline: Timeline[];
  archive: Archive[];
}
