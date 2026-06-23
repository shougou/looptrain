'use strict';
const assert = require('assert');
const engine = require('../standalone/engine');

// Test 1: xiaoning_mother_memory flag triggers via emotional dialogue,
// grants claim_xiaoning_heard_ticking (not the removed mother_doll_memory)
let s = engine.normalize(engine.START_STATE);
let r = engine.startDialogue(s, 'xiaoning');
s = r.state;

r = engine.dialogueMessage('xiaoning', '别怕，我也听见了那个声音，我会帮你。', s);
s = r.state;
assert.ok(s.npc_states.xiaoning.trust >= 30, 'trust should increase with gentle dialogue');

r = engine.dialogueMessage('xiaoning', '别怕，我会保护你。这个布娃娃是谁给你的？你妈妈是不是让它陪着你？', s);
s = r.state;

assert.strictEqual(s.flags.xiaoning_mother_memory_triggered, true);
assert.ok(s.dialogue_session.pending_clues.includes('claim_xiaoning_heard_ticking'));
assert.ok(!s.dialogue_session.pending_clues.includes('mother_doll_memory'));

r = engine.endDialogue(s);
s = r.state;
assert.ok(s.known_clues.includes('claim_xiaoning_heard_ticking'));
assert.ok(!s.known_clues.includes('mother_doll_memory'));
assert.strictEqual(s.flags.trial_success, false, 'mother memory should not advance main plot');

// Test 2: Simple question without emotional key does not trigger memory
s = engine.normalize(engine.START_STATE);
r = engine.startDialogue(s, 'xiaoning');
s = r.state;
r = engine.dialogueMessage('xiaoning', '你怀里那个布娃娃是谁给你的？', s);
s = r.state;
assert.strictEqual(s.flags.xiaoning_mother_memory_triggered || false, false);
r = engine.endDialogue(s);
s = r.state;
assert.strictEqual(s.flags.xiaoning_mother_memory_triggered || false, false);

// Test 3: startDialogue for non-existent xiaoning_mother_hidden NPC
s = engine.normalize(engine.START_STATE);
let hiddenResult = engine.startDialogue(s, 'xiaoning_mother_hidden');
assert.ok(hiddenResult.messages[0].text.includes('不在这里') || hiddenResult.messages[0].text.includes('不在二号车厢'));

console.log('OK hidden node: mother_doll_memory removed, claim system used instead');
