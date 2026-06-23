'use strict';
const assert = require('assert');
const engine = require('../standalone/engine');

// Helper: add raw timeline entry without side effects
function pushEntry(s, data) {
  s.player_timeline.entries.push({
    id: data.id, source_id: data.source_id, public_clue_id: data.public_clue_id || null,
    actor: data.actor || '', time: data.time || null, location: data.location || null,
    source_type: data.source_type || 'observation', source_label: data.source_label || '',
    contradicts: data.contradicts || [], supports: data.supports || [],
  });
}

// Helper: get a truly fresh normalized state (avoid shared player_timeline reference)
function freshState() {
  var s = engine.normalize(engine.START_STATE);
  s.player_timeline = { entries: [], inferences: [] };
  return s;
}

// Test 1: No conflicts when only observations present (no claims)
var s = freshState();
pushEntry(s, { id: 'entry_obs1', source_id: 'obs_gray_passes_1404', public_clue_id: 'obs_gray_passes_1404', actor: 'gray_passenger', time: '14:04', location: 'carriage_2', contradicts: ['claim_gray_stayed_connector'], source_type: 'observation' });
var conflicts = engine.detectConflicts(s);
assert.strictEqual(conflicts.length, 0, 'observation alone should not trigger conflict');

// Test 2: Gray claim + gray observation → conflict detected
s = freshState();
pushEntry(s, { id: 'entry_obs2', source_id: 'obs_gray_passes_1404', public_clue_id: 'obs_gray_passes_1404', actor: 'gray_passenger', time: '14:04', location: 'carriage_2', contradicts: ['claim_gray_stayed_connector'], source_type: 'observation' });
pushEntry(s, { id: 'entry_claim2', source_id: 'claim_gray_stayed_connector', public_clue_id: 'claim_gray_stayed_connector', actor: 'gray_passenger', contradicts: ['obs_gray_passes_1404', 'obs_gray_enters_c3_1406'], source_type: 'claim' });
conflicts = engine.detectConflicts(s);
assert.ok(conflicts.length >= 1, 'gray claim + gray observation should conflict');
assert.strictEqual(conflicts[0].verdictSource, 'timeline_contradiction');

// Test 3: Xiaoning claim + xiaoning observation → conflict detected
s = freshState();
pushEntry(s, { id: 'entry_obs3', source_id: 'obs_xiaoning_returns_1402', public_clue_id: 'obs_xiaoning_returns_1402', actor: 'xiaoning', time: '14:02', location: 'carriage_2', contradicts: ['claim_xiaoning_stayed_carriage2'], source_type: 'observation' });
pushEntry(s, { id: 'entry_claim3', source_id: 'claim_xiaoning_stayed_carriage2', public_clue_id: 'claim_xiaoning_stayed_carriage2', actor: 'xiaoning', contradicts: ['obs_xiaoning_returns_1402'], source_type: 'claim' });
conflicts = engine.detectConflicts(s);
assert.ok(conflicts.length >= 1, 'xiaoning claim + observation should conflict');

// Test 4: No conflict when only one side of pair is present
s = freshState();
pushEntry(s, { id: 'entry_obs4', source_id: 'obs_gray_enters_c3_1406', public_clue_id: 'obs_gray_enters_c3_1406', actor: 'gray_passenger', time: '14:06', location: 'connector_2_3', contradicts: ['claim_gray_stayed_connector', 'claim_gray_denies_carriage3'], source_type: 'observation' });
conflicts = engine.detectConflicts(s);
assert.strictEqual(conflicts.length, 0, 'observation alone without corresponding claim should not conflict');

// Test 5: Conflict pairs are deduplicated
s = freshState();
pushEntry(s, { id: 'entry_a', source_id: 'obs_gray_passes_1404', public_clue_id: 'obs_gray_passes_1404', contradicts: ['claim_gray_stayed_connector'], source_type: 'observation' });
pushEntry(s, { id: 'entry_b', source_id: 'claim_gray_stayed_connector', public_clue_id: 'claim_gray_stayed_connector', contradicts: ['obs_gray_passes_1404', 'obs_gray_enters_c3_1406'], source_type: 'claim' });
pushEntry(s, { id: 'entry_c', source_id: 'obs_gray_enters_c3_1406', public_clue_id: 'obs_gray_enters_c3_1406', contradicts: ['claim_gray_stayed_connector'], source_type: 'observation' });
conflicts = engine.detectConflicts(s);
var keys = conflicts.map(function(c) { return c.key; });
assert.strictEqual(keys.length, new Set(keys).size, 'conflict keys should be unique');

// Test 6: Multiple conflicts detected simultaneously
s = freshState();
pushEntry(s, { id: 'entry_xr', source_id: 'obs_xiaoning_returns_1402', public_clue_id: 'obs_xiaoning_returns_1402', contradicts: ['claim_xiaoning_stayed_carriage2'], source_type: 'observation' });
pushEntry(s, { id: 'entry_xc', source_id: 'claim_xiaoning_stayed_carriage2', public_clue_id: 'claim_xiaoning_stayed_carriage2', contradicts: ['obs_xiaoning_returns_1402'], source_type: 'claim' });
pushEntry(s, { id: 'entry_go', source_id: 'obs_gray_passes_1404', public_clue_id: 'obs_gray_passes_1404', contradicts: ['claim_gray_stayed_connector'], source_type: 'observation' });
pushEntry(s, { id: 'entry_gc', source_id: 'claim_gray_stayed_connector', public_clue_id: 'claim_gray_stayed_connector', contradicts: ['obs_gray_passes_1404'], source_type: 'claim' });
conflicts = engine.detectConflicts(s);
assert.ok(conflicts.length >= 2, 'should detect at least 2 conflicts across different pairs');

console.log('OK conflict detection: none, single, multiple, dedup, edge cases');
