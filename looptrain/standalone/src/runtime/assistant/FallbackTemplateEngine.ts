/**
 * FallbackTemplateEngine - deterministic templates when LLM is disabled.
 * Content loaded from materials/runtime/assistant/fallback-templates.json.
 * Spec reference: Section 11.2 flow, Section 14.6
 */

import type { AssistantIntent, AssistantResponse } from './AssistantTypes';
import type { CompanionView } from '../companion-view/CompanionView';
import { RuntimeContentLoader } from '../content/RuntimeContentLoader';

interface FallbackTemplates {
  ASK_NEXT_ACTION: { first_contact: string; default: string };
  ASK_SCENE_EXPLAIN: string;
  ASK_CLUE_SUMMARY: { no_clues: string; default: string };
  ASK_LOOP_SUMMARY: { first_loop: string; default: string };
  ASK_IDENTITY: string;
  ASK_TRUTH: string;
  ASK_RULE: string;
  CASUAL_CHAT: string;
  INVALID_OR_ATTACK: string;
  default: string;
}

let _templates: FallbackTemplates | null = null;

function getTemplates(): FallbackTemplates {
  if (_templates) return _templates;
  try {
    const loader = new RuntimeContentLoader();
    _templates = loader.loadRuntimeJSON<FallbackTemplates>('assistant/fallback-templates.json');
  } catch (_) {
    _templates = getHardcodedTemplates();
  }
  return _templates;
}

function getHardcodedTemplates(): FallbackTemplates {
  return {
    ASK_NEXT_ACTION: {
      first_contact: '欢迎来到${sceneLabel}。我是许知微，会协助你进行调查。你可以先观察周围环境，或者尝试与在场的人交谈。',
      default: '当前在${sceneLabel}。我建议你先观察环境，看看有什么值得注意的地方。',
    },
    ASK_SCENE_EXPLAIN: '${sceneDescription}',
    ASK_CLUE_SUMMARY: {
      no_clues: '目前还没有确认的线索。建议先观察环境或与人交谈。',
      default: '目前可以确认的是：我们掌握了一些线索。建议继续深入调查。',
    },
    ASK_LOOP_SUMMARY: {
      first_loop: '这是第一轮调查，还没有之前的记录可以回顾。',
      default: '上一轮调查中，我们发现了一些情况。本轮可以尝试不同的调查方向。',
    },
    ASK_IDENTITY: '我是许知微，你的调查助手。我们可以先从观察周围环境开始。',
    ASK_TRUTH: '我理解你的疑问。但目前确认的信息还不够充分。这还不是证据，但值得进一步确认。',
    ASK_RULE: '调查过程中，你可以观察环境、与人交谈、检查物品。注意每个行动都会消耗行动力。',
    CASUAL_CHAT: '我在这里。有什么我可以帮助你的吗？',
    INVALID_OR_ATTACK: '我只能在调查范围内提供帮助。让我们专注于眼前的调查吧。',
    default: '我是许知微，你的调查助手。请告诉我你需要什么帮助。',
  };
}

export function getFallbackTemplate(
  intent: AssistantIntent,
  view: CompanionView
): AssistantResponse {
  const visibleText = getText(intent, view);

  return {
    mode: 'deterministic_template',
    visibleText,
    actionRefs: [],
    clueRefs: view.knowledge.confirmedClueIds.slice(0, 3),
    beliefRefs: view.belief.activeBeliefs.map((b) => b.beliefId).slice(0, 3),
    settlementRef: view.timeline.previousLoops.length > 0 ? 'latest_loop' : undefined,
    spoilerLevel: Math.min(view.policy.maxSpoilerLevel, 1) as AssistantResponse['spoilerLevel'],
    confidence: 'medium',
    stateEffects: [],
  };
}

function getText(intent: AssistantIntent, view: CompanionView): string {
  const templates = getTemplates();
  const sceneLabel = view.scene.sceneLabel;
  const loopNum = view.run.loopCount;

  switch (intent) {
    case 'ASK_NEXT_ACTION': {
      const t = templates.ASK_NEXT_ACTION;
      const tmpl = (loopNum <= 0 ? t.first_contact : t.default);
      return interpolate(tmpl, { sceneLabel });
    }
    case 'ASK_SCENE_EXPLAIN':
      return interpolate(String(templates.ASK_SCENE_EXPLAIN), { sceneDescription: view.scene.sceneDescription });
    case 'ASK_CLUE_SUMMARY': {
      const t = templates.ASK_CLUE_SUMMARY;
      return view.knowledge.confirmedClueIds.length === 0 ? t.no_clues : t.default;
    }
    case 'ASK_LOOP_SUMMARY': {
      const t = templates.ASK_LOOP_SUMMARY;
      return view.timeline.previousLoops.length === 0 ? t.first_loop : t.default;
    }
    case 'ASK_IDENTITY':
      return String(templates.ASK_IDENTITY);
    case 'ASK_TRUTH':
      return String(templates.ASK_TRUTH);
    case 'ASK_RULE':
      return String(templates.ASK_RULE);
    case 'CASUAL_CHAT':
      return String(templates.CASUAL_CHAT);
    case 'INVALID_OR_ATTACK':
      return String(templates.INVALID_OR_ATTACK);
    default:
      return String(templates.default);
  }
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\$\{(\w+)\}/g, (_: string, key: string) => vars[key] || '');
}
