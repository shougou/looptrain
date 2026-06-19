/**
 * InMemoryMemoryStorage — composes all record stores, event log, and snapshots
 * into a single in-memory storage class.
 *
 * This is the canonical in-memory storage for v0.6.0.
 */

import type { MemoryEvent } from '../memory/MemoryEvent';

import { KnowledgeStore } from '../knowledge/KnowledgeStore';
import { BeliefStore } from '../belief/BeliefStore';
import { RelationshipStore } from '../relationship/RelationshipStore';
import { TimelineStore } from '../timeline/TimelineStore';
import { ArchiveStore } from '../archive/ArchiveStore';
import { ProfileStore } from '../profile/ProfileStore';
import type { Snapshot } from '../snapshot/Snapshot';

export class InMemoryMemoryStorage {
  readonly knowledge: KnowledgeStore;
  readonly belief: BeliefStore;
  readonly relationship: RelationshipStore;
  readonly timeline: TimelineStore;
  readonly archive: ArchiveStore;
  readonly profile: ProfileStore;

  events: MemoryEvent[];
  snapshots: Snapshot[];

  constructor() {
    this.knowledge = new KnowledgeStore();
    this.belief = new BeliefStore();
    this.relationship = new RelationshipStore();
    this.timeline = new TimelineStore();
    this.archive = new ArchiveStore();
    this.profile = new ProfileStore();
    this.events = [];
    this.snapshots = [];
  }
}
