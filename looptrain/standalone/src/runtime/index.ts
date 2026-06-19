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

// ── v0.6.0 Narrative State Runtime Core ─────────────────────────
// Record types
export type { Knowledge } from './knowledge/Knowledge';
export type { Belief } from './belief/Belief';
export type { Relationship } from './relationship/Relationship';
export type { Timeline } from './timeline/Timeline';
export type { Archive } from './archive/Archive';
export type { Profile } from './profile/Profile';
export type { Snapshot } from './snapshot/Snapshot';

// Stores
export { KnowledgeStore } from './knowledge/KnowledgeStore';
export { BeliefStore } from './belief/BeliefStore';
export { RelationshipStore } from './relationship/RelationshipStore';
export { TimelineStore } from './timeline/TimelineStore';
export { ArchiveStore } from './archive/ArchiveStore';
export { ProfileStore } from './profile/ProfileStore';

// Storage
export { InMemoryMemoryStorage } from './storage/InMemoryMemoryStorage';

// Memory core
export { MemoryEventDraftAppender } from './memory/MemoryEventDraftAppender';
export { MemoryProjector } from './memory/MemoryProjector';
export type { ProjectedLayers } from './memory/MemoryProjector';

// Runtime
export { MemoryRuntime } from './MemoryRuntime';
export type { RuntimeState } from './MemoryRuntime';

// Migration
export type { LegacyStandaloneState } from './migration/LegacyStandaloneState';
export { LegacyStandaloneStateMigrator } from './migration/LegacyStandaloneStateMigrator';
export { validateMigration } from './migration/MigrationValidator';
export type { MigrationValidationResult } from './migration/MigrationValidator';

// Reset
export type { ResetPolicy } from './reset/ResetPolicy';
export { getResetPolicy } from './reset/ResetPolicy';
export type { ResetPlan } from './reset/ResetPlanner';
export { planReset } from './reset/ResetPlanner';
export { applyReset } from './reset/ResetApplier';

// Prompt context
export type {
  PromptMemoryContext,
  PromptKnowledgeItem,
  PromptTimelineItem,
  PromptBeliefItem,
} from './prompt/PromptMemoryContext';
export { buildPromptContext } from './prompt/PromptMemoryContextBuilder';
