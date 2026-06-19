"use strict";
/**
 * ResetPlanner — produces a plan of MemoryEventDraft[] to apply a reset.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.planReset = planReset;
function planReset(currentState, _policy, runId, chapterId, episodeId, sceneId) {
    const currentLoopNo = currentState.events.length > 0
        ? parseInt(currentState.events[currentState.events.length - 1].loopId
            .replace(/[^0-9]/g, '')
            .slice(0, 4), 10) || 1
        : 1;
    const targetLoopNo = currentLoopNo + 1;
    const loopId = `loop_${String(targetLoopNo).padStart(4, '0')}_${runId.replace(/^run_/, '').slice(0, 8)}`;
    const drafts = [];
    drafts.push({
        type: 'TIME_RESET',
        runId, loopId, chapterId, episodeId, sceneId,
        payload: { previousLoop: currentLoopNo, newLoop: targetLoopNo },
    });
    drafts.push({
        type: 'AP_RESET',
        runId, loopId, chapterId, episodeId, sceneId,
        payload: { previousLoop: currentLoopNo, newLoop: targetLoopNo },
    });
    for (const k of currentState.knowledge) {
        drafts.push({
            type: 'CARRYOVER_MEMORY_APPLIED',
            runId, loopId, chapterId, episodeId, sceneId,
            payload: {
                knowledgeId: k.id, clueId: k.clueId,
                title: k.title, summary: k.summary,
                carriedFromLoop: currentLoopNo,
            },
        });
    }
    drafts.push({
        type: 'LOOP_STARTED',
        runId, loopId, chapterId, episodeId, sceneId,
        payload: {
            loopIndex: targetLoopNo, loopId,
            carryoverKnowledgeCount: currentState.knowledge.length,
        },
    });
    return { drafts, targetLoopNo };
}
