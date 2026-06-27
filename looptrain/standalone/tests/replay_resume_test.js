'use strict';

var assert = require('assert');
var engine = require('../engine');

function run() {
  var prev = {
    state: { loop: 1, npc_states: { xiaoning: { trust: 20 } }, player_timeline: { entries: [], inferences: [] } },
    loop_failure_outcome: { confirmed_facts: [], _timeline_carry: [], _inference_carry: [] }
  };
  var anchor = { anchorId: 'test', loopNo: 1, clock: '14:06', location: 'connector_2_3', apRemaining: 6 };
  var result = engine.resumeFromReplayAnchor(prev, anchor, { mode: 'preposition' });

  assert.strictEqual(result.state.loop, 2, 'loop should be 2');
  assert.strictEqual(result.state.clock, '14:06', 'clock should be 14:06');
  assert.strictEqual(result.state.location, 'connector_2_3', 'location should be connector_2_3');
  assert.strictEqual(result.state.ap_remaining, 8, 'AP should be 8 (10 - ceil(6/5)=2)');
  assert.strictEqual(result.state.dialogue_session, null, 'dialogue_session should be null');
  assert.strictEqual(result.state.active_npc, null, 'active_npc should be null');
  assert.strictEqual(result.state.mode, 'explore', 'mode should be explore');
  assert.strictEqual(result.state.replay.mode, 'preposition', 'replay mode should be preposition');
  assert.strictEqual(result.state.replay.source_loop, 1, 'source_loop should be 1');
  assert.ok(result.opening.indexOf('14:06') >= 0, 'opening should mention 14:06');
  assert.ok(result.replay_resume_outcome, 'should have replay_resume_outcome');

  var ap14 = engine.calculatePrepositionAP({ clock: '14:00' }, { mode: 'preposition' });
  assert.strictEqual(ap14, 10, '14:00 should give full AP');

  var ap14_03 = engine.calculatePrepositionAP({ clock: '14:03' }, { mode: 'preposition' });
  assert.strictEqual(ap14_03, 9, '14:03 should cost 1 AP');

  var ap14_10 = engine.calculatePrepositionAP({ clock: '14:10' }, { mode: 'preposition' });
  assert.strictEqual(ap14_10, 8, '14:10 should cost 2 AP');

  console.log('  ✓ replay_resume_test passed');
}

run();
