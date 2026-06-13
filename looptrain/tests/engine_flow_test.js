'use strict';
const assert = require('assert');
const engine = require('../standalone/engine');

let s = engine.normalize(engine.START_STATE);
let r = engine.commitAction('我走到小宁身边，蹲下来和她说话。', s);
s = r.state;
assert.strictEqual(s.mode, 'dialogue');
assert.strictEqual(s.active_npc, 'xiaoning');

r = engine.dialogueMessage('xiaoning', '别怕，我也听见了那个声音。你刚才是不是看见了什么？', s);
s = r.state;
assert.ok(s.dialogue_session.pending_clues.includes('ticking_under_floor'));

r = engine.endDialogue(s);
s = r.state;
assert.strictEqual(s.mode, 'explore');
assert.ok(s.known_clues.includes('ticking_under_floor'));
assert.ok(s.known_clues.includes('xiaoning_heard_ticking'));
assert.strictEqual(s.ap_remaining, 7);

r = engine.commitAction('我假装系鞋带，低头检查座位下方。', s);
s = r.state;
assert.ok(s.known_clues.includes('sound_not_from_seat'));
assert.ok(engine.countValidEvidence(s) >= 2);

r = engine.commitAction('我找到赵乘警，说明小宁听见过声音，而且我也确认声音不来自座位，请他检查地板。', s);
s = r.state;
assert.strictEqual(s.flags.trial_success, true);
console.log('OK engine flow: dialogue -> clue -> observe -> convince -> success');
