"use strict";
/**
 * ResetApplier — applies a ResetPlan to a MemoryRuntime by appending all reset events.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyReset = applyReset;
function applyReset(runtime, plan) {
    return runtime.appendEvents(plan.drafts);
}
