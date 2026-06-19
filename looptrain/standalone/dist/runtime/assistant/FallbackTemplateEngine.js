"use strict";
/**
 * FallbackTemplateEngine - deterministic templates when LLM is disabled.
 * Spec reference: Section 11.2 flow, Section 14.6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFallbackTemplate = getFallbackTemplate;
function getFallbackTemplate(intent, view) {
    const visibleText = getText(intent, view);
    return {
        mode: 'deterministic_template',
        visibleText,
        actionRefs: [],
        clueRefs: view.knowledge.confirmedClueIds.slice(0, 3),
        beliefRefs: view.belief.activeBeliefs.map((b) => b.beliefId).slice(0, 3),
        settlementRef: view.timeline.previousLoops.length > 0 ? 'latest_loop' : undefined,
        spoilerLevel: Math.min(view.policy.maxSpoilerLevel, 1),
        confidence: 'medium',
        stateEffects: [],
    };
}
function getText(intent, view) {
    const sceneLabel = view.scene.sceneLabel;
    const loopNum = view.run.loopCount;
    switch (intent) {
        case 'ASK_NEXT_ACTION':
            if (loopNum <= 0)
                return `欢迎来到${sceneLabel}。我是许知微，会协助你进行调查。你可以先观察周围环境，或者尝试与在场的人交谈。`;
            return `当前在${sceneLabel}。我建议你先观察环境，看看有什么值得注意的地方。`;
        case 'ASK_SCENE_EXPLAIN':
            return `${view.scene.sceneDescription}`;
        case 'ASK_CLUE_SUMMARY':
            if (view.knowledge.confirmedClueIds.length === 0)
                return '目前还没有确认的线索。建议先观察环境或与人交谈。';
            return '目前可以确认的是：我们掌握了一些线索。建议继续深入调查。';
        case 'ASK_LOOP_SUMMARY':
            if (view.timeline.previousLoops.length === 0)
                return '这是第一轮调查，还没有之前的记录可以回顾。';
            return '上一轮调查中，我们发现了一些情况。本轮可以尝试不同的调查方向。';
        case 'ASK_IDENTITY':
            return '我是许知微，你的调查助手。我们可以先从观察周围环境开始。';
        case 'ASK_TRUTH':
            return '我理解你的疑问。但目前确认的信息还不够充分。这还不是证据，但值得进一步确认。';
        case 'ASK_RULE':
            return '调查过程中，你可以观察环境、与人交谈、检查物品。注意每个行动都会消耗行动力。';
        case 'CASUAL_CHAT':
            return '我在这里。有什么我可以帮助你的吗？';
        case 'INVALID_OR_ATTACK':
            return '我只能在调查范围内提供帮助。让我们专注于眼前的调查吧。';
        default:
            return '我是许知微，你的调查助手。请告诉我你需要什么帮助。';
    }
}
