"use strict";
/**
 * In-memory store for Archive entries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveStore = void 0;
class ArchiveStore {
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
    getAll() {
        return Array.from(this.records.values());
    }
}
exports.ArchiveStore = ArchiveStore;
