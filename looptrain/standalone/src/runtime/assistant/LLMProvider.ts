/**
 * LLMProvider interface and associated types.
 *
 * The LLM Expression Layer only controls visibleText wording.
 * LLM MUST NOT modify: actionRefs, clueRefs, beliefRefs, settlementRef,
 * spoilerLevel, stateEffects, recommendedActions, facts, outcomes.
 *
 * Spec reference: Section 14
 */

// ── LLM Mode ──────────────────────────────────────────────────

export type LLMMode =
  | 'awakening_first_contact'
  | 'assistant_advice'
  | 'scene_explain'
  | 'clue_summary'
  | 'dialogue_settlement'
  | 'loop_settlement'
  | 'anti_spoiler'
  | 'casual_chat';

// ── LLM Generate Input ────────────────────────────────────────

export interface LLMGenerateInput {
  requestId: string;
  provider: 'deepseek' | 'mock' | 'disabled';
  model: string;

  mode: LLMMode;

  systemPrompt: string;
  userPrompt: string;

  schemaName: 'AssistantResponse';
  temperature: number;
  maxTokens: number;
  timeoutMs: number;

  metadata: {
    playerId: string;
    runId: string;
    loopId: string;
    chapterId: string;
    episodeId: string;
    sceneId: string;
    viewId: string;
  };
}

// ── LLM Generate Result ───────────────────────────────────────

export interface LLMGenerateResult {
  requestId: string;
  provider: 'deepseek' | 'mock' | 'disabled';
  model: string;

  rawText: string;
  parsedJson: unknown | null;

  finishReason:
    | 'stop'
    | 'length'
    | 'timeout'
    | 'error'
    | 'disabled';

  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };

  latencyMs: number;

  error?: {
    code: string;
    message: string;
  };
}

// ── LLM Provider Interface ────────────────────────────────────

export interface LLMProvider {
  generate(input: LLMGenerateInput): Promise<LLMGenerateResult>;
}
