'use strict';

var assert = require('assert');
var providers = require('../llm/providers');

function run() {
  var stateNoEcho = { npc_states: { xiaoning: {} } };
  assert.strictEqual(providers.guardLlmEchoReply('你好', 'xiaoning', stateNoEcho), '你好');

  var stateWithEcho = { npc_states: { xiaoning: { memory_echo: { kind: 'trust_residue' } } } };
  assert.strictEqual(providers.guardLlmEchoReply('我是不是在哪里见过你？', 'xiaoning', stateWithEcho), '我是不是在哪里见过你？');

  assert.strictEqual(providers.guardLlmEchoReply('上一轮你跟我说过...', 'xiaoning', stateWithEcho), null);

  assert.strictEqual(providers.guardLlmEchoReply('你被困在时间循环里', 'xiaoning', stateWithEcho), null);

  assert.strictEqual(providers.guardLlmEchoReply('我记得你', 'xiaoning', stateWithEcho), null);

  assert.strictEqual(providers.guardLlmEchoReply('炸弹在地板下面', 'xiaoning', stateWithEcho), null);

  assert.strictEqual(providers.guardLlmEchoReply(null, 'xiaoning', stateWithEcho), null);

  console.log('  ✓ llm_echo_guard_test passed');
}

run();
