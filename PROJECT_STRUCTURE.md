# Project Structure

**Project:** LoopTrain Standalone Runtime  
**Generated:** 2026-06-16  
**Purpose:** Quick file-structure map for developers and agents working from the repository root.

---

## Root layout

```text
11_looptrain/
├── README.md                         # Root project overview: SLT status, commands, invariants
├── MANIFEST.json                     # Machine-readable project facts and invariants
├── DEPLOYMENT.md                     # Deployment notes
├── PROJECT_STRUCTURE.md              # This file
├── scripts/                          # Root operational scripts
├── looptrain/                        # Main game runtime, materials, tests, and internal docs
├── devlog/                           # Astro static site for looptrain.me
├── docs/                             # Root-level architecture/spec docs
├── TBD/                              # Draft design notes and planning docs
├── .omo/                             # OhMyOpenCode planning/session artifacts
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
├── package.json                      # Node package: Express server, scripts, dependencies
├── package-lock.json
├── server.js                         # Express backend, API routes, static serving, LLM bridge route
├── engine.js                         # LoopTrain judge engine: AP/time/clues/dialogue/loop rules
├── README.md                         # Standalone MVP usage and API docs
├── .env.example                      # Environment variable template
├── .env                              # Local environment file; do not publish secrets
├── .gitignore
├── llm/                              # Current LLM bridge code
├── public/                           # Vanilla JS browser frontend and assets
├── tests/                            # Standalone smoke tests
└── node_modules/                     # Installed dependencies; generated, not source
```

#### `looptrain/standalone/llm/`

```text
looptrain/standalone/llm/
├── providers.js                      # DeepSeek provider + mock reply + reply cleanup
└── prompt.js                         # NPC prompt construction for LLM bridge
```

#### `looptrain/standalone/public/`

```text
looptrain/standalone/public/
├── index.html                        # Browser shell
├── app.js                            # Vanilla JS game frontend, state, API calls, UI rendering
├── style.css                         # Mobile-first game UI styles
├── audio-manager.js                  # Browser audio system
├── favicon.ico
└── assets/                           # Runtime browser assets
```

#### `looptrain/standalone/tests/`

```text
looptrain/standalone/tests/
└── smoke_test.js                     # Standalone engine smoke test used by npm test
```

### `looptrain/tests/` — additional engine tests

```text
looptrain/tests/
├── all_npc_flow_test.js              # Full NPC flow coverage
├── dialogue_turn_limit_test.js       # Dialogue turn limit behavior
├── engine_flow_test.js               # Happy path engine flow
├── failure_next_loop_test.js         # Loop failure and next-loop memory carry
├── hidden_node_test.js               # Hidden NPC/node trigger behavior
└── llm_bridge_test.js                # LLM boundary test: engine remains judge
```

### `looptrain/materials/` — reusable game materials

```text
looptrain/materials/
├── README.md                         # Materials package overview
├── MANIFEST.json                     # Materials metadata
├── looptrain/                        # Structured LoopTrain content drafts
├── assets/                           # Reusable visual assets
├── sound/                            # Sound/audio source assets and licenses
├── docs/                             # Materials-specific design/control notes
└── tools/                            # Materials helper tools
```

#### `looptrain/materials/looptrain/`

```text
looptrain/materials/looptrain/
├── clues/                            # Clue cards / clue definitions
├── episode/                          # Episode card(s), including trial episode structure
├── personas/                         # Player/persona materials
├── prompts/                          # Prompt templates for dialogue/action/failure outcomes
├── rules/                            # Control-layer and gameplay rule cards
├── scenes/                           # Scene cards / scene definitions
└── schemas/                          # Content schemas
```

### `looptrain/docs/` — current game architecture docs

```text
looptrain/docs/
├── LT_STANDALONE_ARCHITECTURE.md     # Standalone architecture and migration notes
├── CONTROL_FLOW.md                   # Success/failure/control flow docs
├── SPEC.md                           # Game spec / rules / setting
├── UI_UX_DESIGN.md                   # UI/UX design notes
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

---

## Root docs: `docs/`

```text
docs/
├── runtime-architecture-design.md    # Runtime architecture + implementation spec draft
└── superpowers/                      # Superpowers-generated design/spec artifacts
```

### `docs/superpowers/`

```text
docs/superpowers/
└── specs/
    └── 2026-06-15-companion-runtime-design.md
```

---

## Draft and planning docs: `TBD/`

```text
TBD/
├── 0000-document-governance.md       # Draft governance rules
├── 0001-document-migration-inventory.md
├── 01_new_npc.md                     # Draft companion/NPC design source
├── 02_doc.md                         # Second-pass docs/governance draft
└── runtime/                          # Runtime-specific draft specs
```

### `TBD/runtime/`

```text
TBD/runtime/
├── 2026-06-15-narrative-state-runtime.md
├── 2026-06-15-companion-runtime-design.md
└── lt-assistant-runtime-spec-zh.md
```

---

## Scripts: `scripts/`

```text
scripts/
├── start_slt.sh                      # Starts local Standalone LoopTrain runtime
├── verify_slt.sh                     # Verifies SLT syntax/tests/health endpoints
├── deploy_devlog.sh                  # Deploys devlog static site
└── check_docs_governance.py          # Documentation governance checker
```

---

## Important current entry points

| Task | Path |
|---|---|
| Start local game | `scripts/start_slt.sh` |
| Verify local game | `scripts/verify_slt.sh` |
| Standalone server | `looptrain/standalone/server.js` |
| Game judge engine | `looptrain/standalone/engine.js` |
| Browser app | `looptrain/standalone/public/app.js` |
| LLM provider boundary | `looptrain/standalone/llm/providers.js` |
| Standalone smoke test | `looptrain/standalone/tests/smoke_test.js` |
| Engine test suite | `looptrain/tests/*.js` |
| Runtime architecture spec | `docs/runtime-architecture-design.md` |
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
