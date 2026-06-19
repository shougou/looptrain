/**
 * ResetPlanner — produces a plan of MemoryEventDraft[] to apply a reset.
 */

import type { MemoryEventDraft } from '../engine/MemoryEventDraft';
import type { MemoryEventType } from '../memory/MemoryEvent';
import type { RuntimeState } from '../MemoryRuntime';
import type { ResetPolicy } from './ResetPolicy';

export interface ResetPlan {
  drafts: MemoryEventDraft[];
  targetLoopNo: number;
}

export function planReset(
  currentState: RuntimeState,
  _policy: ResetPolicy,
  runId: string,
  chapterId: string,
  episodeId: string,
  sceneId: string
): ResetPlan {
  const currentLoopNo =
    currentState.events.length > 0
      ? parseInt(
          currentState.events[currentState.events.length - 1].loopId
            .replace(/[^0-9]/g, '')
            .slice(0, 4),
          10
        ) || 1
      : 1;

  const targetLoopNo = currentLoopNo + 1;
  const loopId = `loop_${String(targetLoopNo).padStart(4, '0')}_${runId.replace(/^run_/, '').slice(0, 8)}`;
  const drafts: MemoryEventDraft[] = [];

  drafts.push({
    type: 'TIME_RESET' as MemoryEventType,
    runId, loopId, chapterId, episodeId, sceneId,
    payload: { previousLoop: currentLoopNo, newLoop: targetLoopNo },
  });

  drafts.push({
    type: 'AP_RESET' as MemoryEventType,
    runId, loopId, chapterId, episodeId, sceneId,
    payload: { previousLoop: currentLoopNo, newLoop: targetLoopNo },
  });

  for (const k of currentState.knowledge) {
    drafts.push({
      type: 'CARRYOVER_MEMORY_APPLIED' as MemoryEventType,
      runId, loopId, chapterId, episodeId, sceneId,
      payload: {
        knowledgeId: k.id, clueId: k.clueId,
        title: k.title, summary: k.summary,
        carriedFromLoop: currentLoopNo,
      },
    });
  }

  drafts.push({
    type: 'LOOP_STARTED' as MemoryEventType,
    runId, loopId, chapterId, episodeId, sceneId,
    payload: {
      loopIndex: targetLoopNo, loopId,
      carryoverKnowledgeCount: currentState.knowledge.length,
    },
  });

  return { drafts, targetLoopNo };
}
