"use strict";
/**
 * ResetPolicy — defines what resets and what carries over between loops.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResetPolicy = getResetPolicy;
function getResetPolicy() {
    return {
        resets: [
            'TIME_RESET',
            'AP_RESET',
            'SCENE_CHANGED',
        ],
        carries: [
            'KNOWLEDGE_CONFIRMED',
            'BELIEF_CREATED',
            'BELIEF_UPDATED',
            'RELATIONSHIP_UPDATED',
            'TIMELINE_ENTRY_CREATED',
            'ARCHIVE_ENTRY_CREATED',
            'CARRYOVER_MEMORY_RECORDED',
            'CARRYOVER_MEMORY_APPLIED',
        ],
    };
}
