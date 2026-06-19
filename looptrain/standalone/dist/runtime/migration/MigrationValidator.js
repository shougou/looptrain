"use strict";
/**
 * MigrationValidator — validates that a MemoryRuntime correctly reflects
 * the legacy standalone state after migration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMigration = validateMigration;
function validateMigration(runtime, legacy) {
    const errors = [];
    const state = runtime.getState();
    for (const clueId of legacy.known_clues) {
        const found = state.knowledge.some((k) => k.clueId === clueId || k.title === clueId);
        if (!found) {
            errors.push(`Missing knowledge for known clue: ${clueId}`);
        }
    }
    if (legacy.carried_memory && legacy.carried_memory.length > 0) {
        const hasCarryover = state.knowledge.some((k) => legacy.carried_memory.some((cm) => k.title.includes(cm) || k.summary.includes(cm)));
        if (!hasCarryover) {
            errors.push('Missing carryover memory records');
        }
    }
    if (legacy.npc_states) {
        for (const npcId of Object.keys(legacy.npc_states)) {
            const found = state.relationships.some((r) => r.npcId === npcId);
            if (!found) {
                errors.push(`Missing relationship for NPC: ${npcId}`);
            }
        }
    }
    const allText = [
        ...state.knowledge.map((k) => k.summary),
        ...state.archive.map((a) => a.summary),
        ...state.timeline.map((t) => t.summary),
    ].join(' ');
    if (allText.includes('dialogue_session')) {
        errors.push('dialogue_session leaked into long-term memory records');
    }
    return { valid: errors.length === 0, errors };
}
