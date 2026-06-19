/**
 * Knowledge record — confirmed player knowledge about a clue.
 *
 * Knowledge is the canonical "what the player knows for certain" record.
 * Only Engine / Migration may create confirmed Knowledge.
 */

export interface Knowledge {
  id: string;
  runId: string;
  loopId: string;
  clueId: string;
  title: string;
  summary: string;
  sourceEventId: string;
  confidence: number;
  confirmedAt: string; // ISO-8601 UTC string
  visibility: 'player_visible';
}
