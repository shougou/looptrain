'use strict';

const assert = require('assert');
const { UIStage, getUIStage, getVisibleControls, getActionCount, shouldShowControl, getStageLabel } = require('../public/ui-stage');

console.log('Running UIStage tests...');

assert.strictEqual(getUIStage({ loop: 1, history: [] }), UIStage.INTRO, 'Should be intro for loop 1 with no history');
assert.strictEqual(getActionCount(UIStage.INTRO), 1, 'Intro should have 1 action');
assert.strictEqual(shouldShowControl(UIStage.INTRO, 'primary_action'), true, 'Intro should show primary action');
assert.strictEqual(shouldShowControl(UIStage.INTRO, 'input'), false, 'Intro should not show input');

assert.strictEqual(getUIStage({ loop: 1, ap_remaining: 8 }), UIStage.FIRST_OBSERVATION, 'Should be first_observation after AP used');
assert.strictEqual(getActionCount(UIStage.FIRST_OBSERVATION), 2, 'First observation should have 2 actions');

assert.strictEqual(getUIStage({ loop: 1, mode: 'dialogue' }), UIStage.FIRST_DIALOGUE, 'Should be first_dialogue when in dialogue mode');
assert.strictEqual(getUIStage({ loop: 2, history: [] }), UIStage.LOOP_MEMORY_INTRO, 'Should be loop_memory_intro for loop 2 start');
assert.strictEqual(getUIStage({ loop: 2, history: [], known_clues: [1, 2, 3] }), UIStage.CASEBOARD_INTRO, 'Should be caseboard_intro with 3 clues');
assert.strictEqual(getUIStage({ loop: 3 }), UIStage.NORMAL_PLAY, 'Should be normal_play for loop 3');
assert.strictEqual(getUIStage({ loop: 3, contradictions: [{ description: 'test' }] }), UIStage.CONTRADICTION_INTRO, 'Should be contradiction_intro with contradictions');

assert.strictEqual(getStageLabel('intro'), '初次醒来', 'Intro label should be correct');
assert.strictEqual(getStageLabel('normal_play'), '自由探索', 'Normal play label should be correct');

console.log('All UIStage tests passed (' + (new Date().toISOString()) + ')');