# Project Structure

**Project:** LoopTrain Standalone Runtime  
**Generated:** 2026-06-26  
**Purpose:** Quick file-structure map for developers and agents working from the repository root.

---

## Root layout

```text
11_looptrain/
├── README.md                         # Root project overview
├── MANIFEST.json                     # Machine-readable project facts
├── DEPLOYMENT.md                     # Deployment notes
├── PROJECT_STRUCTURE.md              # This file
├── UX-UI.md                          # UX/UI design direction document
├── VERSION                           # Single source of truth for version
├── scripts/                          # Root operational scripts (10 files)
├── looptrain/                        # Main game runtime, materials, tests
├── devlog/                           # Astro static site for looptrain.me
├── docs/                             # Root-level architecture/spec docs
├── .omo/                             # OhMyOpenCode planning artifacts
├── .opencode/                        # OpenCode configuration
├── .gitignore
└── .git/
```

---

## Main game runtime: `looptrain/`

```text
looptrain/
├── AGENT.md                          # Project-specific agent/development rules
├── README.md                         # LoopTrain standalone runtime guide
├── standalone/                       # Current local default runtime: SLT
├── materials/                        # Reusable story, rule, prompt, schema, sound, and asset materials
├── tests/                            # Engine-level test scripts outside standalone package
├── tools/                            # Project tooling helpers
└── docs/                             # Standalone/game architecture docs
```

### `looptrain/standalone/` — current runnable game

```text
looptrain/standalone/
├── package.json                      # Node package: Express server, scripts, deps
├── package-lock.json
├── server.js                         # Express backend, 21 API routes, port 3030
├── engine.js                         # LoopTrain judge engine (1261 lines)
├── README.md                         # Standalone usage and API docs
├── .env.example                      # Environment variable template
├── .env                              # Local environment (gitignored)
├── .gitignore
├── tsconfig.runtime.json             # TypeScript config for runtime
├── src/                              # TypeScript Runtime source
│   └── runtime/                      # 68 files, 14 subsystems
├── llm/                              # LLM bridge code
├── public/                           # Vanilla JS browser frontend and assets
├── tests/                            # Standalone tests + E2E tests
└── node_modules/                     # Generated, not source
```

#### `looptrain/standalone/llm/`

```text
looptrain/standalone/llm/
├── providers.js                      # DeepSeek provider + mock reply + reply cleanup
└── prompt.js                         # NPC prompt construction for LLM bridge
```

#### `looptrain/standalone/src/runtime/` — TypeScript Runtime (68 files, 14 subsystems)

```text
looptrain/standalone/src/runtime/
├── index.ts                          # Public API barrel export
├── MemoryRuntime.ts                  # Main runtime class (event-sourced state)
├── shared/                           # Shared utilities (ids, result, errors, time)
├── ids/                              # ID generation (RuntimeId, RuntimeIdGenerator)
├── engine/                           # Engine bridge (LegacyEngineAdapter, MemoryEventDraft)
├── memory/                           # Memory layer (MemoryEvent, MemoryProjector, etc.)
├── archive/                          # Archive store (immutable narrative facts)
├── belief/                           # Belief store (character beliefs + confidence)
├── knowledge/                        # Knowledge store (player-known facts)
├── relationship/                     # Relationship store (NPC relationships)
├── timeline/                         # Timeline store (chronological events)
├── profile/                          # Profile store (NPC profiles)
├── snapshot/                         # Snapshot (save/restore)
├── storage/                          # In-memory event store
├── companion-view/                   # Companion view system (spoiler guard, visibility filter)
├── assistant/                        # Assistant AI subsystem (12 files: LLM provider, intent classifier, action planner, etc.)
├── goal/                             # Goal system (GoalEngine, GoalEvaluator)
├── command/                          # Command system (CommandMatcher, CommandRegistry)
├── migration/                        # Legacy state migration
├── content/                          # Runtime content loader + path policy
├── policy/                           # Spoiler/forbidden reveal policies
├── reset/                            # Reset system (planner, applier, policy)
└── tests/                            # Embedded runtime tests (slice0, slice1, goal_engine)
```

#### `looptrain/standalone/public/` — v0.11.0 component architecture

```text
looptrain/standalone/public/
├── index.html                        # HTML shell + script load order
├── app.js                            # Master orchestrator (game state, API, GameShell wiring)
├── style.css                         # Mobile-first CSS (CSS custom properties, flex layout)
├── favicon.ico
├── ui-stage.js                       # UIStage: 7-stage progressive unlock state machine
├── assistant-hint.js                 # 许知微 contextual hint generator
├── case-board.js                     # CaseBoard renderer (facts/statements/contradictions)
├── loading-state.js                  # Button spinner + global loading overlay
├── portrait-intro.js                 # NPC portrait entrance animation
├── audio-manager.js                  # Audio system (manifest-driven, 4 buses)
├── components/                       # v0.11.0 component library
│   ├── utils.js                      # Component base class + shared utilities
│   ├── layout.js                     # GameShell + 5 components (StatusBar, TimelineMiniBar, ObjectiveCard, SceneStateCard, CommandInput)
│   ├── actions.js                    # 3 components (ActionDock, MoreActionsSheet, FocusWatchBar)
│   ├── feedback.js                   # EventFeed + ActionResultCard factory
│   └── overlays.js                   # 2 components (ArchiveSheet, DialogueFocusSheet)
└── assets/
    ├── *_portrait.png                # 6 NPC portraits + 1 concept art
    └── audio/                        # Audio assets (manifest.json, 7 audio files, LICENSES.md)
        ├── ambience/                 # Scene ambience (rail_loop_low.mp3)
        ├── tension/                  # Time pressure (faint_ticking_loop.mp3)
        ├── sfx/                      # UI sound effects (3 .wav files)
        └── cinematic/                # Cinematic effects (explosion, loop_rewind)
```

#### `looptrain/standalone/tests/`

```text
looptrain/standalone/tests/
├── smoke_test.js                     # Engine smoke test (npm test)
├── ui-stage.test.js                  # UIStage state machine tests
├── assistant-hint.test.js            # Assistant hint generation tests
└── e2e/                              # Playwright E2E tests (npm run test:e2e)
    ├── full-player-journey.spec.js   # Full player journey (success path)
    ├── save-restore.spec.js          # Save/restore/reset tests
    ├── newbie-flow.spec.js           # New player experience tests
    └── ui-components.spec.js         # UI component verification
```

### `looptrain/tests/` — additional engine tests

```text
looptrain/tests/
├── engine_flow_test.js               # Core engine flow
├── all_npc_flow_test.js              # Full NPC flow coverage
├── dialogue_turn_limit_test.js       # Dialogue turn limit behavior
├── failure_next_loop_test.js         # Loop failure and next-loop memory carry
├── hidden_node_test.js               # Hidden NPC/node trigger behavior
├── llm_bridge_test.js                # LLM boundary test
├── conflict_detection_test.js        # NPC statement contradiction detection
├── inference_generation_test.js      # Deductive inference generation
├── evidence_scoring_test.js          # Multi-dimensional evidence scoring
├── loop_inheritance_test.js          # Loop failure inheritance
└── timeline_observation_test.js      # Timeline observation behavior
```

### `looptrain/materials/` — reusable game materials

```text
looptrain/materials/
├── README.md                         # Materials package overview
├── MANIFEST.json                     # Materials metadata
├── looptrain/                        # Design-time content (12 files, 7 subdirs)
│   ├── clues/                        # Clue card definitions
│   ├── episode/                      # Episode card definitions
│   ├── personas/                     # Player persona materials
│   ├── prompts/                      # Prompt templates (5 files)
│   ├── rules/                        # Control-layer rule cards
│   ├── scenes/                       # Scene card definitions
│   └── schemas/                      # Content schemas
├── runtime/                          # Externalized game data (26 files, 13 subdirs)
│   ├── assistant/                    # Action definitions, fallback templates, mock responses, UI labels
│   ├── characters/                   # NPC character data (4 NPCs)
│   ├── clues/                        # Trial clue data
│   ├── commands/                     # Command registry
│   ├── dialogues/                    # NPC dialogue trees (3 NPCs)
│   ├── ending/                       # Demo ending data
│   ├── goals/                        # Goal engine goal definitions
│   ├── intro/                        # Intro text, subtitles, app strings
│   ├── prompts/                      # NPC system/user prompts
│   ├── scene-data/                   # Scene labels/metadata
│   ├── scenes/                       # Scene definitions (3 scenes)
│   ├── settlement/                   # Loop settlement templates
│   └── timeline/                     # NPC timeline inference data
├── assets/                           # Reusable visual assets
├── sound/                            # Sound/audio source assets
├── docs/                             # Materials-specific design notes
└── tools/                            # Materials helper tools
```

### `looptrain/docs/` — current game architecture docs

```text
looptrain/docs/
├── CONTROL_FLOW.md                   # Success/failure/control flow docs
└── DEPLOY.md                         # Deployment notes for runtime
```

---

## Devlog static site: `devlog/`

```text
devlog/
├── package.json                      # Astro site package
├── package-lock.json
├── astro.config.mjs                  # Astro config
├── tsconfig.json                     # TypeScript config for devlog only
├── README.md                         # Devlog development and deployment notes
├── AGENT.md                          # Devlog-specific agent rules
├── plan.md
├── src/                              # Astro source
├── public/                           # Static assets for devlog
├── docs/                             # Devlog local docs
├── nginx/                            # Nginx config for looptrain.me
├── dist/                             # Generated static output; build artifact
├── .astro/                           # Astro generated/cache files
└── node_modules/                     # Installed dependencies; generated, not source
```

### `devlog/src/`

```text
devlog/src/
├── content.config.ts                 # Astro content collections config
├── content/                          # Formal content: devlog, technical docs, designs, characters
├── components/                       # Astro UI components
├── data/                             # Site data files
├── lib/                              # Site utilities
├── pages/                            # Astro routes/pages
├── styles/                           # Site styles
└── types/                            # Site type definitions
```

#### `devlog/src/content/`

```text
devlog/src/content/
├── devlog/                           # Development log entries (19 files)
├── changelog/                        # Version changelogs (6 files)
├── characters/                       # Character profile pages (3 files)
├── decisions/                        # Architecture Decision Records
├── design/                           # Design documents (3 files)
└── technical/                        # Technical reference docs (7 files)
```

#### `devlog/src/data/`

```text
devlog/src/data/
├── site-status.json                  # Live site status (version, play URL, known issues)
├── site.ts                           # Site metadata constants
└── roadmap.ts                        # Development roadmap data
```

---

## Root docs: `docs/`

```text
docs/
├── README.md                         # 文档体系总览 + Work Item 流转协议
├── adr/                              # 架构决策记录
├── project/                          # 稳态文档（每次 release 更新）
├── templates/                        # 文档模板
└── work/                             # Work item（active + released）
```

---

## Scripts: `scripts/`

```text
scripts/
├── start_slt.sh                      # Starts local Standalone LoopTrain runtime
├── verify_slt.sh                     # Verifies SLT syntax/tests/health/E2E
├── check_nginx_proxy.sh              # Verifies nginx proxy rules
├── deploy_devlog.sh                  # Deploys devlog static site
├── check_cross_consistency.py        # Cross-document consistency checker
├── check_docs_governance.py          # Documentation governance checker
├── check_project_docs.sh             # Steady-state doc existence + version consistency
├── check_release_wrapup.sh           # Release wrapup completeness verification
├── check_work_item.sh                # Pre-release 7-condition verification
└── sync_version.sh                   # Version synchronization script (VERSION -> 11 locations)
```

---

## Important current entry points

| Task | Path |
|---|---|
| Start local game | `scripts/start_slt.sh` |
| Verify local game | `scripts/verify_slt.sh` |
| Standalone server | `looptrain/standalone/server.js` |
| Game judge engine | `looptrain/standalone/engine.js` |
| TypeScript Runtime | `looptrain/standalone/src/runtime/index.ts` |
| Browser app | `looptrain/standalone/public/app.js` |
| UI components | `looptrain/standalone/public/components/` |
| UIStage state machine | `looptrain/standalone/public/ui-stage.js` |
| LLM provider boundary | `looptrain/standalone/llm/providers.js` |
| Standalone smoke test | `looptrain/standalone/tests/smoke_test.js` |
| E2E tests | `looptrain/standalone/tests/e2e/` |
| Engine test suite | `looptrain/tests/*.js` |
| Runtime data | `looptrain/materials/runtime/` |
| Devlog site entry | `devlog/src/pages/` |
| Devlog content | `devlog/src/content/` |

---

## Generated / ignored directories

These directories are generated or dependency/cache artifacts and should not be treated as primary source:

```text
.git/
.omo/
devlog/node_modules/
devlog/dist/
devlog/.astro/
looptrain/standalone/node_modules/
```
