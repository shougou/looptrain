/**
 * In-memory store for Knowledge records.
 */

import type { Knowledge } from './Knowledge';

export class KnowledgeStore {
  private records: Map<string, Knowledge> = new Map();

  add(rec: Knowledge): void {
    this.records.set(rec.id, rec);
  }

  getById(id: string): Knowledge | undefined {
    return this.records.get(id);
  }

  getByRunId(runId: string): Knowledge[] {
    const result: Knowledge[] = [];
    for (const rec of this.records.values()) {
      if (rec.runId === runId) result.push(rec);
    }
    return result;
  }

  getByLoopId(loopId: string): Knowledge[] {
    const result: Knowledge[] = [];
    for (const rec of this.records.values()) {
      if (rec.loopId === loopId) result.push(rec);
    }
    return result;
  }

  getConfirmed(): Knowledge[] {
    const result: Knowledge[] = [];
    for (const rec of this.records.values()) {
      result.push(rec);
    }
    return result;
  }

  getAll(): Knowledge[] {
    return Array.from(this.records.values());
  }
}
