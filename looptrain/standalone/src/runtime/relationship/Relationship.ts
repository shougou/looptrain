/**
 * Relationship record — player-NPC relationship state.
 *
 * Numeric values are internal runtime values. Future CompanionView may expose labels only.
 */

export interface Relationship {
  npcId: string;
  runId: string;
  label: string;
  trust: number;  // 0 - 100
  tension: number; // 0 - 100
  note: string;
  updatedAt: string; // ISO-8601 UTC string
}
