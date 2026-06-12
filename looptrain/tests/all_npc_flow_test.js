'use strict';
const assert = require('assert');
const engine = require('../st-server-plugin/looptrain/engine');

let s = engine.normalize(engine.START_STATE);

// Xiaoning path
let r = engine.commitAction('我走到小宁身边，蹲下来和她说话。', s); s = r.state;
assert.strictEqual(s.mode, 'dialogue'); assert.strictEqual(s.active_npc, 'xiaoning');
r = engine.dialogueMessage('xiaoning', '别怕，我也听见了那个声音。你刚才是不是听见地板下面的滴答声？', s); s = r.state;
r = engine.endDialogue(s); s = r.state;
assert.ok(s.known_clues.includes('ticking_under_floor'));

// Shen path
r = engine.commitAction('我走向沈墨寒，试探他是否知道连接处发生过什么。', s); s = r.state;
assert.strictEqual(s.active_npc, 'shen_mohan');
r = engine.dialogueMessage('shen_mohan', '08:48 前后，你为什么离开座位去了连接处？餐车那段口琴声你也听见了吧？', s); s = r.state;
r = engine.endDialogue(s); s = r.state;
assert.ok(s.known_clues.includes('suspicious_connector_movement'));

// Zhao path can complete using 2+ evidence
assert.ok(engine.countValidEvidence(s) >= 2);
r = engine.commitAction('我找到赵乘警，说明小宁听见过声音，而且连接处有人停留过，请他检查地板。', s); s = r.state;
assert.strictEqual(s.flags.trial_success, true);
console.log('OK all NPC flow: Xiaoning + Shen -> Zhao -> success');
