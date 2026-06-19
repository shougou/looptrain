'use strict';

export {};

const assert = require('assert');
const runtime = require('..');

// ── Module Load ────────────────────────────────────────────
assert.ok(runtime, 'runtime module must load');
assert.ok(typeof runtime.AssistantController === 'function', 'AssistantController must be a class');

// ── ID Generation ──────────────────────────────────────────
const playerId = runtime.generatePlayerId();
assert.ok(playerId.startsWith('player_'), 'playerId must start with player_');
const runId = runtime.generateRunId();
assert.ok(runId.startsWith('run_'), 'runId must start with run_');

// ── CompanionView ───────────────────────────────────────────
const view = runtime.buildCompanionView({
  playerId: 'player_test', runId: 'run_test', chapterId: 'chapter-01',
  episodeId: 'trial-001', loopId: 'loop_0001_test', sceneId: 'scene-carriage-03',
  snapshotId: null, lastEventId: null, eventSeq: 0, eventsSinceSnapshot: [],
});
assert.ok(view.viewId, 'CompanionView must have viewId');
assert.strictEqual(view.schemaVersion, 1, 'schemaVersion must be 1');
assert.strictEqual(view.policy.hiddenTruthAccessible, false, 'hiddenTruthAccessible must be false');

// ── IntentClassifier ───────────────────────────────────────
assert.strictEqual(
  runtime.classifyIntent('ASK_ASSISTANT_BUTTON'),
  'ASK_NEXT_ACTION', 'empty button click must classify as ASK_NEXT_ACTION'
);
assert.strictEqual(
  runtime.classifyIntent('ASK_ASSISTANT_BUTTON', '真凶是他'),
  'ASK_TRUTH', 'truth-seeking text must classify as ASK_TRUTH'
);

// ── FallbackTemplateEngine ──────────────────────────────────
const template = runtime.getFallbackTemplate('ASK_NEXT_ACTION', view);
assert.ok(template && template.visibleText && template.visibleText.length > 0, 'fallback template must return non-empty text');

// ── OutputValidator ─────────────────────────────────────────
const mockResponse = function (text: string) { return { mode: 'deterministic_template' as const, visibleText: text, actionRefs: [] as string[], clueRefs: [] as string[], beliefRefs: [] as string[], spoilerLevel: 0 as const, confidence: 'medium' as const, stateEffects: [] }; };
const validTone = runtime.validateTone(mockResponse('你可以先检查一下周围'));
assert.strictEqual(validTone.valid, true, 'valid tone must pass');
const invalidTone = runtime.validateTone(mockResponse('你必须这样做，这是唯一正确的答案'));
assert.strictEqual(invalidTone.valid, false, 'forbidden tone must be rejected');

// ── AssistantController ─────────────────────────────────────
const cc = new runtime.AssistantController();
assert.ok(typeof cc.ask === 'function', 'AssistantController must have ask method');
const initialState = cc.getInitialState();
assert.strictEqual(initialState.buttonVisible, true);
assert.strictEqual(initialState.buttonLabel, '询问助手');

// ── ID format validation ────────────────────────────────────
const id = new runtime.RuntimeId('player-abc123');
assert.strictEqual(id.value, 'player-abc123');
assert.throws(() => new runtime.RuntimeId('Player_ABC'), /Invalid RuntimeId/, 'uppercase ID must throw');

// ── End-to-end Assistant ask ────────────────────────────────
const clientState = {
  playerId: 'player_test', runId: 'run_test', chapterId: 'chapter-01',
  episodeId: 'trial-001', loopId: 'loop_0001_test', sceneId: 'scene-carriage-03',
  snapshotId: null, lastEventId: null, eventSeq: 0, eventsSinceSnapshot: [],
};
cc.ask({
  clientState, trigger: 'ASK_ASSISTANT_BUTTON',
  locale: 'zh-CN', clientNow: new Date().toISOString(),
}).then(function (askResult: Record<string, unknown>) {
  assert.ok(askResult.responseId, 'ask response must have responseId');
  assert.ok(askResult.mode, 'ask response must have mode');
  assert.ok(askResult.assistant, 'ask response must have assistant');
  console.log('Slice 0 verification OK');
}).catch(function (err: Error) {
  console.error('FAIL:', err.message);
  process.exitCode = 1;
});
