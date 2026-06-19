/**
 * IntentClassifier - classifies player input into an AssistantIntent.
 * Rules priority from spec Section 11.4.
 */

import type { AssistantTrigger, AssistantIntent } from './AssistantTypes';

export function classifyIntent(
  trigger: AssistantTrigger,
  playerText?: string
): AssistantIntent {
  if (trigger === 'ASK_ASSISTANT_BUTTON' && (!playerText || playerText.trim() === '')) {
    return 'ASK_NEXT_ACTION';
  }

  if (trigger === 'LOOP_STARTED') return 'ASK_NEXT_ACTION';
  if (trigger === 'DIALOGUE_SETTLEMENT') return 'ASK_CLUE_SUMMARY';
  if (trigger === 'LOOP_SETTLEMENT') return 'ASK_LOOP_SUMMARY';
  if (trigger === 'NEW_CLUE_ACQUIRED') return 'ASK_CLUE_SUMMARY';
  if (trigger === 'PLAYER_STALLED') return 'ASK_NEXT_ACTION';

  if (!playerText || playerText.trim() === '') {
    return 'ASK_NEXT_ACTION';
  }

  const text = playerText.trim();

  if (isPromptInjection(text)) return 'INVALID_OR_ATTACK';
  if (isTruthSeeking(text)) return 'ASK_TRUTH';
  if (/我该[怎如].*[办做]/.test(text) || /下一步/.test(text) || /接下来/.test(text)) return 'ASK_NEXT_ACTION';
  if (/这里是[哪哪]/.test(text) || /这是[哪哪]/.test(text) || /现在在[哪哪]/.test(text)) return 'ASK_SCENE_EXPLAIN';
  if (/知道.*什么/.test(text) || /有什么.*线索/.test(text) || /掌握了.*什么/.test(text)) return 'ASK_CLUE_SUMMARY';
  if ((/上一轮/.test(text) && /失败/.test(text)) || /为什么.*失败/.test(text)) return 'ASK_LOOP_SUMMARY';
  if (/你是谁/.test(text) || /我是谁/.test(text) || /你的身份/.test(text)) return 'ASK_IDENTITY';

  return 'CASUAL_CHAT';
}

function isPromptInjection(text: string): boolean {
  const patterns = [
    /ignore.*instruction/i, /system.*prompt/i, /you are now/i,
    /扮演.*角色/i, /pretend/i, /forget.*previous/i,
    /new.*persona/i, /\[.*system.*\]/i, /<.*system.*>/i,
  ];
  return patterns.some((p) => p.test(text));
}

function isTruthSeeking(text: string): boolean {
  const patterns = [
    /凶手.*是谁/, /真凶/, /真相/, /答案/,
    /谁是.*凶手/, /到底.*谁/, /最终.*结局/,
  ];
  return patterns.some((p) => p.test(text));
}
