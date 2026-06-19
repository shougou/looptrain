/**
 * Profile record — player profile metadata.
 */

export interface Profile {
  version: 'v1';
  playerId: string;
  createdAt: string;  // ISO-8601 UTC string
  updatedAt: string;  // ISO-8601 UTC string
  settings: Record<string, unknown>;
}
