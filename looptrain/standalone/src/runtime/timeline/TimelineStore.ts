/**
 * In-memory store for Timeline entries.
 */

import type { Timeline } from './Timeline';

export class TimelineStore {
  private records: Map<string, Timeline> = new Map();

  add(rec: Timeline): void {
    this.records.set(rec.id, rec);
  }

  getByLoopNo(loopNo: number): Timeline[] {
    const result: Timeline[] = [];
    for (const rec of this.records.values()) {
      if (rec.loopNo === loopNo) result.push(rec);
    }
    return result;
  }

  getByRunId(runId: string): Timeline[] {
    const result: Timeline[] = [];
    for (const rec of this.records.values()) {
      if (rec.runId === runId) result.push(rec);
    }
    return result;
  }

  getAll(): Timeline[] {
    return Array.from(this.records.values());
  }
}
