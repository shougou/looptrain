const assert = require('assert');
const { generateHint, getStageTransitionMessage } = require('../public/assistant-hint');

console.log('Running AssistantHint tests...');

var introHint = generateHint({ loop: 1, history: [] }, 'intro');
assert.ok(introHint.text, 'Intro hint should have text');
assert.ok(introHint.recommendedActions.length > 0, 'Intro hint should have recommended actions');
assert.strictEqual(introHint.recommendedActions[0], '观察当前车厢', 'First action should be observe');

var obsHint = generateHint({ loop: 1, history: [{ type: 'observe' }], known_clues: [] }, 'first_observation');
assert.ok(obsHint.text, 'Observation hint should have text');
assert.ok(obsHint.recommendedActions.length > 0, 'Should have recommendations');

var clueHint = generateHint({ loop: 1, history: [{ type: 'observe' }], known_clues: [{ type: 'fact' }] }, 'first_observation');
assert.ok(clueHint.text.indexOf('异常') >= 0 || clueHint.text.indexOf('对话') >= 0, 'Should suggest talking after finding clues');

var dlgHint = generateHint({ loop: 1, history: [{ type: 'observe' }, { type: 'dialogue' }], active_npc: 'xiaoning' }, 'first_dialogue');
assert.ok(dlgHint.text.indexOf('说法') >= 0, 'Dialogue hint should mention statements vs facts');

var memHint = generateHint({ loop: 2, history: [] }, 'loop_memory_intro');
assert.ok(memHint.text.indexOf('记忆') >= 0, 'Memory hint should mention memory');

var lowApHint = generateHint({ loop: 3, ap_remaining: 2 }, 'normal_play');
assert.ok(lowApHint.text.indexOf('行动力') >= 0, 'Should warn about low AP');

var msg1 = getStageTransitionMessage('intro', 'first_observation');
assert.ok(msg1, 'Should have transition message');

console.log('All AssistantHint tests passed (' + (new Date().toISOString()) + ')');