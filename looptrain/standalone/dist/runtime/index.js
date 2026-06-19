"use strict";
/**
 * LoopTrain Runtime v0.6 - Public API
 * Slice 0: TypeScript Host + Deterministic Assistant Runtime Skeleton.
 * CommonJS module format. All exports are named (no default exports).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryProjector = exports.MemoryEventDraftAppender = exports.InMemoryMemoryStorage = exports.ProfileStore = exports.ArchiveStore = exports.TimelineStore = exports.RelationshipStore = exports.BeliefStore = exports.KnowledgeStore = exports.filterForbiddenContent = exports.isPermanentlyForbidden = exports.filterBySpoilerPolicy = exports.checkSpoilerAccess = exports.isAllowedExtension = exports.isAllowedContentDir = exports.validateContentPath = exports.RuntimeContentLoader = exports.AssistantController = exports.getFallbackTemplate = exports.renderResponse = exports.validateAll = exports.validateTone = exports.validateClues = exports.validateActions = exports.validateSchema = exports.DisabledLLMProvider = exports.MockLLMProvider = exports.planActions = exports.ActionRegistryLoader = exports.getPolicy = exports.classifyIntent = exports.filterBySpoilerLevel = exports.isSpoilerSafe = exports.applyVisibilityFilter = exports.buildCompanionView = exports.generateViewId = exports.generateSnapshotId = exports.generateEventId = exports.generateLoopId = exports.generateRunId = exports.generatePlayerId = exports.RuntimeId = exports.failure = exports.success = exports.DisabledProviderError = exports.ValidationError = exports.RuntimeError = exports.fromTimestamp = exports.toISOString = exports.nowISO = void 0;
exports.buildPromptContext = exports.applyReset = exports.planReset = exports.getResetPolicy = exports.validateMigration = exports.LegacyStandaloneStateMigrator = exports.MemoryRuntime = void 0;
var time_1 = require("./shared/time");
Object.defineProperty(exports, "nowISO", { enumerable: true, get: function () { return time_1.nowISO; } });
Object.defineProperty(exports, "toISOString", { enumerable: true, get: function () { return time_1.toISOString; } });
Object.defineProperty(exports, "fromTimestamp", { enumerable: true, get: function () { return time_1.fromTimestamp; } });
var errors_1 = require("./shared/errors");
Object.defineProperty(exports, "RuntimeError", { enumerable: true, get: function () { return errors_1.RuntimeError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_1.ValidationError; } });
Object.defineProperty(exports, "DisabledProviderError", { enumerable: true, get: function () { return errors_1.DisabledProviderError; } });
var result_1 = require("./shared/result");
Object.defineProperty(exports, "success", { enumerable: true, get: function () { return result_1.success; } });
Object.defineProperty(exports, "failure", { enumerable: true, get: function () { return result_1.failure; } });
// ── IDs ───────────────────────────────────────────────────────
var RuntimeId_1 = require("./ids/RuntimeId");
Object.defineProperty(exports, "RuntimeId", { enumerable: true, get: function () { return RuntimeId_1.RuntimeId; } });
var RuntimeIdGenerator_1 = require("./ids/RuntimeIdGenerator");
Object.defineProperty(exports, "generatePlayerId", { enumerable: true, get: function () { return RuntimeIdGenerator_1.generatePlayerId; } });
Object.defineProperty(exports, "generateRunId", { enumerable: true, get: function () { return RuntimeIdGenerator_1.generateRunId; } });
Object.defineProperty(exports, "generateLoopId", { enumerable: true, get: function () { return RuntimeIdGenerator_1.generateLoopId; } });
Object.defineProperty(exports, "generateEventId", { enumerable: true, get: function () { return RuntimeIdGenerator_1.generateEventId; } });
Object.defineProperty(exports, "generateSnapshotId", { enumerable: true, get: function () { return RuntimeIdGenerator_1.generateSnapshotId; } });
Object.defineProperty(exports, "generateViewId", { enumerable: true, get: function () { return RuntimeIdGenerator_1.generateViewId; } });
var CompanionViewBuilder_1 = require("./companion-view/CompanionViewBuilder");
Object.defineProperty(exports, "buildCompanionView", { enumerable: true, get: function () { return CompanionViewBuilder_1.buildCompanionView; } });
var CompanionVisibilityFilter_1 = require("./companion-view/CompanionVisibilityFilter");
Object.defineProperty(exports, "applyVisibilityFilter", { enumerable: true, get: function () { return CompanionVisibilityFilter_1.applyVisibilityFilter; } });
var CompanionSpoilerGuard_1 = require("./companion-view/CompanionSpoilerGuard");
Object.defineProperty(exports, "isSpoilerSafe", { enumerable: true, get: function () { return CompanionSpoilerGuard_1.isSpoilerSafe; } });
Object.defineProperty(exports, "filterBySpoilerLevel", { enumerable: true, get: function () { return CompanionSpoilerGuard_1.filterBySpoilerLevel; } });
var IntentClassifier_1 = require("./assistant/IntentClassifier");
Object.defineProperty(exports, "classifyIntent", { enumerable: true, get: function () { return IntentClassifier_1.classifyIntent; } });
var AssistantPolicyEngine_1 = require("./assistant/AssistantPolicyEngine");
Object.defineProperty(exports, "getPolicy", { enumerable: true, get: function () { return AssistantPolicyEngine_1.getPolicy; } });
var ActionRegistry_1 = require("./assistant/ActionRegistry");
Object.defineProperty(exports, "ActionRegistryLoader", { enumerable: true, get: function () { return ActionRegistry_1.ActionRegistryLoader; } });
var ActionPlanner_1 = require("./assistant/ActionPlanner");
Object.defineProperty(exports, "planActions", { enumerable: true, get: function () { return ActionPlanner_1.planActions; } });
var MockLLMProvider_1 = require("./assistant/MockLLMProvider");
Object.defineProperty(exports, "MockLLMProvider", { enumerable: true, get: function () { return MockLLMProvider_1.MockLLMProvider; } });
var DisabledLLMProvider_1 = require("./assistant/DisabledLLMProvider");
Object.defineProperty(exports, "DisabledLLMProvider", { enumerable: true, get: function () { return DisabledLLMProvider_1.DisabledLLMProvider; } });
var OutputValidator_1 = require("./assistant/OutputValidator");
Object.defineProperty(exports, "validateSchema", { enumerable: true, get: function () { return OutputValidator_1.validateSchema; } });
Object.defineProperty(exports, "validateActions", { enumerable: true, get: function () { return OutputValidator_1.validateActions; } });
Object.defineProperty(exports, "validateClues", { enumerable: true, get: function () { return OutputValidator_1.validateClues; } });
Object.defineProperty(exports, "validateTone", { enumerable: true, get: function () { return OutputValidator_1.validateTone; } });
Object.defineProperty(exports, "validateAll", { enumerable: true, get: function () { return OutputValidator_1.validateAll; } });
var ResponseRenderer_1 = require("./assistant/ResponseRenderer");
Object.defineProperty(exports, "renderResponse", { enumerable: true, get: function () { return ResponseRenderer_1.renderResponse; } });
var FallbackTemplateEngine_1 = require("./assistant/FallbackTemplateEngine");
Object.defineProperty(exports, "getFallbackTemplate", { enumerable: true, get: function () { return FallbackTemplateEngine_1.getFallbackTemplate; } });
var index_1 = require("./assistant/index");
Object.defineProperty(exports, "AssistantController", { enumerable: true, get: function () { return index_1.AssistantController; } });
// ── Content ───────────────────────────────────────────────────
var RuntimeContentLoader_1 = require("./content/RuntimeContentLoader");
Object.defineProperty(exports, "RuntimeContentLoader", { enumerable: true, get: function () { return RuntimeContentLoader_1.RuntimeContentLoader; } });
var ContentPathPolicy_1 = require("./content/ContentPathPolicy");
Object.defineProperty(exports, "validateContentPath", { enumerable: true, get: function () { return ContentPathPolicy_1.validateContentPath; } });
Object.defineProperty(exports, "isAllowedContentDir", { enumerable: true, get: function () { return ContentPathPolicy_1.isAllowedContentDir; } });
Object.defineProperty(exports, "isAllowedExtension", { enumerable: true, get: function () { return ContentPathPolicy_1.isAllowedExtension; } });
var SpoilerPolicy_1 = require("./policy/SpoilerPolicy");
Object.defineProperty(exports, "checkSpoilerAccess", { enumerable: true, get: function () { return SpoilerPolicy_1.checkSpoilerAccess; } });
Object.defineProperty(exports, "filterBySpoilerPolicy", { enumerable: true, get: function () { return SpoilerPolicy_1.filterBySpoilerPolicy; } });
var ForbiddenRevealPolicy_1 = require("./policy/ForbiddenRevealPolicy");
Object.defineProperty(exports, "isPermanentlyForbidden", { enumerable: true, get: function () { return ForbiddenRevealPolicy_1.isPermanentlyForbidden; } });
Object.defineProperty(exports, "filterForbiddenContent", { enumerable: true, get: function () { return ForbiddenRevealPolicy_1.filterForbiddenContent; } });
// Stores
var KnowledgeStore_1 = require("./knowledge/KnowledgeStore");
Object.defineProperty(exports, "KnowledgeStore", { enumerable: true, get: function () { return KnowledgeStore_1.KnowledgeStore; } });
var BeliefStore_1 = require("./belief/BeliefStore");
Object.defineProperty(exports, "BeliefStore", { enumerable: true, get: function () { return BeliefStore_1.BeliefStore; } });
var RelationshipStore_1 = require("./relationship/RelationshipStore");
Object.defineProperty(exports, "RelationshipStore", { enumerable: true, get: function () { return RelationshipStore_1.RelationshipStore; } });
var TimelineStore_1 = require("./timeline/TimelineStore");
Object.defineProperty(exports, "TimelineStore", { enumerable: true, get: function () { return TimelineStore_1.TimelineStore; } });
var ArchiveStore_1 = require("./archive/ArchiveStore");
Object.defineProperty(exports, "ArchiveStore", { enumerable: true, get: function () { return ArchiveStore_1.ArchiveStore; } });
var ProfileStore_1 = require("./profile/ProfileStore");
Object.defineProperty(exports, "ProfileStore", { enumerable: true, get: function () { return ProfileStore_1.ProfileStore; } });
// Storage
var InMemoryMemoryStorage_1 = require("./storage/InMemoryMemoryStorage");
Object.defineProperty(exports, "InMemoryMemoryStorage", { enumerable: true, get: function () { return InMemoryMemoryStorage_1.InMemoryMemoryStorage; } });
// Memory core
var MemoryEventDraftAppender_1 = require("./memory/MemoryEventDraftAppender");
Object.defineProperty(exports, "MemoryEventDraftAppender", { enumerable: true, get: function () { return MemoryEventDraftAppender_1.MemoryEventDraftAppender; } });
var MemoryProjector_1 = require("./memory/MemoryProjector");
Object.defineProperty(exports, "MemoryProjector", { enumerable: true, get: function () { return MemoryProjector_1.MemoryProjector; } });
// Runtime
var MemoryRuntime_1 = require("./MemoryRuntime");
Object.defineProperty(exports, "MemoryRuntime", { enumerable: true, get: function () { return MemoryRuntime_1.MemoryRuntime; } });
var LegacyStandaloneStateMigrator_1 = require("./migration/LegacyStandaloneStateMigrator");
Object.defineProperty(exports, "LegacyStandaloneStateMigrator", { enumerable: true, get: function () { return LegacyStandaloneStateMigrator_1.LegacyStandaloneStateMigrator; } });
var MigrationValidator_1 = require("./migration/MigrationValidator");
Object.defineProperty(exports, "validateMigration", { enumerable: true, get: function () { return MigrationValidator_1.validateMigration; } });
var ResetPolicy_1 = require("./reset/ResetPolicy");
Object.defineProperty(exports, "getResetPolicy", { enumerable: true, get: function () { return ResetPolicy_1.getResetPolicy; } });
var ResetPlanner_1 = require("./reset/ResetPlanner");
Object.defineProperty(exports, "planReset", { enumerable: true, get: function () { return ResetPlanner_1.planReset; } });
var ResetApplier_1 = require("./reset/ResetApplier");
Object.defineProperty(exports, "applyReset", { enumerable: true, get: function () { return ResetApplier_1.applyReset; } });
var PromptMemoryContextBuilder_1 = require("./prompt/PromptMemoryContextBuilder");
Object.defineProperty(exports, "buildPromptContext", { enumerable: true, get: function () { return PromptMemoryContextBuilder_1.buildPromptContext; } });
