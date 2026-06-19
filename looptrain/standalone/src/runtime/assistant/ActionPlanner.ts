/**
 * ActionPlanner - selects and scores recommended actions.
 * Filter/scoring rules from spec Sections 12.3-12.4.
 */

import type { CompanionView } from '../companion-view/CompanionView';
import type { AssistantPolicy, AssistantIntent, RenderableAssistantAction } from './AssistantTypes';
import type { ActionDefinition, ActionRegistryLoader } from './ActionRegistry';

export function planActions(
  view: CompanionView,
  policy: AssistantPolicy,
  intent: AssistantIntent,
  registry: ActionRegistryLoader
): RenderableAssistantAction[] {
  if (!policy.canRecommendActions) return [];

  const allActions = registry.getAll();
  const eligible = allActions.filter((a) => isEligible(a, view, policy));
  const scored = eligible.map((a) => ({ action: a, score: calcScore(a, view, intent) }));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, policy.maxActionCount).map(({ action }) => ({
    actionId: action.actionId,
    label: action.label,
    inputTemplate: action.inputTemplate,
    type: action.type,
    riskLevel: action.riskLevel,
  }));
}

function isEligible(
  action: ActionDefinition,
  view: CompanionView,
  policy: AssistantPolicy
): boolean {
  if (!action.phaseAllowed.includes(policy.assistantPhase)) return false;
  if (action.spoilerLevel > policy.maxSpoilerLevel) return false;
  if (action.requiredSceneIds?.length && !action.requiredSceneIds.includes(view.scene.sceneId)) return false;
  if (action.requiredClueIds?.length && !action.requiredClueIds.every((cid) => view.knowledge.confirmedClueIds.includes(cid))) return false;
  if (action.requiredNpcVisibleIds?.length && !action.requiredNpcVisibleIds.every((nid) => view.scene.visibleNpcIds.includes(nid))) return false;
  if (action.requiredLocationReachableIds?.length && !action.requiredLocationReachableIds.every((lid) => view.scene.reachableLocationIds.includes(lid))) return false;
  return true;
}

function calcScore(
  action: ActionDefinition,
  view: CompanionView,
  intent: AssistantIntent
): number {
  let score = action.priorityBase;
  if (intent === 'ASK_NEXT_ACTION' && action.tags?.includes('tutorial')) score += 25;
  if (intent === 'ASK_NEXT_ACTION' && action.type === 'dialogue') score += 20;
  if (intent === 'ASK_CLUE_SUMMARY' && action.type === 'observe') score += 20;
  if (action.riskLevel === 'high') score -= 20;

  if (action.requiredClueIds?.length && action.requiredClueIds.every((cid) => view.knowledge.confirmedClueIds.includes(cid))) {
    score += 20;
  }

  if (action.type === 'dialogue' && view.scene.visibleNpcIds.length > 0) {
    score += 15;
  }

  return score;
}
