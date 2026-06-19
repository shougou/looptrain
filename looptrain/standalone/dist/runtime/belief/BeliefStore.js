"use strict";
/**
 * In-memory store for Belief records.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeliefStore = void 0;
class BeliefStore {
    constructor() {
        this.records = new Map();
    }
    add(rec) {
        this.records.set(rec.id, rec);
    }
    update(id, partial) {
        const existing = this.records.get(id);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...partial };
        this.records.set(id, updated);
        return updated;
    }
    getById(id) {
        return this.records.get(id);
    }
    getByTarget(target) {
        const result = [];
        for (const rec of this.records.values()) {
            if (rec.target === target)
                result.push(rec);
        }
        return result;
    }
    getUnconfirmed() {
        const result = [];
        for (const rec of this.records.values()) {
            if (rec.status === 'unconfirmed')
                result.push(rec);
        }
        return result;
    }
    getByRunId(runId) {
        const result = [];
        for (const rec of this.records.values()) {
            if (rec.runId === runId)
                result.push(rec);
        }
        return result;
    }
    getAll() {
        return Array.from(this.records.values());
    }
}
exports.BeliefStore = BeliefStore;
