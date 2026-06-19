/**
 * Belief record — player inference or suspicion, not confirmed knowledge.
 *
 * Belief MUST be marked as uncertain and separate from Knowledge.
 * LLM MUST NOT create or update Belief.
 */

export interface Belief {
  id: string;
  runId: string;
  loopId: string;
  target: string; // npcId, clueId, or sceneId
  statement: string;
  confidence: number; // 0.0 - 1.0
  source: 'player_suspicion' | 'companion_inference' | 'timeline_pattern';
  status: 'unconfirmed' | 'contradicted' | 'strengthened' | 'confirmed';
  createdAt: string; // ISO-8601 UTC string
}
