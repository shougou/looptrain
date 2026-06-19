/**
 * CompanionView - the ONLY state view accessible to Assistant Runtime / 许知微.
 *
 * CompanionView answers: "What is Xu Zhiwei allowed to know right now?"
 * Hidden truth is excluded at the source; anti-spoiler is architectural, not prompt-based.
 *
 * Spec reference: Section 10
 */

import type { CompanionViewPolicy } from './CompanionViewPolicy';

// ── Sub-views ─────────────────────────────────────────────────

export interface CompanionPlayerView {
  playerId: string;
  currentChapterId: string;
  currentEpisodeId: string;
}

export interface CompanionRunView {
  runId: string;
  currentLoopId: string;
  loopCount: number;
  hasFirstContact: boolean;
  failureCount: number;
}

export interface CompanionSceneView {
  sceneId: string;
  sceneLabel: string;
  visibleNpcIds: string[];
  reachableLocationIds: string[];
  availableActionIds: string[];
  sceneDescription: string;
}

export interface CompanionKnowledgeView {
  confirmedClueIds: string[];
  confirmedFacts: string[];
  unlockedLocationIds: string[];
}

export interface CompanionBeliefView {
  activeBeliefs: Array<{
    beliefId: string;
    summary: string;
    confidence: 'low' | 'medium' | 'high';
    sourceEventId: string;
  }>;
}

export interface CompanionTimelineView {
  currentLoop: Array<{
    eventId: string;
    type: string;
    summary: string;
    createdAt: string;
  }>;
  previousLoops: Array<{
    loopId: string;
    loopIndex: number;
    outcome: string;
    failureReason?: string;
  }>;
}

export interface CompanionArchiveView {
  carryoverMemories: string[];
  confirmedFactsAcrossLoops: string[];
  unlockedActionsAcrossLoops: string[];
}

export interface CompanionRelationshipView {
  npcs: Array<{
    npcId: string;
    name: string;
    relationshipLabel: string;
    visible: boolean;
  }>;
}

export interface CompanionViewProvenance {
  builtAt: string;
  builderVersion: number;
  policyVersion: number;
  sourceEventSeq: number;
  lastEventId: string | null;
}

// ── Main CompanionView ────────────────────────────────────────

export interface CompanionView {
  viewId: string;
  schemaVersion: 1;

  player: CompanionPlayerView;
  run: CompanionRunView;
  scene: CompanionSceneView;

  knowledge: CompanionKnowledgeView;
  belief: CompanionBeliefView;
  timeline: CompanionTimelineView;
  archive: CompanionArchiveView;
  relationship: CompanionRelationshipView;

  policy: CompanionViewPolicy;
  provenance: CompanionViewProvenance;
}
