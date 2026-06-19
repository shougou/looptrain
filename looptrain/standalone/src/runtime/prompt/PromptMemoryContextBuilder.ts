/**
 * PromptMemoryContextBuilder — builds a safe, filtered PromptMemoryContext
 * from a MemoryRuntime instance.
 */

import type { MemoryRuntime } from '../MemoryRuntime';
import type {
  PromptMemoryContext,
  PromptKnowledgeItem,
  PromptTimelineItem,
  PromptBeliefItem,
} from './PromptMemoryContext';

export function buildPromptContext(
  runtime: MemoryRuntime,
  currentScene: string = 'scene-current'
): PromptMemoryContext {
  const state = runtime.getState();

  const confirmedClues: PromptKnowledgeItem[] = state.knowledge
    .filter((k) => k.visibility === 'player_visible')
    .map((k) => ({ title: k.title, summary: k.summary }));

  const visibleTimeline: PromptTimelineItem[] = state.timeline.map((t) => ({
    loopNo: t.loopNo,
    summary: t.summary,
  }));

  const activeBeliefs: PromptBeliefItem[] = state.beliefs
    .filter((b) => b.status === 'unconfirmed' || b.status === 'strengthened')
    .map((b) => ({
      target: b.target,
      statement: b.statement,
      confidence: b.confidence,
    }));

  const currentLoop = state.events.length > 0
    ? parseInt(
        state.events[state.events.length - 1].loopId
          .replace(/[^0-9]/g, '')
          .slice(0, 4),
        10
      ) || 1
    : 1;

  const carriedMemory: string[] = state.knowledge
    .filter((k) => k.id.startsWith('carry_'))
    .map((k) => k.summary);

  return {
    confirmedClues,
    visibleTimeline,
    activeBeliefs,
    currentScene,
    currentLoop,
    carriedMemory,
  };
}
