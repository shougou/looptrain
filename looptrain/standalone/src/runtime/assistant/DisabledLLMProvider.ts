/**
 * DisabledLLMProvider - returns finishReason:'disabled'.
 * When LT_LLM_PROVIDER=disabled, uses FallbackTemplateEngine only.
 * Spec reference: Section 14.6
 */

import type { LLMProvider, LLMGenerateInput, LLMGenerateResult } from './LLMProvider';

export class DisabledLLMProvider implements LLMProvider {
  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
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
