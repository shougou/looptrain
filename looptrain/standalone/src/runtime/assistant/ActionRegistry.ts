/**
 * ActionRegistry - defines and loads assistant-recommendable actions.
 * Content loaded from materials/runtime/assistant/action-definitions.json.
 * Spec reference: Section 12
 */

import type { AssistantPhase, SpoilerLevel } from '../companion-view/CompanionViewPolicy';
import { RuntimeContentLoader } from '../content/RuntimeContentLoader';

export interface ActionDefinition {
  actionId: string;
  type: 'dialogue' | 'observe' | 'move' | 'present_clue' | 'review' | 'wait';
  targetId?: string;
  label: string;
  inputTemplate: string;
  requiredSceneIds?: string[];
  requiredClueIds?: string[];
  requiredNpcVisibleIds?: string[];
  requiredLocationReachableIds?: string[];
  forbiddenFlags?: string[];
  phaseAllowed: AssistantPhase[];
  spoilerLevel: SpoilerLevel;
  riskLevel: 'low' | 'medium' | 'high';
  priorityBase: number;
  tags?: string[];
}

let _defaultActions: ActionDefinition[] | null = null;

function getDefaultActions(): ActionDefinition[] {
  if (_defaultActions) return _defaultActions;
  try {
    const loader = new RuntimeContentLoader();
    _defaultActions = loader.loadRuntimeJSON<ActionDefinition[]>('assistant/action-definitions.json');
  } catch (_) {
    _defaultActions = getHardcodedActions();
  }
  return _defaultActions;
}

function getHardcodedActions(): ActionDefinition[] {
  return [
    {
      actionId: 'observe_carriage', type: 'observe',
      label: '观察车厢', inputTemplate: '我仔细观察了二号车厢',
      requiredSceneIds: ['scene-carriage-03'],
      phaseAllowed: ['pre_contact', 'onboarding', 'guided', 'normal', 'minimal'],
      spoilerLevel: 0, riskLevel: 'low', priorityBase: 50,
      tags: ['observe', 'tutorial'],
    },
    {
      actionId: 'talk_xiaoning', type: 'dialogue',
      targetId: 'npc-xiaoning',
      label: '和小宁对话', inputTemplate: '我走过去和小宁搭话',
      requiredSceneIds: ['scene-carriage-03'],
      requiredNpcVisibleIds: ['npc-xiaoning'],
      phaseAllowed: ['pre_contact', 'onboarding', 'guided', 'normal', 'minimal'],
      spoilerLevel: 0, riskLevel: 'low', priorityBase: 60,
      tags: ['dialogue', 'tutorial'],
    },
    {
      actionId: 'check_seat', type: 'observe',
      label: '检查座位下方', inputTemplate: '我蹲下来检查座位下方',
      requiredSceneIds: ['scene-carriage-03'],
      phaseAllowed: ['guided', 'normal', 'minimal'],
      spoilerLevel: 1, riskLevel: 'low', priorityBase: 40,
      tags: ['observe', 'clue'],
    },
    {
      actionId: 'end_dialogue', type: 'wait',
      label: '结束对话', inputTemplate: '结束对话',
      phaseAllowed: ['onboarding', 'guided', 'normal', 'minimal'],
      spoilerLevel: 0, riskLevel: 'low', priorityBase: 20,
      tags: ['dialogue', 'control'],
    },
  ];
}

export class ActionRegistryLoader {
  private actions: ActionDefinition[] = [];

  async load(): Promise<void> {
    this.actions = getDefaultActions();
  }

  loadFromArray(actions: ActionDefinition[]): void {
    this.actions = actions;
  }

  getAll(): ActionDefinition[] {
    return this.actions;
  }

  getById(actionId: string): ActionDefinition | undefined {
    return this.actions.find((a) => a.actionId === actionId);
  }

  get count(): number {
    return this.actions.length;
  }
}
