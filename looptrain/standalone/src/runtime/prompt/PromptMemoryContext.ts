/**
 * PromptMemoryContext — the SAFE, filtered view of runtime state for LLM prompt input.
 *
 * MUST NOT contain: raw event log, hidden truth, dialogue_session, future plot, NPC private thoughts.
 */

export interface PromptKnowledgeItem {
  title: string;
  summary: string;
}

export interface PromptTimelineItem {
  loopNo: number;
  summary: string;
}

export interface PromptBeliefItem {
  target: string;
  statement: string;
  confidence: number;
}

export interface PromptMemoryContext {
  confirmedClues: PromptKnowledgeItem[];
  visibleTimeline: PromptTimelineItem[];
  activeBeliefs: PromptBeliefItem[];
  currentScene: string;
  currentLoop: number;
  carriedMemory: string[];
}
