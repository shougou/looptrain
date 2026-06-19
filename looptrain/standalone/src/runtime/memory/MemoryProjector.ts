/**
 * MemoryProjector — walks MemoryEvent[] and projects them into
 * Knowledge, Belief, Relationship, Timeline, and Archive records.
 *
 * Engine judges. Runtime records. Memory projects.
 */

import type { MemoryEvent, MemoryEventType } from './MemoryEvent';
import type { Knowledge } from '../knowledge/Knowledge';
import type { Belief } from '../belief/Belief';
import type { Relationship } from '../relationship/Relationship';
import type { Timeline } from '../timeline/Timeline';
import type { Archive } from '../archive/Archive';

export interface ProjectedLayers {
  knowledge: Knowledge[];
  beliefs: Belief[];
  relationships: Relationship[];
  timeline: Timeline[];
  archive: Archive[];
}

export class MemoryProjector {
  project(events: MemoryEvent[]): ProjectedLayers {
    const knowledgeMap = new Map<string, Knowledge>();
    const beliefMap = new Map<string, Belief>();
    const relationshipMap = new Map<string, Relationship>();
    const timeline: Timeline[] = [];
    const archive: Archive[] = [];

    for (const evt of events) {
      switch (evt.type as MemoryEventType) {
        case 'KNOWLEDGE_CONFIRMED':
          this.projectKnowledgeConfirmed(evt, knowledgeMap);
          break;
        case 'BELIEF_CREATED':
          this.projectBeliefCreated(evt, beliefMap);
          break;
        case 'BELIEF_UPDATED':
          this.projectBeliefUpdated(evt, beliefMap);
          break;
        case 'BELIEF_CONTRADICTED':
          this.projectBeliefContradicted(evt, beliefMap);
          break;
        case 'BELIEF_CONFIRMED':
          this.projectBeliefConfirmed(evt, beliefMap);
          break;
        case 'RELATIONSHIP_UPDATED':
          this.projectRelationshipUpdated(evt, relationshipMap);
          break;
        case 'LOOP_FAILED':
        case 'LOOP_OUTCOME_RECORDED':
          this.projectLoopOutcome(evt, timeline);
          break;
        // TIMELINE_ENTRY_CREATED handled via LOOP_OUTCOME_RECORDED
        // ARCHIVE_ENTRY_CREATED handled via LOOP_OUTCOME_RECORDED
        case 'CARRYOVER_MEMORY_RECORDED':
          this.projectCarryoverMemory(evt, knowledgeMap);
          break;
        case 'CLUE_UNLOCKED':
          this.projectClueUnlocked(evt, knowledgeMap);
          break;
        default:
          break;
      }
    }

    return {
      knowledge: Array.from(knowledgeMap.values()),
      beliefs: Array.from(beliefMap.values()),
      relationships: Array.from(relationshipMap.values()),
      timeline,
      archive,
    };
  }

  private projectKnowledgeConfirmed(
    evt: MemoryEvent,
    map: Map<string, Knowledge>
  ): void {
    const p = evt.payload as Record<string, unknown>;
    const rec: Knowledge = {
      id: (p.knowledgeId as string) || `know_${evt.eventId}`,
      runId: evt.runId,
      loopId: evt.loopId,
      clueId: (p.clueId as string) || '',
      title: (p.title as string) || '',
      summary: (p.summary as string) || '',
      sourceEventId: evt.eventId,
      confidence: (p.confidence as number) ?? 1.0,
      confirmedAt: evt.createdAt,
      visibility: 'player_visible',
    };
    map.set(rec.id, rec);
  }

  private projectBeliefCreated(
    evt: MemoryEvent,
    map: Map<string, Belief>
  ): void {
    const p = evt.payload as Record<string, unknown>;
    const rec: Belief = {
      id: (p.beliefId as string) || `belief_${evt.eventId}`,
      runId: evt.runId,
      loopId: evt.loopId,
      target: (p.target as string) || '',
      statement: (p.statement as string) || (p.content as string) || '',
      confidence: (p.confidence as number) ?? 0.5,
      source: (p.source as Belief['source']) || 'player_suspicion',
      status: 'unconfirmed',
      createdAt: evt.createdAt,
    };
    map.set(rec.id, rec);
  }

  private projectBeliefUpdated(
    evt: MemoryEvent,
    map: Map<string, Belief>
  ): void {
    const p = evt.payload as Record<string, unknown>;
    const id = (p.beliefId as string) || '';
    if (!id) return;
    const existing = map.get(id);
    if (existing) {
      map.set(id, {
        ...existing,
        statement: (p.statement as string) || (p.content as string) || existing.statement,
        confidence: (p.confidence as number) ?? existing.confidence,
        status: 'strengthened',
      });
    }
  }

  private projectBeliefContradicted(
    evt: MemoryEvent,
    map: Map<string, Belief>
  ): void {
    const p = evt.payload as Record<string, unknown>;
    const id = (p.beliefId as string) || '';
    if (!id) return;
    const existing = map.get(id);
    if (existing) {
      map.set(id, { ...existing, status: 'contradicted' });
    }
  }

  private projectBeliefConfirmed(
    evt: MemoryEvent,
    map: Map<string, Belief>
  ): void {
    const p = evt.payload as Record<string, unknown>;
    const id = (p.beliefId as string) || '';
    if (!id) return;
    const existing = map.get(id);
    if (existing) {
      map.set(id, { ...existing, status: 'confirmed', confidence: 1.0 });
    }
  }

  private projectRelationshipUpdated(
    evt: MemoryEvent,
    map: Map<string, Relationship>
  ): void {
    const p = evt.payload as Record<string, unknown>;
    const npcId = (p.npcId as string) || '';
    if (!npcId) return;
    const existing = map.get(npcId);
    const rec: Relationship = {
      npcId,
      runId: evt.runId,
      label: (p.label as string) || existing?.label || '',
      trust: existing
        ? existing.trust + ((p.trustDelta as number) ?? 0)
        : ((p.trust as number) ?? 50),
      tension: existing
        ? existing.tension + ((p.tensionDelta as number) ?? 0)
        : ((p.tension as number) ?? 50),
      note: (p.note as string) || (p.visibleNote as string) || existing?.note || '',
      updatedAt: evt.createdAt,
    };
    map.set(npcId, rec);
  }

  private projectLoopOutcome(evt: MemoryEvent, timeline: Timeline[]): void {
    timeline.push({
      id: `tl_${evt.eventId}`,
      runId: evt.runId,
      loopNo: parseInt(evt.loopId.replace(/[^0-9]/g, '').slice(0, 4), 10) || 0,
      summary: `Loop ${evt.type === 'LOOP_FAILED' ? 'failed' : 'outcome recorded'} at ${evt.createdAt}`,
      outcome: evt.type === 'LOOP_FAILED' ? 'failed' : 'recorded',
      keyEventIds: [evt.eventId],
      createdAt: evt.createdAt,
    });
  }

  private projectTimelineEntry(evt: MemoryEvent, timeline: Timeline[]): void {
    const p = evt.payload as Record<string, unknown>;
    timeline.push({
      id: `tl_${evt.eventId}`,
      runId: evt.runId,
      loopNo: parseInt(evt.loopId.replace(/[^0-9]/g, '').slice(0, 4), 10) || 0,
      summary: (p.summary as string) || (p.eventSummary as string) || '',
      keyEventIds: [evt.eventId],
      createdAt: evt.createdAt,
    });
  }

  private projectArchiveEntry(evt: MemoryEvent, archive: Archive[]): void {
    const p = evt.payload as Record<string, unknown>;
    archive.push({
      id: `arch_${evt.eventId}`,
      runId: evt.runId,
      title: (p.title as string) || `Loop Archive ${evt.loopId}`,
      summary: (p.summary as string) || '',
      sourceEventIds: [evt.eventId],
      archivedAt: evt.createdAt,
    });
  }

  private projectCarryoverMemory(
    evt: MemoryEvent,
    map: Map<string, Knowledge>
  ): void {
    const p = evt.payload as Record<string, unknown>;
    const rec: Knowledge = {
      id: `carry_${evt.eventId}`,
      runId: evt.runId,
      loopId: evt.loopId,
      clueId: (p.clueId as string) || 'carryover',
      title: (p.title as string) || 'Carryover Memory',
      summary: (p.summary as string) || (p.content as string) || '',
      sourceEventId: evt.eventId,
      confidence: 1.0,
      confirmedAt: evt.createdAt,
      visibility: 'player_visible',
    };
    map.set(rec.id, rec);
  }

  private projectClueUnlocked(
    evt: MemoryEvent,
    map: Map<string, Knowledge>
  ): void {
    const p = evt.payload as Record<string, unknown>;
    const rec: Knowledge = {
      id: `clue_${evt.eventId}`,
      runId: evt.runId,
      loopId: evt.loopId,
      clueId: (p.clueId as string) || '',
      title: (p.title as string) || (p.clueId as string) || '',
      summary: (p.summary as string) || '',
      sourceEventId: evt.eventId,
      confidence: (p.confidence as number) ?? 1.0,
      confirmedAt: evt.createdAt,
      visibility: 'player_visible',
    };
    map.set(rec.id, rec);
  }
}
