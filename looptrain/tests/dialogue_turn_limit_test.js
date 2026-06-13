'use strict';
const assert = require('assert');
const engine = require('../standalone/engine');

let s = engine.normalize(engine.START_STATE);
let r = engine.commitAction('我走到小宁身边，蹲下来和她说话。', s);
s = r.state;
assert.strictEqual(s.dialogue_session.turn_limit, 10);

for (let i = 0; i < 9; i++) {
  r = engine.dialogueMessage('xiaoning', '别怕，我也听见了那个声音。你刚才是不是听见地板下面的滴答声？', s);
  s = r.state;
}
assert.strictEqual(s.mode, 'dialogue');
assert.strictEqual(s.dialogue_session.turns_used, 9);

r = engine.dialogueMessage('xiaoning', '我再轻声确认一次，声音是不是从地板下面传来？', s);
s = r.state;
assert.strictEqual(s.mode, 'explore');
assert.ok(r.dialogue_outcome);
assert.strictEqual(r.dialogue_outcome.turn_limit, 10);
assert.strictEqual(r.dialogue_outcome.turns_used, 10);

s = engine.normalize(engine.START_STATE);
r = engine.commitAction('我起身穿过过道，走向第七节车厢和第八节车厢之间的连接处。', s);
s = r.state;
assert.strictEqual(s.location, 'connector_7_8');
r = engine.commitAction('我走向沈墨寒，试探他。', s);
s = r.state;
assert.strictEqual(s.dialogue_session.turn_limit, 8);
for (let i = 0; i < 8; i++) {
  r = engine.dialogueMessage('shen_mohan', '你刚才去了连接处吗？08:48 前后你在什么地方？', s);
  s = r.state;
}
assert.strictEqual(s.mode, 'explore');
assert.ok(s.npc_states.shen_mohan.suspicion >= 50);

console.log('OK dialogue turn limits and auto close');
