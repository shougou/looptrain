'use strict';
const assert = require('assert');
const engine = require('../st-server-plugin/looptrain/engine');

let s = engine.normalize(engine.START_STATE);
let blocked = engine.startDialogue(s, 'xiaoning_mother_hidden');
assert.ok(blocked.messages[0].text.includes('记忆'), 'hidden mother should not be directly available before trigger');

let r = engine.startDialogue(s, 'xiaoning');
s = r.state;
r = engine.dialogueMessage('xiaoning', '别怕，我也听见了那个声音，我会帮你。', s);
s = r.state;
r = engine.dialogueMessage('xiaoning', '你妈妈呢？这个布娃娃是谁给你的？', s);
s = r.state;
assert.ok(!s.dialogue_session.pending_clues.includes('mother_doll_memory'), 'simple mother/doll keywords should not trigger hidden node');

r = engine.dialogueMessage('xiaoning', '别怕，我会保护你。这个布娃娃是谁给你的？你妈妈是不是让它陪着你？', s);
s = r.state;
assert.ok(s.dialogue_session.pending_clues.includes('mother_doll_memory'));
assert.ok(s.flags.visible_hidden_npcs.includes('xiaoning_mother_hidden'));
assert.strictEqual(s.flags.xiaoning_mother_memory_triggered, true);

r = engine.endDialogue(s);
s = r.state;
assert.ok(s.known_clues.includes('mother_doll_memory'));
assert.strictEqual(s.flags.trial_success, false, 'hidden mother node must not advance main plot');

r = engine.startDialogue(s, 'xiaoning_mother_hidden');
assert.strictEqual(r.state.active_npc, 'xiaoning_mother_hidden');
assert.ok(r.messages[0].text.includes('布娃娃'));

console.log('OK hidden node: harder trigger unlocks visible mother NPC without main plot success');
