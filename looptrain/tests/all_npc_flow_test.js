'use strict';
const assert = require('assert');
const engine = require('../standalone/engine');

let s = engine.normalize(engine.START_STATE);

// Xiaoning path: dialogue -> grant clue_ticking_under_floor + claim_xiaoning_heard_ticking
let r = engine.commitAction('我走到小宁身边，蹲下来和她说话。', s); s = r.state;
assert.strictEqual(s.mode, 'dialogue'); assert.strictEqual(s.active_npc, 'xiaoning');
r = engine.dialogueMessage('xiaoning', '别怕，我也听见了那个声音。你刚才是不是听见地板下面的滴答声？', s); s = r.state;
r = engine.endDialogue(s); s = r.state;
assert.ok(s.known_clues.includes('clue_ticking_under_floor'));
assert.ok(s.known_clues.includes('claim_xiaoning_heard_ticking'));

// Observe floor: grant clue_sound_not_from_seat (auto-grants clue_floor_panel_scratch)
r = engine.commitAction('我假装系鞋带，低头检查座位下方。', s); s = r.state;
assert.ok(s.known_clues.includes('clue_sound_not_from_seat'));
assert.ok(s.known_clues.includes('clue_floor_panel_scratch'));

// Gray Passenger path (visit connector, start dialogue)
r = engine.commitAction('我起身穿过过道，走向二号车厢和三号车厢之间的连接处。', s); s = r.state;
assert.strictEqual(s.location, 'connector_2_3');
r = engine.commitAction('我走向灰衣乘客，试探他。', s); s = r.state;
assert.strictEqual(s.active_npc, 'gray_passenger');
r = engine.endDialogue(s); s = r.state;

// Zhao path: first call auto-injects claim_zhao_needs_actionable_evidence, second succeeds
r = engine.commitAction('我找到赵乘警，说明小宁听见过声音，连接处有人停留过，请他检查地板。', s); s = r.state;
assert.ok(s.known_clues.includes('claim_zhao_needs_actionable_evidence'));

r = engine.commitAction('我找到赵乘警，说明已获得的证据，请他检查地板。', s); s = r.state;
assert.strictEqual(s.flags.trial_success, true);
console.log('OK all NPC flow: Xiaoning -> Observe -> Gray Passenger -> Zhao -> success');
