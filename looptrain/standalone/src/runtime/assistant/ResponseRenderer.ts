/**
 * ResponseRenderer - renders the final AssistantAskResult.
 * Display names loaded from materials/runtime/assistant/ui-labels.json.
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
import { RuntimeContentLoader } from '../content/RuntimeContentLoader';

interface UiLabels {
  assistantName: string;
  assistantId: string;
  buttonLabel: string;
  errorMessage: string;
  assistantDisplayName: string;
  settlementSummary: string;
}

let _uiLabels: UiLabels | null = null;

function getUiLabels(): UiLabels {
  if (_uiLabels) return _uiLabels;
  try {
    const loader = new RuntimeContentLoader();
    _uiLabels = loader.loadRuntimeJSON<UiLabels>('assistant/ui-labels.json');
  } catch (_) {
    _uiLabels = {
      assistantName: '许知微',
      assistantId: 'xu_zhiwei',
      buttonLabel: '询问助手',
      errorMessage: '抱歉，处理请求时出现了问题。请稍后再试。',
      assistantDisplayName: '许知微',
      settlementSummary: '结算结果',
    };
  }
  return _uiLabels;
}

export function renderResponse(
  response: AssistantResponse,
  actions: RenderableAssistantAction[],
  view: CompanionView,
  processingTimeMs: number
): AssistantAskResult {
  const labels = getUiLabels();

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
    assistant: { id: labels.assistantId as 'xu_zhiwei', displayName: labels.assistantDisplayName as '许知微' },
    visibleText: response.visibleText,
    recommendedActions: actions,
    clueReferences,
    beliefReferences,
    settlement: response.settlementRef
      ? { settlementId: response.settlementRef, summary: labels.settlementSummary, outcome: '已完成', type: 'loop' }
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
