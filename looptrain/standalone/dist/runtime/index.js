"use strict";
/**
 * LoopTrain Runtime v0.6 - Public API
 * Slice 0: TypeScript Host + Deterministic Assistant Runtime Skeleton.
 * CommonJS module format. All exports are named (no default exports).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterForbiddenContent = exports.isPermanentlyForbidden = exports.filterBySpoilerPolicy = exports.checkSpoilerAccess = exports.isAllowedExtension = exports.isAllowedContentDir = exports.validateContentPath = exports.RuntimeContentLoader = exports.AssistantController = exports.getFallbackTemplate = exports.renderResponse = exports.validateAll = exports.validateTone = exports.validateClues = exports.validateActions = exports.validateSchema = exports.DisabledLLMProvider = exports.MockLLMProvider = exports.planActions = exports.ActionRegistryLoader = exports.getPolicy = exports.classifyIntent = exports.filterBySpoilerLevel = exports.isSpoilerSafe = exports.applyVisibilityFilter = exports.buildCompanionView = exports.generateViewId = exports.generateSnapshotId = exports.generateEventId = exports.generateLoopId = exports.generateRunId = exports.generatePlayerId = exports.RuntimeId = exports.failure = exports.success = exports.DisabledProviderError = exports.ValidationError = exports.RuntimeError = exports.fromTimestamp = exports.toISOString = exports.nowISO = void 0;
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
