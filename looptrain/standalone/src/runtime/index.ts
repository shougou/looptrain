/**
 * LoopTrain Runtime v0.6 - Public API
 * Slice 0: TypeScript Host + Deterministic Assistant Runtime Skeleton.
 * CommonJS module format. All exports are named (no default exports).
 */

// ── Shared ────────────────────────────────────────────────────
export type {
  PlayerId, RunId, ChapterId, EpisodeId, LoopId,
  SceneId, SnapshotId, EventId, ViewId, ActionId,
  ClueId, NpcId, DialogueId, GoalId, RelationshipId, ResponseId,
} from './shared/ids';

export { nowISO, toISOString, fromTimestamp } from './shared/time';

export { RuntimeError, ValidationError, DisabledProviderError } from './shared/errors';

export type { Result, EngineResult } from './shared/result';
export { success, failure } from './shared/result';

// ── IDs ───────────────────────────────────────────────────────
export { RuntimeId } from './ids/RuntimeId';
export {
  generatePlayerId, generateRunId, generateLoopId,
  generateEventId, generateSnapshotId, generateViewId,
} from './ids/RuntimeIdGenerator';

// ── Engine ────────────────────────────────────────────────────
export type { MemoryEventDraft } from './engine/MemoryEventDraft';
export type {
  LegacyEngineAdapter, CommitActionInput, CommitActionOutput,
  EndDialogueInput, EndDialogueOutput, FailLoopInput, FailLoopOutput,
  NextLoopInput, NextLoopOutput,
} from './engine/LegacyEngineAdapter';

// ── Memory ────────────────────────────────────────────────────
export type { MemoryEventType, MemoryEvent } from './memory/MemoryEvent';
export type { RuntimeClientState } from './memory/RuntimeClientState';
export type { SerializedMemoryState } from './memory/SerializedMemoryState';

// ── Companion View ────────────────────────────────────────────
export type {
  CompanionView, CompanionPlayerView, CompanionRunView,
  CompanionSceneView, CompanionKnowledgeView, CompanionBeliefView,
  CompanionTimelineView, CompanionArchiveView, CompanionRelationshipView,
  CompanionViewProvenance,
} from './companion-view/CompanionView';

export type {
  CompanionViewPolicy, AssistantPhase, GuidanceLevel, SpoilerLevel,
} from './companion-view/CompanionViewPolicy';

export { buildCompanionView } from './companion-view/CompanionViewBuilder';
export { applyVisibilityFilter } from './companion-view/CompanionVisibilityFilter';
export { isSpoilerSafe, filterBySpoilerLevel } from './companion-view/CompanionSpoilerGuard';

// ── Assistant ─────────────────────────────────────────────────
export type {
  AssistantTrigger, AssistantIntent, AssistantResponseMode,
  AssistantPolicy, AssistantAskRequest, AssistantAskResult,
  AssistantInitialStateResult, RenderableAssistantAction,
  RenderableClueReference, RenderableBeliefReference,
  RenderableSettlement, AssistantUIHints, AssistantAuditSummary,
  AssistantResponse,
} from './assistant/AssistantTypes';

export { classifyIntent } from './assistant/IntentClassifier';
export { getPolicy } from './assistant/AssistantPolicyEngine';
export type { ActionDefinition } from './assistant/ActionRegistry';
export { ActionRegistryLoader } from './assistant/ActionRegistry';
export { planActions } from './assistant/ActionPlanner';
export type { LLMProvider, LLMGenerateInput, LLMGenerateResult, LLMMode } from './assistant/LLMProvider';
export { MockLLMProvider } from './assistant/MockLLMProvider';
export { DisabledLLMProvider } from './assistant/DisabledLLMProvider';
export {
  validateSchema, validateActions, validateClues,
  validateTone, validateAll,
} from './assistant/OutputValidator';
export type { ValidationResult } from './assistant/OutputValidator';
export { renderResponse } from './assistant/ResponseRenderer';
export { getFallbackTemplate } from './assistant/FallbackTemplateEngine';
export { AssistantController } from './assistant/index';

// ── Content ───────────────────────────────────────────────────
export { RuntimeContentLoader } from './content/RuntimeContentLoader';
export {
  validateContentPath, isAllowedContentDir, isAllowedExtension,
} from './content/ContentPathPolicy';

// ── Policy ────────────────────────────────────────────────────
export type { SpoilerPolicy, SpoilerPolicyRule } from './policy/SpoilerPolicy';
export { checkSpoilerAccess, filterBySpoilerPolicy } from './policy/SpoilerPolicy';
export type { ForbiddenRevealPolicy, ForbiddenRevealRule } from './policy/ForbiddenRevealPolicy';
export { isPermanentlyForbidden, filterForbiddenContent } from './policy/ForbiddenRevealPolicy';
