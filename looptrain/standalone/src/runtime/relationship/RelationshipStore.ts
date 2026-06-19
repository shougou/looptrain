/**
 * In-memory store for Relationship records.
 *
 * Keyed by npcId within a run.
 */

import type { Relationship } from './Relationship';

export class RelationshipStore {
  private records: Map<string, Relationship> = new Map();

  set(npcId: string, rec: Relationship): void {
    this.records.set(npcId, rec);
  }

  get(npcId: string): Relationship | undefined {
    return this.records.get(npcId);
  }

  getAll(): Relationship[] {
    return Array.from(this.records.values());
  }

  getByRunId(runId: string): Relationship[] {
    const result: Relationship[] = [];
    for (const rec of this.records.values()) {
      if (rec.runId === runId) result.push(rec);
    }
    return result;
  }
}
