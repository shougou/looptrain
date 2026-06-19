/**
 * ResponseRenderer - renders the final AssistantAskResult.
 * Spec reference: Section 13
 */

import type {
  AssistantResponse,
  AssistantAskResult,
  RenderableAssistantAction,
  RenderableClueReference,
  RenderableBeliefReference,
} from './AssistantTypes';
import type { CompanionView } from '../companion-view/CompanionView';

export function renderResponse(
  response: AssistantResponse,
  actions: RenderableAssistantAction[],
  view: CompanionView,
  processingTimeMs: number
): AssistantAskResult {
  const clueReferences: RenderableClueReference[] = response.clueRefs.map((clueId) => ({
    clueId,
    label: `线索: ${clueId}`,
    description: `已确认线索 ${clueId}`,
  }));

  const beliefReferences: RenderableBeliefReference[] = response.beliefRefs.map(
    (beliefId) => ({
      beliefId,
      summary: `推断: ${beliefId}`,
      confidence: response.confidence,
    })
  );

  return {
    responseId: `resp_${Date.now()}`,
    mode: response.mode,
    assistant: { id: 'xu_zhiwei', displayName: '许知微' },
    visibleText: response.visibleText,
    recommendedActions: actions,
    clueReferences,
    beliefReferences,
    settlement: response.settlementRef
      ? { settlementId: response.settlementRef, summary: '结算结果', outcome: '已完成', type: 'loop' }
      : undefined,
    ui: {
      emphasis: 'normal',
      suggestedPanelState: 'expanded',
      showClueReferences: clueReferences.length > 0,
      showBeliefReferences: beliefReferences.length > 0,
    },
    audit: {
      intent: 'ASK_NEXT_ACTION',
      policyPhase: view.policy.assistantPhase,
      guidanceLevel: view.policy.guidanceLevel,
      templateUsed: response.mode,
      llmUsed: response.mode === 'llm_generated',
      validatorPassed: true,
      spoilerCheckPassed: true,
      actionsRecommended: actions.length,
      processingTimeMs,
    },
  };
}
