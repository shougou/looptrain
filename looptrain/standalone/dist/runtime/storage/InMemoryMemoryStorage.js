"use strict";
/**
 * InMemoryMemoryStorage — composes all record stores, event log, and snapshots
 * into a single in-memory storage class.
 *
 * This is the canonical in-memory storage for v0.6.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryMemoryStorage = void 0;
const KnowledgeStore_1 = require("../knowledge/KnowledgeStore");
const BeliefStore_1 = require("../belief/BeliefStore");
const RelationshipStore_1 = require("../relationship/RelationshipStore");
const TimelineStore_1 = require("../timeline/TimelineStore");
const ArchiveStore_1 = require("../archive/ArchiveStore");
const ProfileStore_1 = require("../profile/ProfileStore");
class InMemoryMemoryStorage {
    constructor() {
        this.knowledge = new KnowledgeStore_1.KnowledgeStore();
        this.belief = new BeliefStore_1.BeliefStore();
        this.relationship = new RelationshipStore_1.RelationshipStore();
        this.timeline = new TimelineStore_1.TimelineStore();
        this.archive = new ArchiveStore_1.ArchiveStore();
        this.profile = new ProfileStore_1.ProfileStore();
        this.events = [];
        this.snapshots = [];
    }
}
exports.InMemoryMemoryStorage = InMemoryMemoryStorage;
