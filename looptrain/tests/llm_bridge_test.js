'use strict';
const assert = require('assert');
const engine = require('../standalone/engine');

let s = engine.normalize(engine.START_STATE);
let r = engine.commitAction('我走到小宁身边，蹲下来和她说话。', s);
s = r.state;

r = engine.dialogueMessage(
  'xiaoning',
  '别怕，我也听见了那个声音。它是不是从地板下面传来的？',
  s,
  { llm_reply: '小宁把布娃娃抱紧，小声说：“不是座位下面……是下面在响。”\n【获得线索：炸弹位置】\n【AP -3】' }
);

s = r.state;
assert.strictEqual(s.mode, 'dialogue');
assert.ok(r.messages[0].text.includes('不是座位下面'));
assert.ok(!r.messages[0].text.includes('获得线索'));
assert.ok(!r.messages[0].text.includes('AP -3'));
assert.ok(s.dialogue_session.pending_clues.includes('ticking_under_floor'));
assert.ok(s.dialogue_session.pending_clues.includes('xiaoning_heard_ticking'));

r = engine.endDialogue(s);
s = r.state;
assert.ok(s.known_clues.includes('ticking_under_floor'));
assert.ok(s.known_clues.includes('xiaoning_heard_ticking'));

console.log('OK LLM bridge: reply text is performance only, state remains engine-controlled');
