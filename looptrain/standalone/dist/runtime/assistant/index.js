"use strict";
/**
 * AssistantController - orchestrates the full assistant pipeline.
 * Flow: CompanionViewBuilder → IntentClassifier → PolicyEngine →
 *        ActionPlanner → FallbackTemplate → Validator → Renderer
 * Spec reference: Section 11.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssistantController = void 0;
const CompanionViewBuilder_1 = require("../companion-view/CompanionViewBuilder");
const CompanionVisibilityFilter_1 = require("../companion-view/CompanionVisibilityFilter");
const IntentClassifier_1 = require("./IntentClassifier");
const AssistantPolicyEngine_1 = require("./AssistantPolicyEngine");
const ActionRegistry_1 = require("./ActionRegistry");
const ActionPlanner_1 = require("./ActionPlanner");
const FallbackTemplateEngine_1 = require("./FallbackTemplateEngine");
const OutputValidator_1 = require("./OutputValidator");
const ResponseRenderer_1 = require("./ResponseRenderer");
class AssistantController {
    constructor(memoryRuntime) {
        this.actionRegistry = new ActionRegistry_1.ActionRegistryLoader();
        this.memoryRuntime = memoryRuntime;
    }
    async initialize() {
        await this.actionRegistry.load();
    }
    async ask(request) {
        const startTime = Date.now();
        try {
            const { clientState, trigger, playerText } = request;
            // 1. Build CompanionView
            const rawView = (0, CompanionViewBuilder_1.buildCompanionView)(clientState, this.memoryRuntime);
            // 2. Apply visibility filter
            const view = (0, CompanionVisibilityFilter_1.applyVisibilityFilter)(rawView, rawView.policy);
            // 3. Classify intent
            const intent = (0, IntentClassifier_1.classifyIntent)(trigger, playerText);
            // 4. Get policy
            const policy = (0, AssistantPolicyEngine_1.getPolicy)(clientState, view.run.loopCount, view.run.hasFirstContact, view.run.failureCount);
            // 5. Plan actions
            const actions = (0, ActionPlanner_1.planActions)(view, policy, intent, this.actionRegistry);
            // 6. Get fallback template
            const response = (0, FallbackTemplateEngine_1.getFallbackTemplate)(intent, view);
            // 7. Validate output
            const validation = (0, OutputValidator_1.validateAll)(response, view);
            if (!validation.valid) {
                return this.buildErrorResult(view.run.loopCount);
            }
            // 8. Render response
            const processingTimeMs = Date.now() - startTime;
            return (0, ResponseRenderer_1.renderResponse)(response, actions, view, processingTimeMs);
        }
        catch (error) {
            console.error('AssistantController.ask failed:', error);
            return this.buildErrorResult(0);
        }
    }
    getInitialState(clientState) {
        let hasFirstContact = false;
        let loopCount = 0;
        if (this.memoryRuntime) {
            const uniqueLoopIds = new Set();
            for (const ev of this.memoryRuntime.storage.events) {
                if (ev.loopId)
                    uniqueLoopIds.add(ev.loopId);
            }
            loopCount = uniqueLoopIds.size || 0;
            hasFirstContact = loopCount > 0;
        }
        const isPreContact = !hasFirstContact && loopCount === 0;
        return {
            buttonVisible: true,
            buttonLabel: '询问助手',
            buttonEmphasis: isPreContact ? 'high' : 'normal',
            assistantKnownToPlayer: hasFirstContact,
            firstContactAvailable: isPreContact,
        };
    }
    buildErrorResult(_loopCount) {
        return {
            responseId: `resp_err_${Date.now()}`,
            mode: 'fallback_silent',
            assistant: { id: 'xu_zhiwei', displayName: '许知微' },
            visibleText: '抱歉，处理请求时出现了问题。请稍后再试。',
            recommendedActions: [],
            clueReferences: [],
            beliefReferences: [],
            ui: {
                emphasis: 'low', suggestedPanelState: 'collapsed',
                showClueReferences: false, showBeliefReferences: false,
            },
            audit: {
                intent: 'CASUAL_CHAT', policyPhase: 'normal', guidanceLevel: 1,
                templateUsed: 'error', llmUsed: false, validatorPassed: false,
                spoilerCheckPassed: false, actionsRecommended: 0, processingTimeMs: 0,
            },
        };
    }
}
exports.AssistantController = AssistantController;
