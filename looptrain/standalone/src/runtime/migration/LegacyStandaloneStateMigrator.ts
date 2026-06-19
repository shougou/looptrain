/**
 * LegacyStandaloneStateMigrator — converts LegacyStandaloneState into MemoryEventDraft[].
 */

import type { MemoryEventDraft } from '../engine/MemoryEventDraft';
import type { MemoryEventType } from '../memory/MemoryEvent';
import type { LegacyStandaloneState } from './LegacyStandaloneState';

export class LegacyStandaloneStateMigrator {
  migrate(
    legacy: LegacyStandaloneState,
    runId: string,
    chapterId: string = 'chapter-01',
    episodeId: string = 'trial-001',
    sceneId: string = 'scene-current'
  ): MemoryEventDraft[] {
    const loopId = `loop_${String(legacy.loop).padStart(4, '0')}_${runId.replace(/^run_/, '').slice(0, 8)}`;
    const drafts: MemoryEventDraft[] = [];

    drafts.push({
      type: 'LOOP_STARTED' as MemoryEventType,
      runId, loopId, chapterId, episodeId, sceneId,
      payload: { loopIndex: legacy.loop, loopId, clock: legacy.clock },
    });

    for (const clueId of legacy.known_clues) {
      drafts.push({
        type: 'CLUE_UNLOCKED' as MemoryEventType,
        runId, loopId, chapterId, episodeId, sceneId,
        payload: { clueId, title: clueId, summary: `Migrated clue: ${clueId}`, confidence: 1.0 },
      });
      drafts.push({
        type: 'KNOWLEDGE_CONFIRMED' as MemoryEventType,
        runId, loopId, chapterId, episodeId, sceneId,
        payload: { clueId, title: clueId, summary: `Confirmed from migration: ${clueId}`, confidence: 1.0 },
      });
    }

    if (legacy.carried_memory && legacy.carried_memory.length > 0) {
      for (const mem of legacy.carried_memory) {
        drafts.push({
          type: 'CARRYOVER_MEMORY_RECORDED' as MemoryEventType,
          runId, loopId, chapterId, episodeId, sceneId,
          payload: { content: mem, title: `Carryover: ${mem}`, summary: mem },
        });
      }
    }

    if (legacy.npc_states) {
      for (const [npcId, state] of Object.entries(legacy.npc_states)) {
        const s = state as Record<string, unknown>;
        drafts.push({
          type: 'RELATIONSHIP_UPDATED' as MemoryEventType,
          runId, loopId, chapterId, episodeId, sceneId,
          payload: {
            npcId,
            trust: (s.trust as number) ?? 50,
            tension: (s.tension as number) ?? 50,
            label: (s.label as string) || npcId,
            note: (s.note as string) || '',
            visibleNote: `Migrated relationship for ${npcId}`,
          },
        });
      }
    }

    if (legacy.location) {
      drafts.push({
        type: 'SCENE_ENTERED' as MemoryEventType,
        runId, loopId, chapterId, episodeId,
        sceneId: legacy.location as string,
        payload: { sceneId: legacy.location, previousSceneId: sceneId },
      });
    }

    return drafts;
  }
}
