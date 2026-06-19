/**
 * Archive entry — summary of a completed or failed loop.
 *
 * Archive survives normal reset modes.
 */

export interface Archive {
  id: string;
  runId: string;
  title: string;
  summary: string;
  sourceEventIds: string[];
  archivedAt: string; // ISO-8601 UTC string
}
