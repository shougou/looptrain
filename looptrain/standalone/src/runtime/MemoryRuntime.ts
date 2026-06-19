/**
 * MemoryRuntime — main Narrative State Runtime class.
 *
 * Composes InMemoryMemoryStorage, MemoryProjector, and MemoryEventDraftAppender.
 * This is the single entry point for all runtime state operations.
 */

import type { MemoryEvent } from './memory/MemoryEvent';
import type { MemoryEventDraft } from './engine/MemoryEventDraft';
import { InMemoryMemoryStorage } from './storage/InMemoryMemoryStorage';
import { MemoryProjector } from './memory/MemoryProjector';
import type { ProjectedLayers } from './memory/MemoryProjector';
import { MemoryEventDraftAppender } from './memory/MemoryEventDraftAppender';
import type { Snapshot } from './snapshot/Snapshot';
import type { Profile } from './profile/Profile';
import type { Knowledge } from './knowledge/Knowledge';
import type { Belief } from './belief/Belief';
import type { Relationship } from './relationship/Relationship';
import type { Timeline } from './timeline/Timeline';
import type { Archive } from './archive/Archive';
import { generatePlayerId, generateRunId, generateLoopId, generateSnapshotId } from './ids/RuntimeIdGenerator';

export interface RuntimeState {
  events: MemoryEvent[];
  knowledge: Knowledge[];
  beliefs: Belief[];
  relationships: Relationship[];
  timeline: Timeline[];
  archive: Archive[];
}

export class MemoryRuntime {
  readonly storage: InMemoryMemoryStorage;
  private projector: MemoryProjector;
  private appender: MemoryEventDraftAppender | null;
  private snapshotSeq: number;

  constructor(storage?: InMemoryMemoryStorage) {
    this.storage = storage ?? new InMemoryMemoryStorage();
    this.projector = new MemoryProjector();
    this.appender = null;
    this.snapshotSeq = 0;
  }

  initialize(runId: string, chapterId: string, episodeId: string): void {
    const playerId = generatePlayerId();
    const loopId = generateLoopId(1, runId.replace(/^run_/, '').slice(0, 8));
    const sceneId = 'scene-current';
    const now = new Date().toISOString();

    const profile: Profile = {
      version: 'v1',
      playerId,
      createdAt: now,
      updatedAt: now,
      settings: {},
    };
    this.storage.profile.set(profile);

    const drafts: MemoryEventDraft[] = [
      {
        type: 'LOOP_STARTED' as MemoryEvent['type'],
        runId,
        loopId,
        chapterId,
        episodeId,
        sceneId,
        payload: { playerId, chapterId, episodeId, runId },
      },
      {
        type: 'LOOP_STARTED' as MemoryEvent['type'],
        runId,
        loopId,
        chapterId,
        episodeId,
        sceneId,
        payload: { loopIndex: 1, loopId },
      },
    ];

    this.appender = new MemoryEventDraftAppender(0, null);
    const events = this.appender.append(drafts);
    this.storage.events.push(...events);
  }

  appendEvents(drafts: MemoryEventDraft[]): MemoryEvent[] {
    if (!this.appender) {
      this.appender = new MemoryEventDraftAppender(
        this.storage.events.length > 0
          ? this.storage.events[this.storage.events.length - 1].eventSeq
          : 0,
        this.storage.events.length > 0
          ? this.storage.events[this.storage.events.length - 1].eventId
          : null
      );
    }

    const events = this.appender.append(drafts);
    this.storage.events.push(...events);
    return events;
  }

  project(): ProjectedLayers {
    return this.projector.project(this.storage.events);
  }

  getState(): RuntimeState {
    const projected = this.project();
    return {
      events: this.storage.events,
      knowledge: projected.knowledge,
      beliefs: projected.beliefs,
      relationships: projected.relationships,
      timeline: projected.timeline,
      archive: projected.archive,
    };
  }

  takeSnapshot(): Snapshot {
    this.snapshotSeq++;
    const projected = this.project();
    const runId = this.storage.events.length > 0
      ? this.storage.events[0].runId
      : 'run_unknown';
    const runShortId = runId.replace(/^run_/, '').slice(0, 8);
    const loopId = this.storage.events.length > 0
      ? this.storage.events[this.storage.events.length - 1].loopId
      : 'loop_0000_unknown';

    const snapshot: Snapshot = {
      snapshotId: generateSnapshotId(this.snapshotSeq, runShortId),
      runId,
      loopId,
      eventSeq: this.appender ? this.appender.getEventSeq() : this.storage.events.length,
      timestamp: new Date().toISOString(),
      knowledge: projected.knowledge,
      beliefs: projected.beliefs,
      relationships: projected.relationships,
      timeline: projected.timeline,
      archive: projected.archive,
    };

    this.storage.snapshots.push(snapshot);
    return snapshot;
  }

  applySnapshot(snapshot: Snapshot): void {
    this.storage.events = [];
    this.storage.snapshots = [];
    this.appender = null;

    for (const k of snapshot.knowledge) {
      this.storage.knowledge.add(k);
    }
    for (const b of snapshot.beliefs) {
      this.storage.belief.add(b);
    }
    for (const r of snapshot.relationships) {
      this.storage.relationship.set(r.npcId, r);
    }
    for (const t of snapshot.timeline) {
      this.storage.timeline.add(t);
    }
    for (const a of snapshot.archive) {
      this.storage.archive.add(a);
    }
    this.storage.snapshots.push(snapshot);

    this.appender = new MemoryEventDraftAppender(snapshot.eventSeq, null);
  }
}
