"use strict";
/**
 * GoalEvaluator — DSL condition evaluator for GoalEngine.
 * Evaluates GoalCondition trees against runtime state.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateCondition = evaluateCondition;
/**
 * Match a single eventOccurred leaf against a MemoryEvent.
 * Returns true if all specified fields match.
 * Checks event.type directly and optional npcId/topic/result inside event.payload.
 */
function eventMatches(cond, event) {
    const evt = event;
    if (evt.type !== cond.type)
        return false;
    const payload = evt.payload || {};
    if (cond.npcId !== undefined && payload.npcId !== cond.npcId)
        return false;
    if (cond.topic !== undefined && payload.topic !== cond.topic)
        return false;
    if (cond.result !== undefined && payload.result !== cond.result)
        return false;
    return true;
}
/**
 * Evaluate a GoalCondition tree against the provided runtime state.
 *
 * Rules:
 * - `all`: every sub-condition must be true
 * - `any`: at least one sub-condition must be true
 * - `not`: the inner condition must be false
 * - `eventOccurred`: at least one MemoryEvent matches the provided fields
 * - `clueKnown`: knownClues array includes the clue ID
 * - `factConfirmed`: confirmedFacts array includes the fact ID
 * - `stateEquals`: runtime state[key] === value
 */
function evaluateCondition(condition, runtime) {
    // ── Leaf predicates ──────────────────────────────────────
    if ('clueKnown' in condition) {
        return runtime.knownClues.includes(condition.clueKnown);
    }
    if ('factConfirmed' in condition) {
        return runtime.confirmedFacts.includes(condition.factConfirmed);
    }
    if ('stateEquals' in condition) {
        const { key, value } = condition.stateEquals;
        return runtime.state[key] === value;
    }
    if ('eventOccurred' in condition) {
        return runtime.events.some((evt) => eventMatches(condition.eventOccurred, evt));
    }
    // ── Combinators ──────────────────────────────────────────
    if ('all' in condition) {
        if (condition.all.length === 0)
            return true; // vacuous truth
        return condition.all.every((sub) => evaluateCondition(sub, runtime));
    }
    if ('any' in condition) {
        if (condition.any.length === 0)
            return false;
        return condition.any.some((sub) => evaluateCondition(sub, runtime));
    }
    if ('not' in condition) {
        return !evaluateCondition(condition.not, runtime);
    }
    // Unknown condition shape — safety default
    return false;
}
