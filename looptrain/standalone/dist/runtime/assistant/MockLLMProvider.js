"use strict";
/**
 * MockLLMProvider - template-based LLM responses for testing.
 * Used when LT_LLM_PROVIDER=mock.
 * Spec reference: Section 14.6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockLLMProvider = void 0;
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
        switch (mode) {
            case 'awakening_first_contact':
                return '我是许知微，你的调查助手。我会尽力协助你。';
            case 'assistant_advice':
                return '我建议你先仔细观察周围的环境。';
            case 'scene_explain':
                return '这里是第七节车厢，目前有几位乘客在场。';
            case 'clue_summary':
                return '根据目前掌握的线索，我们可以确认一些事实。';
            case 'dialogue_settlement':
                return '对话已结束，我们可以回顾一下获取的信息。';
            case 'loop_settlement':
                return '本轮已经结束。回顾一下，我们有一些收获。';
            case 'anti_spoiler':
                return '我理解你的疑问，但目前还不能确认这一点。';
            case 'casual_chat':
                return '我在这里。有什么我可以帮助你的吗？';
            default:
                return '我是许知微。请告诉我你需要什么帮助。';
        }
    }
}
exports.MockLLMProvider = MockLLMProvider;
