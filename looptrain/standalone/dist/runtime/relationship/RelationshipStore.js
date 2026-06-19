"use strict";
/**
 * In-memory store for Relationship records.
 *
 * Keyed by npcId within a run.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipStore = void 0;
class RelationshipStore {
    constructor() {
        this.records = new Map();
    }
    set(npcId, rec) {
        this.records.set(npcId, rec);
    }
    get(npcId) {
        return this.records.get(npcId);
    }
    getAll() {
        return Array.from(this.records.values());
    }
    getByRunId(runId) {
        const result = [];
        for (const rec of this.records.values()) {
            if (rec.runId === runId)
                result.push(rec);
        }
        return result;
    }
}
exports.RelationshipStore = RelationshipStore;
