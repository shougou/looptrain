"use strict";
/**
 * ActionRegistry - defines and loads assistant-recommendable actions.
 * Content loaded from materials/runtime/assistant/action-definitions.json.
 * Spec reference: Section 12
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionRegistryLoader = void 0;
const RuntimeContentLoader_1 = require("../content/RuntimeContentLoader");
let _defaultActions = null;
function getDefaultActions() {
    if (_defaultActions)
        return _defaultActions;
    try {
        const loader = new RuntimeContentLoader_1.RuntimeContentLoader();
        _defaultActions = loader.loadRuntimeJSON('assistant/action-definitions.json');
    }
    catch (_) {
        _defaultActions = getHardcodedActions();
    }
    return _defaultActions;
}
function getHardcodedActions() {
    return [
        {
            actionId: 'observe_carriage', type: 'observe',
            label: '观察车厢', inputTemplate: '我仔细观察了第七节车厢',
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
class ActionRegistryLoader {
    constructor() {
        this.actions = [];
    }
    async load() {
        this.actions = getDefaultActions();
    }
    loadFromArray(actions) {
        this.actions = actions;
    }
    getAll() {
        return this.actions;
    }
    getById(actionId) {
        return this.actions.find((a) => a.actionId === actionId);
    }
    get count() {
        return this.actions.length;
    }
}
exports.ActionRegistryLoader = ActionRegistryLoader;
