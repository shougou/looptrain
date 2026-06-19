/**
 * Timeline entry — a record of what happened in a loop.
 *
 * Timeline is a player-readable projection, not source of truth.
 */

export interface Timeline {
  id: string;
  runId: string;
  loopNo: number;
  summary: string;
  outcome?: string;
  keyEventIds: string[];
  createdAt: string; // ISO-8601 UTC string
}
