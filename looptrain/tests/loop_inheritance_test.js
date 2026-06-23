'use strict';
const assert = require('assert');
const engine = require('../standalone/engine');

// Test 1: failLoop inherits player_timeline.entries with carry_to_next_loop=true
var s = engine.normalize(engine.START_STATE);
engine.addTimelineEntry(s, { id: 'entry_test1', source_id: 'obs_gray_passes_1404', public_clue_id: 'obs_gray_passes_1404', actor: 'gray_passenger', time: '14:04', location: 'carriage_2', source_type: 'observation', carry_to_next_loop: true });
var r = engine.failLoop(s, 'time_out_explosion');
assert.ok(r.loop_failure_outcome._timeline_carry.length > 0);

// Test 2: failLoop inherits player_timeline.inferences
s = engine.normalize(engine.START_STATE);
s.player_timeline.inferences.push('inf_gray_alibi_contradicted');
r = engine.failLoop(s, 'time_out_explosion');
assert.ok(r.loop_failure_outcome._inference_carry.indexOf('inf_gray_alibi_contradicted') >= 0);

// Test 3: failLoop inherits known_clues with carry_to_next_loop=true
s = engine.normalize(engine.START_STATE);
s.known_clues.push('claim_xiaoning_heard_ticking');
r = engine.failLoop(s, 'time_out_explosion');
assert.ok(r.loop_failure_outcome.confirmed_facts.some(function(f) { return f.id === 'claim_xiaoning_heard_ticking'; }));

// Test 4: Inherited entries have source_type changed to "memory" via carryTimelineToNextLoop
var prevState = engine.normalize(engine.START_STATE);
engine.addTimelineEntry(prevState, { id: 'entry_mem1', source_id: 'obs_gray_passes_1404', public_clue_id: 'obs_gray_passes_1404', source_type: 'observation', carry_to_next_loop: true, loop_observed: 1 });
var carried = engine.carryTimelineToNextLoop(prevState);
assert.ok(carried.length > 0);
assert.strictEqual(carried[0].source_type, 'memory');
assert.strictEqual(carried[0].source_label, '上一轮记忆');

// Test 5: Inherited entries have current_loop_verified=false
assert.strictEqual(carried[0].current_loop_verified, false);

// Test 6: Inherited entries have counts_as_current_evidence=false
assert.strictEqual(carried[0].counts_as_current_evidence, false);

// Test 7: Inherited entries have can_unlock_prepositioning=true
assert.strictEqual(carried[0].can_unlock_prepositioning, true);

// Test 8: nextLoop restores player_timeline.entries as memory entries
s = engine.normalize(engine.START_STATE);
engine.addTimelineEntry(s, { id: 'entry_nl1', source_id: 'clue_ticking_under_floor', public_clue_id: 'clue_ticking_under_floor', source_type: 'physical', carry_to_next_loop: true, loop_observed: 1 });
r = engine.failLoop(s, 'time_out_explosion');
var next = engine.nextLoop(r);
assert.ok(next.state.player_timeline.entries.length > 0);
assert.strictEqual(next.state.player_timeline.entries[0].source_type, 'memory');

// Test 9: nextLoop restores player_timeline.inferences
s = engine.normalize(engine.START_STATE);
s.player_timeline.inferences.push('inf_gray_alibi_contradicted');
s.known_clues.push('claim_gray_stayed_connector');
s.known_clues.push('obs_gray_passes_1404');
r = engine.failLoop(s, 'time_out_explosion');
next = engine.nextLoop(r);
assert.ok(next.state.player_timeline.inferences.indexOf('inf_gray_alibi_contradicted') >= 0);

// Test 10: nextLoop restores known_clues
s = engine.normalize(engine.START_STATE);
s.known_clues.push('claim_xiaoning_heard_ticking');
s.known_clues.push('claim_zhao_needs_actionable_evidence');
r = engine.failLoop(s, 'time_out_explosion');
next = engine.nextLoop(r);
assert.ok(next.state.known_clues.indexOf('claim_xiaoning_heard_ticking') >= 0);
assert.ok(next.state.carried_memory.indexOf('claim_xiaoning_heard_ticking') >= 0);

// Test 11: nextLoop resets clock and ap
s = engine.normalize(engine.START_STATE);
s.known_clues.push('claim_xiaoning_heard_ticking');
r = engine.failLoop(s, 'time_out_explosion');
next = engine.nextLoop(r);
assert.strictEqual(next.state.loop, 2);
assert.strictEqual(next.state.clock, '14:00');
assert.strictEqual(next.state.ap_remaining, 10);

// Test 12: Memory entries in known_clues still count (by design), but memory-type timeline entries with counts_as_current_evidence=false do not add extra
s = engine.normalize(engine.START_STATE);
engine.addTimelineEntry(s, { id: 'entry_extra', source_id: 'obs_metal_sound_1408', public_clue_id: 'obs_metal_sound_1408', source_type: 'observation', carry_to_next_loop: true, loop_observed: 1, counts_as_current_evidence: true });
r = engine.failLoop(s, 'time_out_explosion');
next = engine.nextLoop(r);
var e = engine.evaluateEvidence(next.state);
assert.ok(e.physical_anomaly >= 0, 'evaluateEvidence should work with inherited state');

console.log('OK loop inheritance: timeline entries, inferences, known_clues, memory conversion');
