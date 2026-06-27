'use strict';

var assert = require('assert');
var engine = require('../engine');

function run() {
  var echoes = engine.buildNpcMemoryEchoes({ loop: 1, npc_states: { xiaoning: { trust: 50 } } }, null);
  assert.strictEqual(echoes.length, 1, 'xiaoning trust>=45 should produce 1 echo');
  assert.strictEqual(echoes[0].npcId, 'xiaoning');
  assert.strictEqual(echoes[0].kind, 'trust_residue');
  assert.strictEqual(echoes[0].modifiers.trustDelta, 5);

  echoes = engine.buildNpcMemoryEchoes({ loop: 1, npc_states: { gray_passenger: { suspicion: 60 } } }, null);
  assert.strictEqual(echoes.length, 1, 'gray suspicion>=50 should produce 1 echo');
  assert.strictEqual(echoes[0].kind, 'suspicion_residue');
  assert.strictEqual(echoes[0].modifiers.suspicionDelta, 8);

  echoes = engine.buildNpcMemoryEchoes({ loop: 1, npc_states: { xiaoning: { trust: 20 } } }, null);
  assert.strictEqual(echoes.length, 0, 'low trust should produce 0 echoes');

  echoes = engine.buildNpcMemoryEchoes({ loop: 1, npc_states: { zhao_police: { trust: 35 } }, flags: { zhao_checked_floor: true } }, null);
  assert.strictEqual(echoes.length, 1, 'zhao trust>=30 + zhao_checked_floor should produce 1 echo');
  assert.strictEqual(echoes[0].kind, 'emotional_residue');

  echoes = engine.buildNpcMemoryEchoes({ loop: 1, npc_states: { zhao_police: { trust: 35 } }, flags: {} }, null);
  assert.strictEqual(echoes.length, 0, 'zhao without zhao_checked_floor should produce 0 echoes');

  var result = engine.nextLoop({
    state: { loop: 1, npc_states: { xiaoning: { trust: 50 } }, player_timeline: { entries: [], inferences: [] } },
    loop_failure_outcome: { confirmed_facts: [], _timeline_carry: [], _inference_carry: [] }
  });
  assert.ok(result.state.npc_memory_echoes, 'nextLoop should apply echoes');
  assert.strictEqual(result.state.npc_memory_echoes.length, 1);
  assert.strictEqual(result.state.npc_states.xiaoning.trust, 25, 'xiaoning trust should be 20+5=25');
  assert.ok(result.state.npc_states.xiaoning.memory_echo, 'xiaoning should have memory_echo set');

  console.log('  ✓ npc_memory_echo_test passed');
}

run();
