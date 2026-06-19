"use strict";
/**
 * DisabledLLMProvider - returns finishReason:'disabled'.
 * When LT_LLM_PROVIDER=disabled, uses FallbackTemplateEngine only.
 * Spec reference: Section 14.6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisabledLLMProvider = void 0;
class DisabledLLMProvider {
    async generate(input) {
        return {
            requestId: input.requestId,
            provider: 'disabled',
            model: input.model,
            rawText: '',
            parsedJson: null,
            finishReason: 'disabled',
            latencyMs: 0,
            error: {
                code: 'LLM_DISABLED',
                message: 'LLM provider is disabled. Using fallback templates.',
            },
        };
    }
}
exports.DisabledLLMProvider = DisabledLLMProvider;
