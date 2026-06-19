"use strict";
/**
 * PromptMemoryContextBuilder — builds a safe, filtered PromptMemoryContext
 * from a MemoryRuntime instance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPromptContext = buildPromptContext;
function buildPromptContext(runtime, currentScene = 'scene-current') {
    const state = runtime.getState();
    const confirmedClues = state.knowledge
        .filter((k) => k.visibility === 'player_visible')
        .map((k) => ({ title: k.title, summary: k.summary }));
    const visibleTimeline = state.timeline.map((t) => ({
        loopNo: t.loopNo,
        summary: t.summary,
    }));
    const activeBeliefs = state.beliefs
        .filter((b) => b.status === 'unconfirmed' || b.status === 'strengthened')
        .map((b) => ({
        target: b.target,
        statement: b.statement,
        confidence: b.confidence,
    }));
    const currentLoop = state.events.length > 0
        ? parseInt(state.events[state.events.length - 1].loopId
            .replace(/[^0-9]/g, '')
            .slice(0, 4), 10) || 1
        : 1;
    const carriedMemory = state.knowledge
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
