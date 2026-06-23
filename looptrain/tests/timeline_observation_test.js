'use strict';
const assert = require('assert');
const engine = require('../standalone/engine');

// Test 1: Observe scene at 14:02 in carriage_2 → should find xiaoning returning
var s = engine.normalize(engine.START_STATE);
s.clock = '14:01';
var r = engine.observeEnvironment(s, { type: 'scene' });
s = r.state;
assert.ok(!r.observation_result.nothing_found, 'should find xiaoning returning');
assert.ok(r.observation_result.discovered.some(function(d) { return d.entry.public_clue_id === 'obs_xiaoning_returns_1402'; }));

// Test 2: Observe scene at correct time in carriage_2 → gray passing
s = engine.normalize(engine.START_STATE);
s.clock = '14:03';
r = engine.observeEnvironment(s, { type: 'scene' });
assert.ok(!r.observation_result.nothing_found);
assert.ok(r.observation_result.discovered.some(function(d) { return d.entry.public_clue_id === 'obs_gray_passes_1404'; }));

// Test 3: Observe scene at wrong time → nothing_found
s = engine.normalize(engine.START_STATE);
s.clock = '14:10';
r = engine.observeEnvironment(s, { type: 'scene' });
assert.ok(r.observation_result.nothing_found, 'wrong time should yield nothing');

// Test 4: Observe NPC type for gray_passenger at 14:02 in carriage_2 (advances 2min → 14:04, overlaps window [14:04,14:05])
s = engine.normalize(engine.START_STATE);
s.clock = '14:02';
r = engine.observeEnvironment(s, { type: 'npc', npc_id: 'gray_passenger' });
assert.ok(!r.observation_result.nothing_found);
assert.ok(r.observation_result.discovered.some(function(d) { return d.entry.public_clue_id === 'obs_gray_passes_1404'; }));

// Test 5: Observe location type at connector_2_3 at 14:04 (advances 2min → 14:06, overlaps window [14:06,14:07])
s = engine.normalize(engine.START_STATE);
s.location = 'connector_2_3';
s.clock = '14:04';
r = engine.observeEnvironment(s, { type: 'location', location: 'connector_2_3' });
assert.ok(!r.observation_result.nothing_found);
assert.ok(r.observation_result.discovered.some(function(d) { return d.entry.public_clue_id === 'obs_gray_enters_c3_1406'; }));

// Test 6: AP consumption (1 AP for all types)
s = engine.normalize(engine.START_STATE);
assert.strictEqual(s.ap_remaining, 10);
r = engine.observeEnvironment(s, { type: 'scene' });
assert.strictEqual(r.state.ap_remaining, 9);

// Test 7: Time advancement (1min for scene, 2min for npc/location)
s = engine.normalize(engine.START_STATE);
s.clock = '14:00';
r = engine.observeEnvironment(s, { type: 'scene' });
assert.strictEqual(r.state.clock, '14:01');
s = engine.normalize(engine.START_STATE);
s.clock = '14:00';
r = engine.observeEnvironment(s, { type: 'npc', npc_id: 'gray_passenger' });
assert.strictEqual(r.state.clock, '14:02');

// Test 8: Discovered entries are added to player_timeline.entries
s = engine.normalize(engine.START_STATE);
s.clock = '14:01';
r = engine.observeEnvironment(s, { type: 'scene' });
assert.ok(r.state.player_timeline.entries.length > 0);

// Test 9: Discovered entries with public_clue_id exist in observation_result
s = engine.normalize(engine.START_STATE);
s.clock = '14:03';
r = engine.observeEnvironment(s, { type: 'scene' });
assert.ok(r.observation_result.discovered.length > 0, 'should discover entries');
assert.ok(r.observation_result.discovered.some(function(d) { return d.entry.public_clue_id === 'obs_gray_passes_1404'; }));

console.log('OK timeline observation: scene, npc, location, timing, AP, entries, clues');
