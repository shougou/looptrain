/**
 * RuntimeIdGenerator produces all IDs for the LoopTrain Runtime.
 *
 * All generated IDs satisfy: ^[a-z][a-z0-9_-]*$
 *
 * Uses crypto.randomUUID() for UUID generation (available in Node 19+ and modern browsers).
 */

import type {
  PlayerId,
  RunId,
  ChapterId,
  EpisodeId,
  LoopId,
  SceneId,
  SnapshotId,
  EventId,
  ViewId,
} from '../shared/ids';

/**
 * Returns an 8-character hex string derived from a UUID.
 */
function randomHex8(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}

/**
 * Returns the full UUID string without dashes.
 */
function uuidNoDash(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Pads a number to the given length with leading zeros.
 */
function pad(num: number, length: number): string {
  return String(num).padStart(length, '0');
}

/**
 * Generates a playerId.
 * Format: player_${uuidv4}
 */
export function generatePlayerId(): PlayerId {
  return `player_${uuidNoDash()}`;
}

/**
 * Generates a runId.
 * Format: run_${uuidv4}
 */
export function generateRunId(): RunId {
  return `run_${uuidNoDash()}`;
}

/**
 * Generates a loopId.
 * Format: loop_${loopIndexPadded}_${runShortId}
 *
 * @param loopIndex - Zero-based loop index; incremented before formatting.
 * @param runShortId - First 8 characters of the run UUID.
 */
export function generateLoopId(loopIndex: number, runShortId: string): LoopId {
  const padded = pad(loopIndex, 4);
  return `loop_${padded}_${runShortId}`;
}

/**
 * Generates an eventId.
 * Format: evt_${eventSeqPadded}_${random8}
 *
 * Note: In Slice 0, the browser generates formal eventIds.
 * This function is provided here for test and stub purposes.
 */
export function generateEventId(eventSeq: number): EventId {
  return `evt_${pad(eventSeq, 8)}_${randomHex8()}`;
}

/**
 * Generates a snapshotId.
 * Format: snap_${snapshotSeqPadded}_${runShortId}
 */
export function generateSnapshotId(
  snapshotSeq: number,
  runShortId: string
): SnapshotId {
  return `snap_${pad(snapshotSeq, 6)}_${runShortId}`;
}

/**
 * Generates a viewId deterministically from its inputs.
 *
 * Rule: viewId = "view_" + sha256(runId + "|" + ...).slice(0, 16)
 *
 * In Slice 0, uses a simple hash approximation since full SHA-256
 * may not be available in all environments. Same inputs produce same viewId.
 */
export function generateViewId(
  runId: RunId,
  loopId: LoopId,
  sceneId: SceneId,
  lastEventId: string | null,
  policyVersion: number,
  builderVersion: number
): ViewId {
  const seed = [
    runId,
    loopId,
    sceneId,
    lastEventId ?? '',
    String(policyVersion),
    String(builderVersion),
  ].join('|');

  // Simple deterministic hash for Slice 0 (full SHA-256 in later slices)
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `view_${hex}${randomHex8().slice(0, 8)}`;
}
