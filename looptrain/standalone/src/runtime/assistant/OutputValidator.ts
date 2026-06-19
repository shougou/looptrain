/**
 * OutputValidator - validates all assistant output before UI rendering.
 * Law 7: Output is untrusted until validated.
 * Spec reference: Sections 13.2-13.3
 */

import type { AssistantResponse } from './AssistantTypes';
import type { CompanionView } from '../companion-view/CompanionView';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSchema(response: AssistantResponse): ValidationResult {
  const errors: string[] = [];
  if (!response.mode) errors.push('Missing mode');
  if (typeof response.visibleText !== 'string') errors.push('visibleText must be string');
  if (!Array.isArray(response.actionRefs)) errors.push('actionRefs must be array');
  if (!Array.isArray(response.clueRefs)) errors.push('clueRefs must be array');
  if (!Array.isArray(response.beliefRefs)) errors.push('beliefRefs must be array');
  if (response.stateEffects.length !== 0) errors.push('stateEffects must be empty');
  return { valid: errors.length === 0, errors };
}

export function validateActions(
  response: AssistantResponse,
  view: CompanionView
): ValidationResult {
  const errors: string[] = [];
  for (const actionId of response.actionRefs) {
    if (!view.scene.availableActionIds.includes(actionId)) {
      errors.push(`Action ref not in view: ${actionId}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateClues(
  response: AssistantResponse,
  view: CompanionView
): ValidationResult {
  const errors: string[] = [];
  for (const clueId of response.clueRefs) {
    if (!view.knowledge.confirmedClueIds.includes(clueId)) {
      errors.push(`Clue ref not confirmed: ${clueId}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateTone(response: AssistantResponse): ValidationResult {
  const errors: string[] = [];
  const text = response.visibleText;
  const forbidden: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /你必须/, label: 'command tone: 你必须' },
    { pattern: /唯一正确/, label: 'absolute claim: 唯一正确' },
    { pattern: /正确答案是/, label: 'absolute claim: 正确答案是' },
    { pattern: /系统提示/, label: 'meta reference: 系统提示' },
    { pattern: /任务已自动完成/, label: 'auto-completion: 任务已自动完成' },
    { pattern: /真凶就是/, label: 'spoiler: 真凶就是' },
    { pattern: /直接去抓/, label: 'command: 直接去抓' },
  ];
  for (const { pattern, label } of forbidden) {
    if (pattern.test(text)) errors.push(`Forbidden tone: ${label}`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateAll(
  response: AssistantResponse,
  view: CompanionView
): ValidationResult {
  const allErrors: string[] = [];
  for (const result of [validateSchema(response), validateActions(response, view), validateClues(response, view), validateTone(response)]) {
    allErrors.push(...result.errors);
  }
  return { valid: allErrors.length === 0, errors: allErrors };
}
