"use strict";
/**
 * MockLLMProvider - template-based LLM responses for testing.
 * Content loaded from materials/runtime/assistant/mock-responses.json.
 * Used when LT_LLM_PROVIDER=mock.
 * Spec reference: Section 14.6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockLLMProvider = void 0;
const RuntimeContentLoader_1 = require("../content/RuntimeContentLoader");
let _responses = null;
function getResponses() {
    if (_responses)
        return _responses;
    try {
        const loader = new RuntimeContentLoader_1.RuntimeContentLoader();
        _responses = loader.loadRuntimeJSON('assistant/mock-responses.json');
    }
    catch (_) {
        _responses = getHardcodedResponses();
    }
    return _responses;
}
function getHardcodedResponses() {
    return {
        awakening_first_contact: '我是许知微，你的调查助手。我会尽力协助你。',
        assistant_advice: '我建议你先仔细观察周围的环境。',
        scene_explain: '这里是第七节车厢，目前有几位乘客在场。',
        clue_summary: '根据目前掌握的线索，我们可以确认一些事实。',
        dialogue_settlement: '对话已结束，我们可以回顾一下获取的信息。',
        loop_settlement: '本轮已经结束。回顾一下，我们有一些收获。',
        anti_spoiler: '我理解你的疑问，但目前还不能确认这一点。',
        casual_chat: '我在这里。有什么我可以帮助你的吗？',
        default: '我是许知微。请告诉我你需要什么帮助。',
    };
}
class MockLLMProvider {
    async generate(input) {
        const startTime = Date.now();
        const mockText = this.getMockText(input.mode);
        const latencyMs = Date.now() - startTime;
        return {
            requestId: input.requestId,
            provider: 'mock',
            model: input.model,
            rawText: mockText,
            parsedJson: null,
            finishReason: 'stop',
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            latencyMs,
        };
    }
    getMockText(mode) {
        const responses = getResponses();
        return responses[mode] || responses['default'] || '我是许知微。请告诉我你需要什么帮助。';
    }
}
exports.MockLLMProvider = MockLLMProvider;
