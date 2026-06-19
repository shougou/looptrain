/**
 * In-memory store for Belief records.
 */

import type { Belief } from './Belief';

export class BeliefStore {
  private records: Map<string, Belief> = new Map();

  add(rec: Belief): void {
    this.records.set(rec.id, rec);
  }

  update(id: string, partial: Partial<Omit<Belief, 'id' | 'runId' | 'createdAt'>>): Belief | undefined {
    const existing = this.records.get(id);
    if (!existing) return undefined;
    const updated: Belief = { ...existing, ...partial };
    this.records.set(id, updated);
    return updated;
  }

  getById(id: string): Belief | undefined {
    return this.records.get(id);
  }

  getByTarget(target: string): Belief[] {
    const result: Belief[] = [];
    for (const rec of this.records.values()) {
      if (rec.target === target) result.push(rec);
    }
    return result;
  }

  getUnconfirmed(): Belief[] {
    const result: Belief[] = [];
    for (const rec of this.records.values()) {
      if (rec.status === 'unconfirmed') result.push(rec);
    }
    return result;
  }

  getByRunId(runId: string): Belief[] {
    const result: Belief[] = [];
    for (const rec of this.records.values()) {
      if (rec.runId === runId) result.push(rec);
    }
    return result;
  }

  getAll(): Belief[] {
    return Array.from(this.records.values());
  }
}
