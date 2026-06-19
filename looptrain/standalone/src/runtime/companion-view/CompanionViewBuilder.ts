/**
 * CompanionViewBuilder - builds a CompanionView from RuntimeClientState.
 * Slice 0: deterministic skeleton. Spec reference: Section 10.2
 */

import type { RuntimeClientState } from '../memory/RuntimeClientState';
import type { CompanionView, CompanionViewProvenance } from './CompanionView';
import type { CompanionViewPolicy } from './CompanionViewPolicy';
import { generateViewId } from '../ids/RuntimeIdGenerator';

export function buildCompanionView(clientState: RuntimeClientState): CompanionView {
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
    builderVersion: 1,
    policyVersion: 1,
    sourceEventSeq: clientState.eventSeq,
    lastEventId: clientState.lastEventId,
  };

  const viewId = generateViewId(
    clientState.runId, clientState.loopId, clientState.sceneId,
    clientState.lastEventId, policy.guidanceLevel, provenance.builderVersion
  );

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
      loopCount: 0,
      hasFirstContact: false,
      failureCount: 0,
    },
    scene: {
      sceneId: clientState.sceneId,
      sceneLabel: '第七节车厢',
      visibleNpcIds: [],
      reachableLocationIds: [],
      availableActionIds: [],
      sceneDescription: '你正站在第七节车厢中。车厢内灯光昏暗，气氛紧张。',
    },
    knowledge: { confirmedClueIds: [], confirmedFacts: [], unlockedLocationIds: [] },
    belief: { activeBeliefs: [] },
    timeline: { currentLoop: [], previousLoops: [] },
    archive: { carryoverMemories: [], confirmedFactsAcrossLoops: [], unlockedActionsAcrossLoops: [] },
    relationship: { npcs: [] },
    policy,
    provenance,
  };
}
