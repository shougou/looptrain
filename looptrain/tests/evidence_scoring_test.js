'use strict';
const assert = require('assert');
const engine = require('../standalone/engine');

// Test 1: Empty state → all dimensions 0
var s = engine.normalize(engine.START_STATE);
var e = engine.evaluateEvidence(s);
assert.strictEqual(e.physical_anomaly, 0);
assert.strictEqual(e.timeline_conflict, 0);
assert.strictEqual(e.suspect_route, 0);
assert.strictEqual(e.actionable_location, 0);
assert.strictEqual(e.police_context, 0);
assert.strictEqual(engine.canConvinceZhao(s), false);

// Test 2: clue_ticking_under_floor + clue_sound_not_from_seat → physical_anomaly=2
s = engine.normalize(engine.START_STATE);
s.known_clues.push('clue_ticking_under_floor');
s.known_clues.push('clue_sound_not_from_seat');
e = engine.evaluateEvidence(s);
assert.strictEqual(e.physical_anomaly, 2);
assert.ok(e.actionable_location >= 1);

// Test 3: inf_gray_alibi_contradicted → timeline_conflict=1
s = engine.normalize(engine.START_STATE);
s.known_clues.push('inf_gray_alibi_contradicted');
e = engine.evaluateEvidence(s);
assert.strictEqual(e.timeline_conflict, 1);

// Test 4: obs_gray_passes_1404 + obs_gray_enters_c3_1406 → suspect_route=2
s = engine.normalize(engine.START_STATE);
s.known_clues.push('obs_gray_passes_1404');
s.known_clues.push('obs_gray_enters_c3_1406');
e = engine.evaluateEvidence(s);
assert.strictEqual(e.suspect_route, 2);

// Test 5: claim_zhao_needs_actionable_evidence → police_context=1
s = engine.normalize(engine.START_STATE);
s.known_clues.push('claim_zhao_needs_actionable_evidence');
e = engine.evaluateEvidence(s);
assert.strictEqual(e.police_context, 1);

// Test 6: Path A success (physical>=2 + actionable>=1 + police>=1)
s = engine.normalize(engine.START_STATE);
s.known_clues.push('clue_ticking_under_floor');
s.known_clues.push('clue_sound_not_from_seat');
s.known_clues.push('claim_zhao_needs_actionable_evidence');
assert.strictEqual(engine.canConvinceZhao(s), true);

// Test 7: Path B success (physical>=1 + timeline>=1 + suspect>=1 + actionable>=1 + police>=1)
s = engine.normalize(engine.START_STATE);
s.known_clues.push('clue_ticking_under_floor');
s.known_clues.push('inf_gray_alibi_contradicted');
s.known_clues.push('obs_gray_passes_1404');
s.known_clues.push('clue_sound_not_from_seat');
s.known_clues.push('claim_zhao_needs_actionable_evidence');
assert.strictEqual(engine.canConvinceZhao(s), true);

// Test 8: canConvinceZhao returns false when police_context=0
s = engine.normalize(engine.START_STATE);
s.known_clues.push('clue_ticking_under_floor');
s.known_clues.push('clue_sound_not_from_seat');
assert.strictEqual(engine.canConvinceZhao(s), false);

// Test 9: obs_metal_sound_1408 adds physical_anomaly
s = engine.normalize(engine.START_STATE);
s.known_clues.push('obs_metal_sound_1408');
e = engine.evaluateEvidence(s);
assert.strictEqual(e.physical_anomaly, 1);

// Test 10: inf_c3_needs_inspection adds suspect_route + actionable_location
s = engine.normalize(engine.START_STATE);
s.known_clues.push('inf_c3_needs_inspection');
e = engine.evaluateEvidence(s);
assert.ok(e.suspect_route >= 1);
assert.ok(e.actionable_location >= 1);

console.log('OK evidence scoring: dimensions, path A, path B, police context');
