# Companion Runtime Design: 许知微

**Status:** Approved design draft  
**Date:** 2026-06-15  
**Scope:** Design only; no implementation plan yet  
**Source draft:** `TBD/01_new_npc.md`  
**Spoiler level:** Core/internal. Do not publish as public character material.

## 1. Goal

Design 许知微 as a future Companion Runtime layer that appears after Memory Runtime is complete. She is not the Memory Runtime itself. She is a player-facing narrative partner that reads a constrained Companion View derived from Memory Runtime and expresses that state through character behavior.

One-sentence principle:

```text
许知微帮助玩家记住自己已经经历过什么，但不替玩家理解真相。
```

## 2. Confirmed decisions

| Decision | Chosen direction |
|---|---|
| Runtime timing | Implement after Memory Runtime, not during v0.6 |
| True identity | Fully design internally, strictly hide from player/public docs |
| Early presence | Medium presence: useful but constrained |
| Formal name | 许知微 |
| Information boundary | Read confirmed Knowledge and player-owned Belief; label beliefs as unconfirmed |
| Proactive behavior | Low-frequency proactive prompts only |
| Error reasoning | Allowed only in Belief layer, never in Knowledge |
| Action ability | No early action ability; unlock later through relationship/timeline/runtime maturity |
| Architecture boundary | Separate Memory Runtime and Companion Runtime specs; connect by Companion View contract |

## 3. Relationship to Memory Runtime

The Narrative State Runtime article defines v0.6 as Memory Runtime only:

```text
v0.6 只做 Memory Runtime，不加 NPC、不加剧情、不做 UI。
```

Therefore 许知微 is not part of v0.6. Her design depends on Memory Runtime being complete enough to provide a safe read-only view.

Required Memory Runtime layers:

- Event Log
- Timeline
- Knowledge
- Belief
- Relationship
- Archive
- Profile
- Reset modes
- structured Prompt Builder input

The Companion must never read raw Memory Runtime internals directly. It reads only a constrained view.

```text
Memory Runtime
  ↓
Companion View Builder
  ↓
Companion View
  ↓
Companion Runtime / 许知微
```

## 4. Companion View contract

The Companion View is a read-only, player-visible projection of Memory Runtime.

Allowed fields:

```text
Knowledge.confirmed.visible
Belief.inferred.player_owned
Timeline.visible_summary
Archive.visible_entries
Relationship.visible_state
Scene.current
```

Forbidden fields:

```text
AuthorTruth
HiddenIdentity
FullMysterySolution
FuturePlot
UnreleasedClues
PrivateDesignNotes
Raw Event Log when not player-visible
```

Invariants:

1. Engine is the only writer of Knowledge, Belief, Relationship, Timeline, Archive, and action outcomes.
2. Companion Runtime is read-only against Memory Runtime state.
3. LLM can generate expression text but cannot create facts, update beliefs, or trigger actions.
4. Any Companion output must be validated before being shown to the player.

## 5. Role positioning

许知微 has three layers.

### 5.1 Surface identity

To the player, she is a young journalist traveling on the train.

Player-visible traits:

- observant
- curious
- good at recording details
- not forceful
- sometimes wrong
- useful as a memory companion, not a guide

Public material may describe her as:

```text
年轻记者，观察敏锐，喜欢记录，在列车上与玩家同行。
```

Public material must not describe her as:

```text
Narrative Runtime interface
hidden truth carrier
loop-aware entity
future key to the mystery
```

### 5.2 Functional identity

After Memory Runtime exists, she becomes the natural interface for player cognition:

- What has the player confirmed?
- What does the player currently suspect?
- What happened in earlier visible timelines?
- What has been archived across loops?

### 5.3 Hidden identity

Internally, she is designed as the personified interface of Narrative Runtime. This must remain hidden in early gameplay and public documents.

## 6. Early capability boundary

Early stage uses medium presence.

Allowed:

- summarize confirmed clues
- summarize seen NPCs
- restate visible timeline events
- restate player-owned beliefs as unconfirmed
- ask whether the player wants to organize current notes
- low-frequency reminders after meaningful state changes

Forbidden:

- tell the player the next action
- solve a puzzle
- reveal hidden truth
- leave player view to investigate
- trigger world state changes
- create new clues
- modify AP, time, NPC state, or loop outcome

Example allowed response:

```text
目前能确认的是：小宁听到过滴答声；声音不一定来自座位本身。你现在似乎也在怀疑赵乘警，但这还只是推测。
```

Example forbidden response:

```text
你下一步应该去检查地板。
```

## 7. Knowledge / Belief / Action rules

### 7.1 Knowledge

Knowledge is confirmed fact.

Rules:

- Companion cannot create Knowledge.
- Companion cannot modify Knowledge.
- Companion can only restate or organize confirmed Knowledge.
- Belief cannot become Knowledge without Engine confirmation.

### 7.2 Belief

Belief is inference.

Rules:

- Belief must carry confidence, source, and uncertainty.
- Belief can be wrong.
- Belief can be contradicted by later Knowledge.
- Companion may express uncertainty, but must not state Belief as fact.

Example shape:

```yaml
belief:
  shen_mohan:
    knows_more_than_says:
      value: true
      confidence: 0.55
      source: player_suspicion
      status: unconfirmed
```

### 7.3 Action

Early action state is locked.

Later action abilities may unlock through:

- relationship trust
- shared loops
- confirmed clue count
- stable beliefs
- archive depth
- Companion Action Runtime support

All actions must remain Engine-judged and carry cost, risk, or failure possibility.

## 8. Proactive behavior

许知微 may speak proactively only at low frequency.

Allowed triggers:

- new confirmed clue acquired
- loop reset / new loop start
- player stalls for a long time
- player belief conflicts with visible facts

Allowed proactive tone:

```text
要不要先把现在知道的事整理一下？
```

Forbidden proactive tone:

```text
你应该去找赵乘警。
```

## 9. Error reasoning

许知微 should remain human, not an oracle. She may be wrong, but only in Belief space.

Rules:

- wrong reasoning must never write to Knowledge
- wrong reasoning must be uncertain
- wrong reasoning must have confidence below certainty
- wrong reasoning must be reversible by later facts
- player must remain the final reasoner

Principle:

```text
许知微可以想错，但系统不能记错。
```

## 10. Unlock progression

### Phase 0: Surface passenger

Timing: before Memory Runtime is complete.

Capabilities:

- normal NPC dialogue
- minor observation comments
- no memory UI
- no hint system
- no action ability

Purpose: establish presence and record-oriented personality.

### Phase 1: Record companion

Timing: Knowledge and Belief layers are available.

Capabilities:

- summarize confirmed clues
- summarize seen NPCs
- label player beliefs as unconfirmed
- low-frequency prompts to organize records

This is the confirmed medium-presence phase.

### Phase 2: Memory interface

Timing: Timeline, Archive, and Reset rules are stable.

Capabilities:

- summarize previous visible loop events
- compare current loop against visible prior loops
- reference Archive entries
- expose lightweight interview notebook behavior

Still forbidden: explaining hidden runtime rules before the player confirms them.

### Phase 3: Collaborative actor

Timing: Relationship and Companion Action Runtime are mature.

Capabilities may include:

- asking non-critical questions
- observing nearby context
- helping stall an NPC
- organizing scene records

Constraints:

- Engine judges all actions
- actions have time/AP/risk cost
- no automatic core clue acquisition
- no puzzle solving on behalf of the player

## 11. Spoiler governance

Documents must be split into layers.

### Core draft

Path:

```text
TBD/01_new_npc.md
```

Contains full identity and long-term hidden design. Remains `spoilerLevel: core`.

### Formal internal design

Target:

```text
devlog/src/content/design/companion-runtime.md
```

Can contain runtime dependencies and boundaries. Should avoid full final-truth disclosure unless marked internal/core.

### Public character page

Target:

```text
devlog/src/content/characters/xu-zhiwei.md
```

May contain only surface identity and non-spoiler traits.

## 12. Out of scope for first implementation

- Memory Runtime implementation
- Companion View Builder implementation
- Archive UI implementation
- full Companion Action Runtime
- true identity reveal
- awakening plot
- hidden truth explanation
- free-chat assistant mode
- direct hint / walkthrough system

## 13. Open follow-up design tasks

These should be separate specs or future sections:

1. Memory-Companion Interface Contract
2. Companion Output Validator
3. Companion View schema
4. Public character profile for 许知微
5. Companion Action Runtime unlock rules
6. Companion prompt safety tests

## 14. Final summary

许知微 is a future Narrative Partner, not an early menu. She appears after Memory Runtime provides a safe Companion View. She can help the player organize confirmed facts and player-owned beliefs, can be uncertain, can be wrong in Belief space, and can later unlock limited actions through relationship growth. She never owns truth, never writes state, and never bypasses Engine.
