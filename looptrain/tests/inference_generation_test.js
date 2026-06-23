'use strict';
const assert = require('assert');
const engine = require('../standalone/engine');

// Test 1: claim_gray_stayed_connector + obs_gray_passes_1404 → inf_gray_alibi_contradicted
var s = engine.normalize(engine.START_STATE);
s.known_clues.push('claim_gray_stayed_connector');
s.known_clues.push('obs_gray_passes_1404');
var inferences = engine.generateInference(s);
assert.ok(inferences.indexOf('inf_gray_alibi_contradicted') >= 0, 'should generate gray alibi inference');

// Test 2: claim_xiaoning_stayed_carriage2 + obs_xiaoning_returns_1402 → inf_xiaoning_statement_incomplete
s = engine.normalize(engine.START_STATE);
s.known_clues.push('claim_xiaoning_stayed_carriage2');
s.known_clues.push('obs_xiaoning_returns_1402');
inferences = engine.generateInference(s);
assert.ok(inferences.indexOf('inf_xiaoning_statement_incomplete') >= 0);

// Test 3: obs_gray_enters_c3_1406 + obs_metal_sound_1408 → inf_gray_connected_to_c3_anomaly
s = engine.normalize(engine.START_STATE);
s.known_clues.push('obs_gray_enters_c3_1406');
s.known_clues.push('obs_metal_sound_1408');
inferences = engine.generateInference(s);
assert.ok(inferences.indexOf('inf_gray_connected_to_c3_anomaly') >= 0);

// Test 4: inf_gray_connected_to_c3_anomaly + clue_floor_panel_scratch → inf_c3_needs_inspection
s = engine.normalize(engine.START_STATE);
s.known_clues.push('inf_gray_connected_to_c3_anomaly');
s.known_clues.push('clue_floor_panel_scratch');
inferences = engine.generateInference(s);
assert.ok(inferences.indexOf('inf_c3_needs_inspection') >= 0);

// Test 5: Inference not generated when only one source is present
s = engine.normalize(engine.START_STATE);
s.known_clues.push('claim_gray_stayed_connector');
inferences = engine.generateInference(s);
assert.strictEqual(inferences.indexOf('inf_gray_alibi_contradicted'), -1);

// Test 6: Inference not duplicated
s = engine.normalize(engine.START_STATE);
s.known_clues.push('obs_gray_enters_c3_1406');
s.known_clues.push('obs_metal_sound_1408');
engine.generateInference(s);
inferences = engine.generateInference(s);
assert.strictEqual(inferences.indexOf('inf_gray_connected_to_c3_anomaly'), -1);

// Test 7: claim_gray_denies_carriage3 + obs_gray_enters_c3_1406 → inf_gray_denial_false
s = engine.normalize(engine.START_STATE);
s.known_clues.push('claim_gray_denies_carriage3');
s.known_clues.push('obs_gray_enters_c3_1406');
inferences = engine.generateInference(s);
assert.ok(inferences.indexOf('inf_gray_denial_false') >= 0);

// Test 8: Inferences stored in player_timeline.inferences
s = engine.normalize(engine.START_STATE);
s.known_clues.push('claim_gray_stayed_connector');
s.known_clues.push('obs_gray_passes_1404');
engine.generateInference(s);
assert.ok(s.player_timeline.inferences.indexOf('inf_gray_alibi_contradicted') >= 0);

console.log('OK inference generation: all rule pairs, single source, dedup, storage');
