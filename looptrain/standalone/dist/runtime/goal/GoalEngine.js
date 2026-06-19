"use strict";
/**
 * GoalEngine — v0.7 modular goal evaluation engine.
 * Evaluates GoalDefinitions against runtime state each tick,
 * tracking activation, completion, and newly-completed feedback.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalEngine = void 0;
const GoalEvaluator_1 = require("./GoalEvaluator");
class GoalEngine {
    constructor(definitions) {
        /** Tracks the last known status of each goal to detect transitions. */
        this.previousStates = new Map(); // goalId → status
        this.definitions = definitions;
    }
    /**
     * Evaluate all goal definitions against the current runtime state.
     *
     * @param runtime — snapshot of events, knownClues, confirmedFacts, and game state
     * @returns GoalEngineResult with active, completed, and newly-completed goals
     */
    evaluate(runtime) {
        const result = {
            goalStates: {},
            activeGoals: [],
            completedGoals: [],
            newlyCompleted: [],
        };
        for (const def of this.definitions) {
            // ── Gate: activation condition ─────────────────────────
            if (def.activationCondition && !(0, GoalEvaluator_1.evaluateCondition)(def.activationCondition, runtime)) {
                continue;
            }
            // ── Gate: loop range ───────────────────────────────────
            if (def.loopRange) {
                const currentLoop = runtime.state.loop || 1;
                if (currentLoop < def.loopRange[0] || currentLoop > def.loopRange[1]) {
                    continue;
                }
            }
            // ── Check completion ───────────────────────────────────
            const completed = (0, GoalEvaluator_1.evaluateCondition)(def.completionCondition, runtime);
            const prevStatus = this.previousStates.get(def.id) || 'inactive';
            const status = completed
                ? 'completed'
                : def.activationCondition
                    ? 'active'
                    : 'inactive';
            const instance = {
                goalId: def.id,
                title: def.title,
                status,
            };
            // Track newly-completed goals (first-time completion)
            if (completed && !def.feedbackDelivered) {
                instance.completedAt = new Date().toISOString();
                instance.feedbackDelivered = true;
                if (prevStatus !== 'completed') {
                    result.newlyCompleted.push(instance);
                }
                def.feedbackDelivered = true;
            }
            // Populate result
            result.goalStates[def.id] = instance;
            if (status === 'active')
                result.activeGoals.push(instance);
            if (status === 'completed')
                result.completedGoals.push(instance);
            this.previousStates.set(def.id, status);
        }
        return result;
    }
}
exports.GoalEngine = GoalEngine;
