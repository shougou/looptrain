/**
 * LegacyStandaloneState — the current flat state format used by the standalone SLT.
 *
 * This is the shape of looptrain.standalone.v1 stored in browser localStorage.
 */

export interface LegacyStandaloneState {
  loop: number;
  clock: string;
  ap_remaining: number;
  known_clues: string[];
  carried_memory: string[];
  npc_states: Record<string, unknown>;
  flags: Record<string, boolean>;
  dialogue_session: unknown;
  location?: string;
  active_npc?: string;
  mode?: string;
}
