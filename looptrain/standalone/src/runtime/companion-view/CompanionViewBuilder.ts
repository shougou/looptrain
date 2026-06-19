/**
 * CompanionViewBuilder - builds a CompanionView from RuntimeClientState.
 * Slice 0: deterministic skeleton. Slice 2: MemoryRuntime integration.
 * Spec reference: Section 10.2
 */

import type { RuntimeClientState } from '../memory/RuntimeClientState';
import type { CompanionView, CompanionViewProvenance } from './CompanionView';
import type { CompanionViewPolicy } from './CompanionViewPolicy';
import { generateViewId } from '../ids/RuntimeIdGenerator';
import type { MemoryRuntime } from '../MemoryRuntime';
import type { MemoryEvent } from '../memory/MemoryEvent';
import type { Knowledge } from '../knowledge/Knowledge';
import type { Belief } from '../belief/Belief';
import type { Timeline } from '../timeline/Timeline';

function extractLoopNo(loopId: string): number {
  const match = loopId.match(/^loop_(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function buildCompanionView(
  clientState: RuntimeClientState,
  memoryRuntime?: MemoryRuntime,
): CompanionView {
  const policy: CompanionViewPolicy = {
    assistantPhase: 'normal',
    guidanceLevel: 1,
    maxSpoilerLevel: 2,
    canReferenceBeliefs: true,
    canCompareLoops: true,
    canReferenceArchive: true,
    canRecommendActions: true,
    locale: 'zh-CN',
    hiddenTruthAccessible: false,
  };

  const provenance: CompanionViewProvenance = {
    builtAt: new Date().toISOString(),
    builderVersion: 2,
    policyVersion: 1,
    sourceEventSeq: clientState.eventSeq,
    lastEventId: clientState.lastEventId,
  };

  const viewId = generateViewId(
    clientState.runId, clientState.loopId, clientState.sceneId,
    clientState.lastEventId, policy.guidanceLevel, provenance.builderVersion
  );

  let loopCount = 0;
  let failureCount = 0;
  let sceneId = clientState.sceneId;
  let visibleNpcIds: string[] = [];
  let confirmedClueIds: string[] = [];
  let confirmedFacts: string[] = [];
  let activeBeliefs: CompanionView['belief']['activeBeliefs'] = [];
  let currentLoop: CompanionView['timeline']['currentLoop'] = [];
  let previousLoops: CompanionView['timeline']['previousLoops'] = [];
  let carryoverMemories: string[] = [];

  if (memoryRuntime) {
    const events: MemoryEvent[] = memoryRuntime.storage.events;

    const uniqueLoopIds = new Set<string>();
    for (const ev of events) {
      if (ev.loopId) uniqueLoopIds.add(ev.loopId);
    }
    loopCount = uniqueLoopIds.size || 0;

    for (const ev of events) {
      if (ev.type === 'LOOP_FAILED') failureCount++;
    }

    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === 'SCENE_ENTERED') {
        sceneId = events[i].sceneId;
        break;
      }
    }

    const npcIdSet = new Set<string>();
    for (const ev of events) {
      if (ev.type === 'RELATIONSHIP_UPDATED' && ev.payload) {
        const payload = ev.payload as { npcId?: string };
        if (payload.npcId) npcIdSet.add(payload.npcId);
      }
    }
    const relationships = memoryRuntime.storage.relationship.getAll();
    for (const rel of relationships) {
      npcIdSet.add(rel.npcId);
    }
    visibleNpcIds = Array.from(npcIdSet);

    const allKnowledge: Knowledge[] = memoryRuntime.storage.knowledge.getConfirmed();
    confirmedClueIds = allKnowledge.map((k) => k.clueId);
    confirmedFacts = allKnowledge.map((k) => k.summary);

    const unconfirmedBeliefs: Belief[] = memoryRuntime.storage.belief.getUnconfirmed();
    activeBeliefs = unconfirmedBeliefs.map((b) => ({
      beliefId: b.id,
      summary: b.statement,
      confidence: b.confidence >= 0.8 ? 'high' : b.confidence >= 0.5 ? 'medium' : 'low',
      sourceEventId: b.id,
    }));

    const currentLoopNo = extractLoopNo(clientState.loopId);
    const timelineEntries: Timeline[] = memoryRuntime.storage.timeline.getAll();
    const tlForCurrent = timelineEntries.filter((t) => t.loopNo === currentLoopNo);
    if (tlForCurrent.length > 0) {
      currentLoop = tlForCurrent.flatMap((t) =>
        t.keyEventIds.map((eventId) => {
          const ev = events.find((e) => e.eventId === eventId);
          return {
            eventId,
            type: ev ? ev.type : 'UNKNOWN',
            summary: t.summary,
            createdAt: ev ? ev.createdAt : t.createdAt,
          };
        }),
      );
    }

    const tlForPrevious = timelineEntries.filter((t) => t.loopNo > 0 && t.loopNo < currentLoopNo);
    previousLoops = tlForPrevious.map((t) => ({
      loopId: `loop_${String(t.loopNo).padStart(4, '0')}`,
      loopIndex: t.loopNo,
      outcome: t.outcome || 'unknown',
      failureReason: undefined,
    }));

    for (const ev of events) {
      if (ev.type === 'CARRYOVER_MEMORY_APPLIED' && ev.payload) {
        const payload = ev.payload as { summary?: string };
        if (payload.summary) carryoverMemories.push(payload.summary);
      }
    }
  }

  return {
    viewId,
    schemaVersion: 1,
    player: {
      playerId: clientState.playerId,
      currentChapterId: clientState.chapterId,
      currentEpisodeId: clientState.episodeId,
    },
    run: {
      runId: clientState.runId,
      currentLoopId: clientState.loopId,
      loopCount,
      hasFirstContact: loopCount > 0,
      failureCount,
    },
    scene: {
      sceneId,
      sceneLabel: '第七节车厢',
      visibleNpcIds,
      reachableLocationIds: [],
      availableActionIds: [],
      sceneDescription: '你正站在第七节车厢中。车厢内灯光昏暗，气氛紧张。',
    },
    knowledge: { confirmedClueIds, confirmedFacts, unlockedLocationIds: [] },
    belief: { activeBeliefs },
    timeline: { currentLoop, previousLoops },
    archive: { carryoverMemories, confirmedFactsAcrossLoops: [], unlockedActionsAcrossLoops: [] },
    relationship: { npcs: [] },
    policy,
    provenance,
  };
}
