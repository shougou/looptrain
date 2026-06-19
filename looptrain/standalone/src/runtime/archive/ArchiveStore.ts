/**
 * In-memory store for Archive entries.
 */

import type { Archive } from './Archive';

export class ArchiveStore {
  private records: Map<string, Archive> = new Map();

  add(rec: Archive): void {
    this.records.set(rec.id, rec);
  }

  getById(id: string): Archive | undefined {
    return this.records.get(id);
  }

  getByRunId(runId: string): Archive[] {
    const result: Archive[] = [];
    for (const rec of this.records.values()) {
      if (rec.runId === runId) result.push(rec);
    }
    return result;
  }

  getAll(): Archive[] {
    return Array.from(this.records.values());
  }
}
