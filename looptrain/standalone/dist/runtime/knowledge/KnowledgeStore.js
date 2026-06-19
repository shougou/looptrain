"use strict";
/**
 * In-memory store for Knowledge records.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeStore = void 0;
class KnowledgeStore {
    constructor() {
        this.records = new Map();
    }
    add(rec) {
        this.records.set(rec.id, rec);
    }
    getById(id) {
        return this.records.get(id);
    }
    getByRunId(runId) {
        const result = [];
        for (const rec of this.records.values()) {
            if (rec.runId === runId)
                result.push(rec);
        }
        return result;
    }
    getByLoopId(loopId) {
        const result = [];
        for (const rec of this.records.values()) {
            if (rec.loopId === loopId)
                result.push(rec);
        }
        return result;
    }
    getConfirmed() {
        const result = [];
        for (const rec of this.records.values()) {
            result.push(rec);
        }
        return result;
    }
    getAll() {
        return Array.from(this.records.values());
    }
}
exports.KnowledgeStore = KnowledgeStore;
