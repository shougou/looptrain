"use strict";
/**
 * In-memory store for Timeline entries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineStore = void 0;
class TimelineStore {
    constructor() {
        this.records = new Map();
    }
    add(rec) {
        this.records.set(rec.id, rec);
    }
    getByLoopNo(loopNo) {
        const result = [];
        for (const rec of this.records.values()) {
            if (rec.loopNo === loopNo)
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
exports.TimelineStore = TimelineStore;
