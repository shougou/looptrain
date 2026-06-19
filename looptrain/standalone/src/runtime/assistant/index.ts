/**
 * AssistantController - orchestrates the full assistant pipeline.
 * Flow: CompanionViewBuilder → IntentClassifier → PolicyEngine →
 *        ActionPlanner → FallbackTemplate → Validator → Renderer
 * Spec reference: Section 11.2
 */

import type { RuntimeClientState } from '../memory/RuntimeClientState';
import type { AssistantAskRequest, AssistantAskResult, AssistantInitialStateResult } from './AssistantTypes';
import { buildCompanionView } from '../companion-view/CompanionViewBuilder';
import { applyVisibilityFilter } from '../companion-view/CompanionVisibilityFilter';
import { classifyIntent } from './IntentClassifier';
import { getPolicy } from './AssistantPolicyEngine';
import { ActionRegistryLoader } from './ActionRegistry';
import { planActions } from './ActionPlanner';
import { getFallbackTemplate } from './FallbackTemplateEngine';
import { validateAll } from './OutputValidator';
import { renderResponse } from './ResponseRenderer';
import type { MemoryRuntime } from '../MemoryRuntime';

export class AssistantController {
  private actionRegistry: ActionRegistryLoader;
  private memoryRuntime?: MemoryRuntime;

  constructor(memoryRuntime?: MemoryRuntime) {
    this.actionRegistry = new ActionRegistryLoader();
    this.memoryRuntime = memoryRuntime;
  }

  async initialize(): Promise<void> {
    await this.actionRegistry.load();
  }

  async ask(request: AssistantAskRequest): Promise<AssistantAskResult> {
    const startTime = Date.now();

    try {
      const { clientState, trigger, playerText } = request;

      // 1. Build CompanionView
      const rawView = buildCompanionView(clientState, this.memoryRuntime);

      // 2. Apply visibility filter
      const view = applyVisibilityFilter(rawView, rawView.policy);

      // 3. Classify intent
      const intent = classifyIntent(trigger, playerText);

      // 4. Get policy
      const policy = getPolicy(
        clientState, view.run.loopCount,
        view.run.hasFirstContact, view.run.failureCount
      );

      // 5. Plan actions
      const actions = planActions(view, policy, intent, this.actionRegistry);

      // 6. Get fallback template
      const response = getFallbackTemplate(intent, view);

      // 7. Validate output
      const validation = validateAll(response, view);
      if (!validation.valid) {
        return this.buildErrorResult(view.run.loopCount);
      }

      // 8. Render response
      const processingTimeMs = Date.now() - startTime;
      return renderResponse(response, actions, view, processingTimeMs);
    } catch (error) {
      console.error('AssistantController.ask failed:', error);
      return this.buildErrorResult(0);
    }
  }

  getInitialState(clientState?: RuntimeClientState): AssistantInitialStateResult {
    let hasFirstContact = false;
    let loopCount = 0;

    if (this.memoryRuntime) {
      const uniqueLoopIds = new Set<string>();
      for (const ev of this.memoryRuntime.storage.events) {
        if (ev.loopId) uniqueLoopIds.add(ev.loopId);
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

  private buildErrorResult(_loopCount: number): AssistantAskResult {
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
