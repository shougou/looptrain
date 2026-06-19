/**
 * AssistantTypes - central type definitions for the Deterministic Assistant Runtime.
 *
 * Spec references: Sections 6, 11, 13
 */

import type { RuntimeClientState } from '../memory/RuntimeClientState';
import type { AssistantPhase, GuidanceLevel, SpoilerLevel } from '../companion-view/CompanionViewPolicy';

// ── Trigger Types (Section 11.3) ──────────────────────────────

export type AssistantTrigger =
  | 'ASK_ASSISTANT_BUTTON'
  | 'ASSISTANT_FREE_TEXT'
  | 'PLAYER_STALLED'
  | 'NEW_CLUE_ACQUIRED'
  | 'LOOP_STARTED'
  | 'DIALOGUE_SETTLEMENT'
  | 'LOOP_SETTLEMENT';

// ── Intent Types (Section 11.4) ───────────────────────────────

export type AssistantIntent =
  | 'ASK_NEXT_ACTION'
  | 'ASK_SCENE_EXPLAIN'
  | 'ASK_CLUE_SUMMARY'
  | 'ASK_LOOP_SUMMARY'
  | 'ASK_IDENTITY'
  | 'ASK_TRUTH'
  | 'ASK_RULE'
  | 'CASUAL_CHAT'
  | 'INVALID_OR_ATTACK';

// ── Response Mode ─────────────────────────────────────────────

export type AssistantResponseMode =
  | 'deterministic_template'
  | 'llm_generated'
  | 'fallback_silent'
  | 'disabled';

// ── Assistant Policy (Section 11.5) ───────────────────────────

export interface AssistantPolicy {
  assistantPhase: AssistantPhase;
  guidanceLevel: GuidanceLevel;
  maxSpoilerLevel: SpoilerLevel;

  canRecommendActions: boolean;
  canCompareLoops: boolean;
  canReferenceBeliefs: boolean;
  canReferenceArchive: boolean;

  canTriggerActions: false;
  maxActionCount: number;
  llmProvider: 'disabled' | 'mock' | 'deepseek';
}

// ── API Request/Response Types (Section 6) ────────────────────

export interface AssistantAskRequest {
  clientState: RuntimeClientState;
  trigger: AssistantTrigger;
  playerText?: string;
  locale: 'zh-CN';
  clientNow: string;
  debug?: boolean;
}

export interface AssistantAskResult {
  responseId: string;
  mode: AssistantResponseMode;

  assistant: {
    id: 'xu_zhiwei';
    displayName: '许知微';
  };

  visibleText: string;
  recommendedActions: RenderableAssistantAction[];
  clueReferences: RenderableClueReference[];
  beliefReferences: RenderableBeliefReference[];
  settlement?: RenderableSettlement;
  ui: AssistantUIHints;
  audit: AssistantAuditSummary;
}

export interface AssistantInitialStateResult {
  buttonVisible: boolean;
  buttonLabel: '询问助手';
  buttonEmphasis: 'high' | 'normal' | 'low' | 'hidden';
  assistantKnownToPlayer: boolean;
  firstContactAvailable: boolean;
}

// ── Renderable Types (Section 13.4) ───────────────────────────

export interface RenderableAssistantAction {
  actionId: string;
  label: string;
  inputTemplate: string;
  type: 'dialogue' | 'observe' | 'move' | 'present_clue' | 'review' | 'wait';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RenderableClueReference {
  clueId: string;
  label: string;
  description: string;
}

export interface RenderableBeliefReference {
  beliefId: string;
  summary: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface RenderableSettlement {
  settlementId: string;
  summary: string;
  outcome: string;
  type: 'dialogue' | 'loop';
}

export interface AssistantUIHints {
  emphasis: 'high' | 'normal' | 'low' | 'hidden';
  suggestedPanelState: 'collapsed' | 'expanded';
  showClueReferences: boolean;
  showBeliefReferences: boolean;
}

export interface AssistantAuditSummary {
  intent: AssistantIntent;
  policyPhase: AssistantPhase;
  guidanceLevel: GuidanceLevel;
  templateUsed: string;
  llmUsed: boolean;
  validatorPassed: boolean;
  spoilerCheckPassed: boolean;
  actionsRecommended: number;
  processingTimeMs: number;
}

// ── Assistant Response (Section 13.1) ─────────────────────────

export interface AssistantResponse {
  mode: AssistantResponseMode;

  visibleText: string;

  actionRefs: string[];
  clueRefs: string[];
  beliefRefs: string[];

  settlementRef?: string;

  spoilerLevel: SpoilerLevel;
  confidence: 'low' | 'medium' | 'high';

  stateEffects: [];
}
