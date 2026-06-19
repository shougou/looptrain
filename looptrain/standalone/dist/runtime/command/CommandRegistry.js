"use strict";
/**
 * CommandRegistry — v0.7 command definitions and availability filter.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistry = void 0;
class CommandRegistry {
    constructor(definitions) {
        this.commands = {};
        for (const def of definitions) {
            this.commands[def.id] = def;
        }
    }
    getAll() {
        return Object.values(this.commands);
    }
    getById(id) {
        return this.commands[id];
    }
    getAvailable(state) {
        return this.getAll().filter(cmd => {
            switch (cmd.availableWhen) {
                case 'always':
                    return true;
                case 'in_dialogue':
                    return state.mode === 'dialogue';
                case 'after_failure':
                    return !!state.lastFailure;
                case 'loop_gt_1':
                    return (state.loop || 1) > 1;
                case 'has_carryover':
                    return (state.knownClues && state.knownClues.length > 0) || (state.loop || 1) > 1;
                case 'has_beliefs':
                    return !!state.hasBeliefs;
                default:
                    return true;
            }
        });
    }
}
exports.CommandRegistry = CommandRegistry;
