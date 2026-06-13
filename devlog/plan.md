# LoopTrain Devlog -- Implementation Plan

Version: v1.0
Date: 2026-06-13
Status: draft
Target domain: looptrain.me
Source documents: devlog/AGENT.md (v0.1), devlog/docs/spec.md (v0.1)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope](#2-scope)
3. [Architecture](#3-architecture)
4. [Complete File Tree](#4-complete-file-tree)
5. [Phase 0: Project Scaffold](#5-phase-0-project-scaffold)
6. [Phase 1: MVP Pages](#6-phase-1-mvp-pages)
7. [Phase 2: Content Collections](#7-phase-2-content-collections)
8. [Phase 3: SEO, Accessibility, Security](#8-phase-3-seo-accessibility-security)
9. [Phase 4: Deployment](#9-phase-4-deployment)
10. [Verification Commands](#10-verification-commands)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Risks and Mitigations](#12-risks-and-mitigations)
13. [Open Questions](#13-open-questions)
14. [Dependency Graph](#14-dependency-graph)
15. [Appendix: Content Templates](#15-appendix-content-templates)

---

## 1. Executive Summary

LoopTrain Devlog is a static website that serves as the long-term project archive for LoopTrain, a personal interactive mystery puzzle game. The site is not a commercial game homepage, not a community platform. It is a deliberately restrained, dark-themed developer log designed for:

1. The developer (record progress, review decisions, maintain version history)
2. Early playtesters (understand the project, access the playtest)
3. Potential collaborators (judge whether the project is real and active)

The site is built with **Astro + Markdown + TypeScript + CSS Variables**, deployed as static files behind **Nginx** with **HTTPS**.

---

## 2. Scope

### 2.1 In Scope (Phase 1 MVP)

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Hero, current status, recent devlog, roadmap summary, footer |
| Play | `/play` | Game entry point with version badge, instructions, known issues |
| Devlog List | `/devlog` | Reverse-chronological list of devlog entries |
| Devlog Detail | `/devlog/[slug]` | Full devlog article with structured sections |
| Roadmap | `/roadmap` | Three-phase plan: current, next, long-term |
| Changelog | `/changelog` | Versioned release notes |
| About | `/about` | Project introduction, motivation, current state |
| Characters | `/characters` | Public NPC introductions, card status, playtest role, asset authorization (Phase 2) |

All built as static pages. All content sourced from Markdown files.

### 2.2 Out of Scope (Phase 1)

- User login, authentication, accounts
- Database, CMS, admin panel
- Comments, forums, community features
- Payment, subscriptions, commercial features
- File uploads (user-facing)
- Full-text search
- RSS feed
- Analytics dashboard
- `/characters` page (Phase 2)
- `*/design` and `*/design/:slug` pages (Phase 2)
- `*/assets` page (Phase 2)
- CI/CD pipeline (manual deploy is acceptable for Phase 1)

### 2.3 Project Iron Laws (Non-Negotiable)

1. **Static first**: no server-side runtime beyond Nginx serving files.
2. **Markdown content**: no content hardcoded in components.
3. **No spoilers**: never publish core mystery answers, final truths, hidden identities, or unrevealed clues.
4. **No hard date promises**: roadmap uses phase labels, not calendar dates.
5. **Calm, accurate copy**: no hype, no marketing exaggeration, no revolutionary claims.
6. **Mobile-first**: primary target is phone portrait (390x844, 430x932).
7. **Dark train/archive visual direction**: midnight train, tunnel, loops, low light, engineering log aesthetic.

---

## 3. Architecture

### 3.1 Technology Stack

```
Astro v5.x        Static site generator
TypeScript v5.x   Type safety, frontmatter schemas
CSS Variables     Design token system (no Tailwind, no UI framework)
Markdown          All content (devlog, changelog, roadmap, about)
Nginx             Static file serving + security headers
```

**Why Astro**: It is the top recommendation in spec.md section 9.2. It is content-first, ships zero JS by default, has first-class Markdown support via Content Collections, and produces pure static output. It outperforms VitePress for custom visual design and outperforms Next.js for a content site that needs no client-side interactivity.

**Why no Tailwind/UI framework**: AGENT.md section 16.2 explicitly forbids introducing complex UI frameworks that cause style loss of control. CSS Variables provide a single-source-of-truth design token system.

### 3.2 Data Flow

```
Markdown files (src/content/)
        |
        v
Astro Content Collections (Zod schemas for validation)
        |
        v
Astro pages/routes (.astro files)
        |
        v
Static HTML + CSS output (dist/)
        |
        v
Nginx serves static files over HTTPS
```

No build-time API calls. No client-side data fetching. No JavaScript required for page rendering.

### 3.3 Routing

```
/                   -> src/pages/index.astro
/play               -> src/pages/play.astro
/devlog             -> src/pages/devlog/index.astro
/devlog/[slug]      -> src/pages/devlog/[slug].astro
/roadmap            -> src/pages/roadmap.astro
/changelog          -> src/pages/changelog.astro
/about              -> src/pages/about.astro
/characters         -> src/pages/characters.astro       # Phase 2
```

All routes are static. No SSR, no dynamic params at runtime.

---

## 4. Complete File Tree

```
looptrain-devlog/
|-- public/
|   |-- favicon.svg
|   |-- images/
|   |   |-- og-default.png          # 1200x630 Open Graph fallback
|   |   |-- og-home.png             # Custom OG for home
|   |   |-- hero-bg.webp            # Lightweight hero texture (optional)
|   |-- robots.txt
|
|-- src/
|   |-- components/
|   |   |-- BaseHead.astro          # <head> with SEO, OG, CSS reset
|   |   |-- Header.astro            # Top nav: semi-transparent dark, fine border
|   |   |-- Footer.astro            # Project name, domain, copyright, contact hint
|   |   |-- Layout.astro            # Wraps Header + slot + Footer
|   |   |-- Hero.astro              # Homepage hero block
|   |   |-- VersionBadge.astro      # v0.4.3 · Early Playtest (mono, capsule)
|   |   |-- StatusCard.astro        # Current version, phase, recent update, next, issues
|   |   |-- DevlogCard.astro        # Date, title, summary, tags, status
|   |   |-- DevlogList.astro        # Grid/list of DevlogCard items
|   |   |-- RoadmapPhase.astro      # Single phase block (current/next/long-term)
|   |   |-- RoadmapItem.astro       # Single task with status indicator
|   |   |-- KnownIssue.astro        # Issue title, scope, status, priority
|   |   |-- ChangelogEntry.astro    # Version header + added/fixed/known-issues
|   |   |-- PlayButton.astro        # CTA button for game entry
|   |   |-- TagBadge.astro          # Low-saturation tag pill
|   |   |-- StatusDot.astro         # Planning/doing/done/paused/cancelled indicator
|   |   |-- CharacterCard.astro     # NPC public card: name, role, status, art note (Phase 2)
|   |
|   |-- content/
|   |   |-- config.ts               # Content collection schemas (Zod)
|   |   |-- devlog/
|   |   |   |-- 2026-06-13-why-devlog.md
|   |   |   |-- 2026-06-13-current-issues.md
|   |   |   |-- 2026-06-13-audio-system-plan.md
|   |   |-- changelog/
|   |   |   |-- v0.4.3.md
|   |   |-- characters/
|   |   |   |-- xiaoning.md          # Phase 2: public NPC intro (no spoilers)
|   |   |   |-- zhao-conductor.md    # Phase 2
|   |   |   |-- shen-mohan.md        # Phase 2
|   |   |-- roadmap/
|   |   |   |-- roadmap.md          # Single file or one per phase
|   |
|   |-- data/
|   |   |-- site.ts                 # Site-wide constants (name, domain, version, phases)
|   |
|   |-- pages/
|   |   |-- index.astro
|   |   |-- play.astro
|   |   |-- roadmap.astro
|   |   |-- changelog.astro
|   |   |-- about.astro
|   |   |-- characters.astro         # Phase 2
|   |   |-- devlog/
|   |   |   |-- index.astro
|   |   |   |-- [slug].astro
|   |
|   |-- styles/
|   |   |-- global.css              # CSS reset + variables + base typography
|   |   |-- components.css          # Shared component styles (optional split)
|   |   |-- utilities.css           # Minimal utility classes
|   |
|   |-- types/
|       |-- devlog.ts               # TypeScript interfaces for devlog entries
|       |-- changelog.ts            # TypeScript interfaces for changelog entries
|       |-- roadmap.ts              # TypeScript interfaces for roadmap items
|       |-- characters.ts           # TypeScript interfaces for character cards (Phase 2)
|
|-- astro.config.mjs
|-- tsconfig.json
|-- package.json
|-- .gitignore
|-- nginx/
|   |-- looptrain.me.conf           # Nginx server block template
|
|-- README.md                       # Dev setup instructions
```

---

## 5. Phase 0: Project Scaffold

**Goal**: Initialize the Astro project with correct config, dependencies, and toolchain.

### Task 0.1: Initialize Astro project

**Dependencies**: None (first task)
**File**: `package.json`

```bash
npm create astro@latest looptrain-devlog -- --template minimal --typescript strict
cd looptrain-devlog
```

**What to verify**:
- `package.json` exists with `astro` dependency
- `astro.config.mjs` exists
- `tsconfig.json` exists with strict mode enabled

### Task 0.2: Configure astro.config.mjs

**Dependencies**: Task 0.1
**File**: `astro.config.mjs`

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://looptrain.me',
  output: 'static',
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
    },
  },
});
```

The `site` value is critical for canonical URLs and Open Graph tags.

### Task 0.3: Create CSS design token system

**Dependencies**: Task 0.1
**File**: `src/styles/global.css`

Implement the exact color variables from AGENT.md section 7.2:

```css
:root {
  /* Backgrounds */
  --color-bg: #07090d;
  --color-bg-panel: #0d1118;
  --color-bg-elevated: #121722;
  --color-border: #263040;
  --color-border-soft: #1a2230;

  /* Text */
  --color-text: #d7dde8;
  --color-text-muted: #8993a5;
  --color-text-subtle: #5f6b7d;

  /* Accent */
  --color-accent: #6cc7d9;
  --color-accent-soft: rgba(108, 199, 217, 0.14);
  --color-accent-strong: #9be8f4;

  /* Semantic */
  --color-warning: #c98b55;
  --color-danger: #b84a4a;
  --color-danger-soft: rgba(184, 74, 74, 0.14);
  --color-success: #7ca982;

  /* Typography */
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Microsoft YaHei", sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  --font-size-body: 16px;
  --line-height-body: 1.75;

  /* Layout */
  --layout-max: 1120px;
  --content-max: 720px;
  --content-wide: 960px;
  --spacing-mobile: 20px;

  /* Motion */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

Also include CSS reset, base body styles (`background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans);`), and the `prefers-reduced-motion` rule from AGENT.md section 10.

**Verification**: `lsp_diagnostics` on `global.css` shows zero errors.

### Task 0.4: Create TypeScript types

**Dependencies**: Task 0.1
**Files**: `src/types/devlog.ts`, `src/types/changelog.ts`, `src/types/roadmap.ts`

Define interfaces matching AGENT.md frontmatter specifications (sections 17.1, 17.2, 17.3).

### Task 0.5: Create site data constants

**Dependencies**: none (parallel with 0.4)
**File**: `src/data/site.ts`

Export constants: `SITE_NAME`, `SITE_DOMAIN`, `SITE_DESCRIPTION`, `CURRENT_VERSION`, `CURRENT_PHASE`, `SITE_URL`.

### Task 0.6: Create .gitignore

**Dependencies**: Task 0.1
**File**: `.gitignore`

Include: `node_modules/`, `dist/`, `.env`, `.env.*`, `.astro/`, `*.log`.

---

## 6. Phase 1: MVP Pages

**Goal**: All seven target pages render correctly, mobile-first, with real content sourced from Markdown.

### Task 1.1: Create Layout and navigation components

**Dependencies**: Phase 0 complete
**Files**: `src/components/Layout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/BaseHead.astro`

**Specifications**:
- `BaseHead.astro`: accepts `title`, `description`, `ogImage` props; renders `<title>`, `<meta>`, OG tags, canonical; links `global.css`.
- `Header.astro`: semi-transparent dark background, fine bottom border, fixed/sticky. Nav items: 首页 / 试玩 / 开发日志 / 路线图 / 更新记录 / 关于. Active state on current route. Mobile hamburger menu (CSS-only, no JS). In Phase 2, add `角色` between 试玩 and 开发日志.
- `Footer.astro`: project name, domain, copyright line,素材授权说明 reference, optional contact hint. Subtle, not prominent.
- `Layout.astro`: wraps `BaseHead` + `Header` + `<main><slot /></main>` + `Footer`.

**Verification**: All components render without errors. Header active state works per route. Mobile menu functions.

### Task 1.2: Create shared atom components

**Dependencies**: Task 1.1
**Files**: `src/components/VersionBadge.astro`, `src/components/TagBadge.astro`, `src/components/StatusDot.astro`

**Specifications**:
- `VersionBadge.astro`: mono font, small, border capsule, cold blue highlight. Format: `v0.4.3 · Early Playtest`.
- `TagBadge.astro`: low-saturation, small pill. Used in DevlogCard and detail pages.
- `StatusDot.astro`: colored dot + label for planning/doing/done/paused/cancelled.

### Task 1.3: Homepage (`/`)

**Dependencies**: Tasks 1.1, 1.2
**File**: `src/pages/index.astro`

**Content modules** (from AGENT.md section 5.2 and spec.md section 6.1):

1. **Hero** (Hero.astro component will be created here):
   - Title: `LoopTrain 开发日志`
   - Subtitle: `一款互动叙事解谜游戏的长期开发记录。`
   - Short description paragraph (AGENT.md section 22)
   - Primary button: `开始试玩` -> links to `/play`
   - Secondary button: `查看开发日志` -> links to `/devlog`
   - Current version badge
   - Background: subtle track lines, scanlines, tunnel light texture (CSS-only, no heavy image)

2. **Current Status** (StatusCard.astro):
   - Current version: v0.4.3
   - Current phase: 移动端试玩版
   - Recent update: 2026-06-13
   - Next focus: 结构整理、音效系统、立绘修复、移动端 UI 优化
   - Known issue count

3. **Recent Devlog** (fetched from content collection, sorted by date desc, limited to 3):
   - Each entry: date, title, summary, tags, read link

4. **Roadmap Summary** (brief text from roadmap content):
   - Current phase goal (one sentence)
   - Next phase direction (one sentence)

5. **Known Issues Summary** (short list from content):
   - 2-3 key issues

**Constraints**:
- Content for Hero and StatusCard comes from `src/data/site.ts` and content collections.
- No content hardcoded in the component beyond structural text.
- Desktop: `--content-wide` (960px). Mobile: full width with 20px padding.
- Dark background, fine borders, no heavy shadows, no animation-heavy elements.

**Verification**: Page loads at `/`. All four key messages are visible within viewport on 390x844. Links work. Dark theme renders correctly.

### Task 1.4: Play page (`/play`)

**Dependencies**: Tasks 1.1, 1.2
**File**: `src/pages/play.astro`

**Content** (from AGENT.md section 5.3 and spec.md section 6.2):

1. Page title: `LoopTrain 试玩版`
2. Version badge: `v0.4.3 · 手机竖屏 · 早期试玩版`
3. Instructions paragraph (exact copy from spec.md section 6.2 item 3):
   > 当前版本仍处于早期测试阶段，部分角色、音效、界面和剧情逻辑尚未完成。建议使用手机竖屏访问。
4. Play button (PlayButton.astro): large CTA, links to stable internal game entry route `/play/game`; deployment Nginx maps this route to the real LoopTrain runtime.
5. Known Issues list (KnownIssue.astro components, sourced from a Markdown or data file):
   - SillyTavern 原始界面仍可能显示
   - Server Plugin 未连接时，部分状态无法持久化
   - 小宁立绘资源可能存在加载失败
   - 移动端遮罩和开场字幕仍需优化
   - 当前版本暂无完整音效系统
6. Feedback section (plain text, no form):
   > 反馈方式：可以直接联系开发者，或在后续版本开放反馈表单。

**Constraints**:
- One core goal: get user into the game. Do not stack paragraphs.
- Mobile-first: play button must be prominent and tap-friendly (min 48px height).
- Known issues use warning styling (not danger red unless critical).

**Verification**: Page loads. Play button exists and is prominent. Known issues render. Mobile layout is clean.

### Task 1.5: Devlog list page (`/devlog`)

**Dependencies**: Tasks 1.1, 1.2, Phase 0 content config
**File**: `src/pages/devlog/index.astro`

**Content**: Fetches all entries from `src/content/devlog/` collection, sorted by `date` descending.

**Each entry card** (DevlogCard.astro):
- Date (mono font)
- Title (linked to `/devlog/[slug]`)
- Summary
- Tags (TagBadge components)
- Status (StatusDot)

**Layout**: vertical list on mobile, optional grid on desktop. No pagination needed for Phase 1 (3 entries).

**Verification**: Page loads showing 3 devlog entries. Each card links to detail page. Tags and status render correctly.

### Task 1.6: Devlog detail page (`/devlog/[slug]`)

**Dependencies**: Tasks 1.1, 1.2, Task 1.5
**File**: `src/pages/devlog/[slug].astro`

**Content**: Fetches single entry from `getCollection('devlog')` by matching slug. Renders full Markdown body.

**Structure** (from AGENT.md section 5.4):
```
# Title
Date: YYYY-MM-DD | Version: vX.Y.Z | Status: planning/doing/done/paused/cancelled
Tags: [tag1] [tag2]

## 背景
## 当前问题
## 本次调整
## 设计判断
## 后续计划
## 备注
```

**Layout**: narrow reading width (`--content-max`: 720px). Centered on desktop. Full width on mobile with padding.

**Back link**: `← 返回开发日志列表` linking to `/devlog`.

**Verification**: Each detail page loads. Markdown renders correctly (headings, paragraphs, lists). Font sizes and line heights match spec (16-18px body, 1.7-1.9 line-height). Narrow reading width enforced.

### Task 1.7: Roadmap page (`/roadmap`)

**Dependencies**: Tasks 1.1, 1.2
**File**: `src/pages/roadmap.astro`

**Content** (from spec.md section 6.5, AGENT.md section 18.3):

Three phases required:

**Phase 1: 当前阶段 -- 试玩版稳定**
- List of tasks with status indicators (RoadmapItem.astro)
- Tasks from spec section 6.5

**Phase 2: 下一阶段 -- 体验增强**
- List of planned tasks

**Phase 3: 长期阶段 -- 完整游戏**
- List of exploratory goals

Each RoadmapItem shows: task name, status (未开始/进行中/已完成/暂停/废弃), brief description.

**Constraints**:
- No dates. Use phase labels only.
- Each item has a status indicator with subtle color coding.
- Do not over-decorate status colors.

**Content source**: Ideally from `src/content/roadmap/roadmap.md` with structured frontmatter. If that proves complex for Phase 1, use a data file in `src/data/`.

**Verification**: Page loads with three phases. Tasks have status indicators. No dates appear. Content matches spec.

### Task 1.8: Changelog page (`/changelog`)

**Dependencies**: Tasks 1.1, 1.2
**File**: `src/pages/changelog.astro`

**Content**: Fetches from `src/content/changelog/` collection, sorted by version descending.

**Format per entry** (from AGENT.md section 11.3 and spec.md section 6.6):
```markdown
## v0.4.3
日期：2026-06-13

### 新增
- item

### 修复
- item

### 已知问题
- item
```

**Minimum content**: v0.4.3 entry (spec section 6.6).

**Verification**: Page loads. v0.4.3 entry renders with 新增/修复/已知问题 sections. Version uses mono font.

### Task 1.9: About page (`/about`)

**Dependencies**: Tasks 1.1, 1.2
**File**: `src/pages/about.astro`

**Content** (from spec.md section 6.9):
```markdown
# 关于 LoopTrain
LoopTrain 是一个个人长期开发的互动叙事解谜游戏项目。
玩家将在一列即将爆炸的列车上不断循环，通过对话、观察和行动寻找事故背后的真相。
当前项目仍处于早期试玩阶段，核心目标不是快速商业化，而是持续探索一种结合大语言模型、互动叙事和解谜机制的个人游戏创作方式。
本站用于记录项目进展、版本更新、设计笔记和后续计划。
```

**Layout**: narrow reading width, centered. Simple, no cards, no sidebars.

**Verification**: Page loads. Text renders correctly in narrow column. No spoiler content present.

---

## 7. Phase 2: Content Collections (Schema & Validation)

**Goal**: Define Zod schemas for all content types, wire up Astro Content Collections, ensure build-time validation.

### Task 2.1: Define content collection config

**Dependencies**: Phase 0 complete
**File**: `src/content/config.ts`

```typescript
import { defineCollection, z } from 'astro:content';

const devlogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    version: z.string(),
    status: z.enum(['idea', 'planning', 'doing', 'done', 'paused', 'cancelled']),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
  }),
});

const changelogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    version: z.string(),
    date: z.date(),
    summary: z.string().optional(),
  }),
});

export const collections = {
  devlog: devlogCollection,
  changelog: changelogCollection,
};
```

**Verification**: Build succeeds with `astro build`. Invalid frontmatter causes build failure (test by temporarily adding a bad entry).

### Task 2.2: Create initial devlog entries (3 minimum)

**Dependencies**: Task 2.1
**Files**: `src/content/devlog/2026-06-13-why-devlog.md`, `src/content/devlog/2026-06-13-current-issues.md`, `src/content/devlog/2026-06-13-audio-system-plan.md`

**Content**: Write real content following AGENT.md sections 5.4, 17.1, and spec.md sections 17.1-17.3. Each entry must have all frontmatter fields, structured body sections (背景, 当前问题, 本次调整, 设计判断, 后续计划, 备注).

**Verification**: All three entries pass collection schema validation at build time.

### Task 2.3: Create initial changelog entry (v0.4.3)

**Dependencies**: Task 2.1
**File**: `src/content/changelog/v0.4.3.md`

**Content**: Follow format from spec.md section 6.6. Include 新增, 修复, 已知问题 sections.

**Verification**: Entry passes schema validation at build time.

### Task 2.4: Characters page (`/characters`)

**Dependencies**: Tasks 1.1, 1.2, 2.1 (collection config exists)
**Files**: `src/pages/characters.astro`, `src/components/CharacterCard.astro`, `src/content/characters/*.md`, `src/types/characters.ts`, `src/content/config.ts` (update)

**Route choice**: `/characters` (not `/character-cards`). Rationale: shorter, maps naturally to "角色" in Chinese, avoids implying downloadable card files when card distribution is an open question. The page is a public-facing character reference column, not a card download hub.

**Purpose**: Provide public-safe NPC introductions so visitors (playtesters, collaborators) can understand who appears in the current playtest, their role, asset status, and where to find related design notes. This supports the playtest experience without competing with `/play` as the primary game entry.

**Page structure**:

1. Page title: `角色介绍` / `Characters`
2. Intro paragraph (calm, accurate):
   > LoopTrain 当前试玩版中包含以下角色。角色设定仍在持续调整中。此处仅记录公开可见的角色信息和素材授权状态，不涉及核心剧情谜底。
3. Character cards (CharacterCard.astro), one per NPC, in a vertical list or responsive grid.

**CharacterCard.astro fields** (all from content frontmatter):
- Character name (e.g., 小宁, 赵乘警, 沈墨寒)
- Role tag: `主要角色` / `隐藏角色` / `NPC`
- Playtest status: `已在试玩版中出现` / `计划中` / `部分实现`
- One-paragraph public description (role in the story the player sees on first encounter — no hidden identity, no final truth)
- Art/asset note: `AI 生成` / `手绘` / `待替换` / `占位素材`
- Authorization status: `自有生成` / `待确认授权` / `已获授权`
- Link to related devlog entries (optional)
- Link to design notes (Phase 2, may be placeholder until design pages exist)

**Spoiler safety rules** (enforced in content, not code):
- Allowed: character name, visible role (乘客, 乘警), first-encounter context, public personality sketch, art source
- Forbidden: hidden identity (e.g., "XX 的真实身份是 YY"), core mystery connections, final truth, unrevealed clues, key puzzle answers, character fates

**Content collection schema** (add to `src/content/config.ts`):

```typescript
const charactersCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    playtestStatus: z.enum(['in-playtest', 'planned', 'partial']),
    description: z.string(),
    artSource: z.string().optional(),
    authorization: z.enum(['self-generated', 'pending', 'licensed']).default('pending'),
    tags: z.array(z.string()).default([]),
    relatedDevlog: z.array(z.string()).optional(),
  }),
});
```

Update `export const collections` to include `characters: charactersCollection`.

**Minimum content**: 3 character entries for Phase 2 MVP:
- `src/content/characters/xiaoning.md` — 小宁 (passenger, in playtest)
- `src/content/characters/zhao-conductor.md` — 赵乘警 (conductor, in playtest)
- `src/content/characters/shen-mohan.md` — 沈墨寒 (passenger, planned/partial)

**Navigation update**: In Phase 2, add `角色` to Header nav between 试玩 and 开发日志. Phase 1 nav remains unchanged (6 items).

**Layout**: Responsive grid on desktop (2-3 columns), single column on mobile. Cards use dark panel background (`--color-bg-panel`), fine border, subdued type. Narrow card width (no full-width character bios).

**Relationship to `/play`**: The characters page supports understanding; it does NOT compete with or distract from the game entry. The `/play` page remains the primary CTA. Characters page has no "play now" button; at most, a subtle cross-link "返回试玩" in the footer or intro.

**Verification**: Page loads at `/characters`. 3 character cards render. Each card shows name, role, playtest status, description, art note, authorization. No hidden identity content. Schema validation passes at build. Nav includes 角色 link in Phase 2.

---

## 8. Phase 3: SEO, Accessibility, Security

**Goal**: Every page meets SEO, a11y, and security requirements from AGENT.md.

### Task 3.1: Implement per-page SEO tags

**Dependencies**: Task 1.1 (BaseHead exists), Phase 1 pages exist
**Files**: All page components (pass `title` and `description` props to BaseHead)

**Requirements** (AGENT.md section 14):
- Every page: `<title>`, `<meta name="description">`, `<link rel="canonical">`
- Every page: `og:title`, `og:description`, `og:image`, `og:type`, `og:url`
- Homepage OG image: `public/images/og-home.png`
- Fallback OG image: `public/images/og-default.png` (1200x630, dark theme, "LoopTrain Devlog" text)

**Verification**: Run `astro build`, inspect `dist/` HTML for `<title>`, `<meta>`, OG tags on each page.

### Task 3.2: Create Open Graph default image

**Dependencies**: None (can be parallel)
**File**: `public/images/og-default.png`

A 1200x630 PNG with dark background, "LoopTrain Devlog" text, cold blue accent. Minimal, archive-style. Description line: "一款互动叙事解谜游戏的长期开发记录".

This is a manual design task. The plan records it as a dependency for SEO verification but does not prescribe the design tool.

### Task 3.3: Verify accessibility

**Dependencies**: Phase 1 pages exist
**Requirements** (AGENT.md section 13):

Checklist to verify (manual + automated):
- [ ] All buttons are keyboard accessible (Tab to focus, Enter to activate)
- [ ] All links have descriptive text (no "click here")
- [ ] All images have `alt` attributes
- [ ] Color contrast meets WCAG AA on all text (use browser DevTools contrast checker)
- [ ] No color used as the only status indicator (supplement StatusDot with text label)
- [ ] `prefers-reduced-motion` is respected (animation/transition disabled)
- [ ] Each page has exactly one `<h1>`
- [ ] Heading hierarchy is logical (h1 -> h2 -> h3, no skips)
- [ ] `lang="zh-CN"` on `<html>` element
- [ ] Focus indicators are visible on interactive elements

**Verification**: Run Lighthouse accessibility audit. Target score >= 90.

### Task 3.4: Create robots.txt

**Dependencies**: None (parallel)
**File**: `public/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://looptrain.me/sitemap-index.xml
```

### Task 3.5: Verify security constraints

**Dependencies**: Build output exists
**Requirements** (AGENT.md section 15):

Checklist:
- [ ] No API keys, model keys, or secrets in `dist/` output
- [ ] No `.env` files in `dist/`
- [ ] No `.git` directory in `dist/`
- [ ] No server paths in HTML/JS/CSS
- [ ] All external resources are from trusted origins
- [ ] `Content-Security-Policy` header planned for Nginx

**Verification**: `grep -r "sk-" dist/` returns nothing. `grep -r "api_key" dist/` returns nothing. `grep -r "BEGIN" dist/` returns nothing.

---

## 9. Phase 4: Deployment

**Goal**: Static build works, Nginx config is correct, deployment process is documented.

### Task 9.1: Verify production build

**Dependencies**: All Phase 1-3 tasks
**Command**: `npm run build` or `npx astro build`

**Verification**:
- Build exits with code 0
- `dist/` directory contains `index.html`, `play/index.html`, `devlog/index.html`, etc.
- No console errors during build
- `npx astro check` passes type checks

### Task 9.2: Test local production preview

**Dependencies**: Task 9.1
**Command**: `npx astro preview`

**Verification**:
- All seven routes return 200
- No 404s for static assets (CSS, images)
- All links navigate correctly
- Mobile viewport renders correctly in browser DevTools

### Task 9.3: Create Nginx configuration

**Dependencies**: None (can be parallel with Phase 1)
**File**: `nginx/looptrain.me.conf`

**Requirements** (from AGENT.md section 15, spec.md section 13):
- Serve `dist/` as root
- HTTPS only (redirect HTTP -> HTTPS)
- Deny access to: `.env`, `.git`, `*.log`, `*.bak`
- `gzip on` for text assets
- Cache headers for static assets (1 year for hashed assets, no-cache for HTML)
- Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`
- No `server_tokens`

**Verification**: Config passes `nginx -t` check (requires Nginx installed on target server; documented as deploy step).

### Task 9.4: Document deployment process

**Dependencies**: Tasks 9.1, 9.3
**File**: Add deployment section to project README

Steps:
1. `npm run build` on local or CI
2. Copy `dist/` to server: `scp -r dist/* user@host:/var/www/looptrain.me/`
3. Place Nginx config: `sudo cp nginx/looptrain.me.conf /etc/nginx/sites-available/ && sudo ln -s ... /etc/nginx/sites-enabled/`
4. `sudo nginx -t && sudo systemctl reload nginx`
5. Verify HTTPS with certbot if not already configured
6. Smoke test: curl all pages, check status codes

---

## 10. Verification Commands

Run these commands in order. All must pass before marking a phase complete.

### Phase 0 Verification

```bash
# TypeScript compilation
npx astro check

# LSP diagnostics on key files
# (run lsp_diagnostics on src/styles/global.css, src/content/config.ts)
```

### Phase 1 Verification

```bash
# Build the site
npx astro build
# Expected: exit 0, dist/ populated

# List all HTML pages
find dist -name "*.html" | sort
# Expected: index.html, play/index.html, devlog/index.html,
#           devlog/2026-06-13-why-devlog/index.html (and 2 more),
#           roadmap/index.html, changelog/index.html, about/index.html,
#           characters/index.html (Phase 2)

# Check for broken links (optional, manual)
npx astro preview
# Manually click through all nav links
```

### Phase 2 Verification

```bash
# Schema validation (part of build)
npx astro build
# Must fail if frontmatter is invalid

# Type check
npx astro check
```

### Phase 3 Verification

```bash
# SEO: Check OG tags in built HTML
grep -l 'og:title' dist/**/*.html

# Security: no secrets in output
grep -r 'sk-' dist/        # should return nothing
grep -r 'api_key' dist/    # should return nothing
grep -r '.env' dist/       # should return nothing

# Accessibility: Run Lighthouse CLI (optional)
# npx lighthouse http://localhost:4321 --view
```

### Phase 4 Verification

```bash
# Production build
rm -rf dist && npx astro build
# Verify dist/ exists and contains expected structure

# Test preview server
npx astro preview &
sleep 2
curl -sS http://localhost:4321/ | head -20
curl -sS http://localhost:4321/devlog | head -20
curl -sS http://localhost:4321/play | head -20
curl -sS http://localhost:4321/characters | head -20   # Phase 2
kill %1

# Nginx config test (on server)
# sudo nginx -t
```

---

## 11. Acceptance Criteria

### 11.1 Functional

- [ ] `GET /` returns 200, renders Hero + StatusCard + recent devlog + roadmap summary
- [ ] `GET /play` returns 200, renders play button, instructions, known issues
- [ ] `GET /devlog` returns 200, lists >= 3 devlog entries sorted by date desc
- [ ] `GET /devlog/[slug]` returns 200 for each devlog entry, renders full Markdown body
- [ ] `GET /roadmap` returns 200, shows 3 phases with tasks and statuses
- [ ] `GET /changelog` returns 200, shows versioned entries with added/fixed/known-issues
- [ ] `GET /about` returns 200, shows project introduction
- [ ] `GET /characters` returns 200, shows >= 3 character cards with roles and statuses (Phase 2)
- [ ] All pages render correctly on viewports: 390x844, 430x932, 768x1024, 1440x900
- [ ] Navigation works on all pages, active state reflects current route

### 11.2 Visual

- [ ] Dark theme renders correctly (backgrounds, text, borders match CSS variables)
- [ ] No bright/light color schemes appear
- [ ] No high-saturation colors
- [ ] Body text is readable (contrast, font size, line height)
- [ ] Monospace font used for version numbers, dates, status labels
- [ ] Hero area has clear entry points (play button, devlog link)
- [ ] Visual style is consistent across all pages
- [ ] No animations violate `prefers-reduced-motion`

### 11.3 Content

- [ ] At least 3 devlog entries exist with complete metadata and structured sections
- [ ] At least 1 changelog entry (v0.4.3) exists
- [ ] Roadmap uses phase labels (当前阶段/下一阶段/长期阶段), not dates
- [ ] Homepage shows current version v0.4.3
- [ ] No core mystery spoilers in any content
- [ ] No exaggerated marketing language
- [ ] Copy is calm, accurate, restrained
- [ ] Character cards show only public-first-encounter info; no hidden identities, final truth, or puzzle answers (Phase 2)
- [ ] Character cards include art source and authorization status (Phase 2)

### 11.4 Technical

- [ ] `npx astro build` exits 0 with no errors
- [ ] `npx astro check` passes
- [ ] No 404 for any static resource
- [ ] All pages have `<title>`, `<meta description>`, OG tags, canonical
- [ ] No API keys, secrets, or server paths in `dist/`
- [ ] Nginx config denies `.env`, `.git`, `*.log`, `*.bak`
- [ ] Mobile layout has no horizontal scroll or overflow

---

## 12. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Astro Content Collections API changes between versions | Low | High | Pin Astro version in `package.json`. Use `astro@^5.0.0` range. |
| OG image generation requires design tool unavailable to coding agent | Medium | Low | Use a simple CSS-rendered HTML screenshot via Playwright, or create a text-only SVG fallback. |
| Game runtime mapping for `/play/game` is deployment-dependent | Medium | Medium | Keep frontend CTA stable at `/play/game`; configure Nginx to proxy or redirect this route to the real LoopTrain runtime during deployment. |
| Markdown content (especially Chinese) rendering differences | Low | Medium | Verify with `astro build` and visual inspection early. Astro uses remark by default which handles CJK well. |
| Nginx config requires server-specific paths/tuning | Medium | Low | Template the config file with comments marking server-specific values. Document clearly. |
| Mobile nav menu requires JavaScript (hamburger toggle) | Low | Low | Use CSS `:target` or checkbox hack for JS-free toggle. Astro pages ship zero JS by default. |
| Content grows beyond 20+ devlog entries without pagination | Low | Medium | Phase 1 only needs 3 entries. Pagination is Phase 2. Document as open question. |
| Character card content accidentally leaks hidden identity or core mystery | Medium | High | Use content-only enforcement (no code filter). Review each `.md` file against the spoiler checklist before publish. Mark hidden NPCs as `playtestStatus: planned` with minimal description. |

---

## 13. Open Questions

These must be resolved before or during implementation. They are not blockers for starting Phase 0.

1. **Game runtime mapping**: The public CTA path is fixed as `/play/game`. During deployment, decide whether Nginx should proxy it to current ST Game Shell (for example `http://127.0.0.1:8000/?looptrain=game`), redirect it, or serve a future standalone game build.

2. **OG image design**: Should the OG image use the train/archive aesthetic literally (with a generated image) or be purely typographic? *Recommendation: typographic with accent color, easily created as SVG.*

3. **Roadmap content storage**: Should roadmap items be stored in a Markdown content collection (structured frontmatter per item) or in a TypeScript data file? *Recommendation for Phase 1: TypeScript data file in `src/data/roadmap.ts` for simplicity. Migrate to content collection in Phase 2 if needed.*

4. **Known issues storage**: Should known issues be a content collection, a data file, or part of changelog? *Recommendation: extract from the latest changelog entry programmatically. Fallback: data file.*

5. **`/design` and `/assets` pages**: Confirmed for Phase 2. Should the content directory structure be created in Phase 1 (empty) to avoid migration later? *Recommendation: yes, create empty `src/content/design/` directory to establish the pattern.*

6. **Deployment trigger**: Manual `scp` or automated via GitHub Actions? *Phase 1: manual. Document the process. Automate in Phase 2.*

7. **Analytics**: Spec mentions optional匿名统计. Should any analytics be added in Phase 1? *Recommendation: no. This is Phase 2 at earliest. Any analytics must be privacy-respecting, self-hosted if possible.*

8. **404 page**: Not in the spec but standard for static sites. Should a custom `/404.astro` be included? *Recommendation: yes, a minimal 404 with a link back to `/`. Low effort, high value.*

9. **Character card downloadability**: Should the `/characters` page offer downloadable `.STcard.png` files, or is it purely a reference page? *Recommendation for Phase 2: reference-only. Card distribution is a separate concern (tied to game build, not website). Revisit in Phase 3 if playtesters need easy card access.*

10. **Hidden character handling**: How to handle characters whose existence itself is a spoiler (e.g., 隐藏节点 NPC)? *Recommendation: omit from public `/characters` page entirely until revealed in-game. List only in private design notes. The characters collection frontmatter can include a `public: boolean` field to filter at build time.*

---

## 14. Dependency Graph

```
Phase 0 (Scaffold)
  |
  +-- 0.1: Init Astro ──> 0.2: Config ──> 0.3: CSS Variables
  |                        |
  |                        +──> 0.4: TypeScript Types
  |                        +──> 0.5: Site Data
  +-- 0.6: .gitignore (parallel)

Phase 1 (MVP Pages) -- depends on Phase 0
  |
  +-- 1.1: Layout + Nav ──────> 1.2: Atom Components
  |       |                          |
  |       +──────────────────────────+──> 1.3: Homepage
  |       +──────────────────────────+──> 1.4: Play
  |       +──────────────────────────+──> 1.5: Devlog List
  |       |                                  |
  |       |                                  +──> 1.6: Devlog Detail
  |       +──────────────────────────+──> 1.7: Roadmap
  |       +──────────────────────────+──> 1.8: Changelog
  |       +──────────────────────────+──> 1.9: About

Phase 2 (Content Collections + Characters) -- depends on Phase 0, parallel with Phase 1
  |
  +-- 2.1: Collection Config ──> 2.2: Devlog Entries
  |                              +──> 2.3: Changelog Entry
  |                              +──> 2.4: Characters Page + Content

Phase 3 (SEO/A11y/Security) -- depends on Phase 1 + 2
  |
  +-- 3.1: SEO Tags (parallel)
  +-- 3.2: OG Image  (parallel)
  +-- 3.3: A11y Audit (parallel)
  +-- 3.4: robots.txt (parallel)
  +-- 3.5: Security Check (parallel)

Phase 4 (Deployment) -- depends on Phase 1 + 2 + 3
  |
  +-- 9.1: Production Build
  +-- 9.2: Local Preview
  +-- 9.3: Nginx Config (parallel)
  +-- 9.4: Deploy Docs
```

---

## 15. Appendix: Content Templates

### A.1 Devlog Entry Template

```markdown
---
title: "日志标题"
date: "YYYY-MM-DD"
version: "v0.X.Y"
status: "planning"  # idea | planning | doing | done | paused | cancelled
tags:
  - 标签一
  - 标签二
summary: "一句话摘要，不超过 120 字。"
---

## 背景

为什么要做这件事，相关的上下文是什么。

## 当前问题

当前存在什么问题，影响了什么。

## 本次调整

做了什么，改了什么，决定了什么。

## 设计判断

为什么这样设计而不是那样。权衡了什么。

## 后续计划

接下来会做什么，优先级如何。

## 备注

补充信息，参考链接，注意事项。
```

### A.2 Changelog Entry Template

```markdown
---
version: "v0.X.Y"
date: "YYYY-MM-DD"
summary: "一句话版本摘要"
---

## v0.X.Y

日期：YYYY-MM-DD

### 新增

- 新增功能 1
- 新增功能 2

### 修复

- 修复问题 1
- 修复问题 2

### 已知问题

- 尚未解决的问题 1
- 尚未解决的问题 2
```

### A.3 Roadmap Data Structure (TypeScript)

```typescript
interface RoadmapPhase {
  id: string;
  label: string;
  description: string;
  tasks: RoadmapTask[];
}

interface RoadmapTask {
  task: string;
  status: 'not-started' | 'in-progress' | 'done' | 'paused' | 'cancelled';
  description?: string;
}
```

### A.4 Character Card Template (Phase 2)

```markdown
---
name: "角色名称"
role: "主要角色"  # 主要角色 | 隐藏角色 | NPC
playtestStatus: "in-playtest"  # in-playtest | planned | partial
description: "公开可见的角色简介，仅描述玩家初次遇到时能了解的信息。不包含隐藏身份、核心谜底或未公开线索。"
artSource: "AI 生成"  # AI 生成 | 手绘 | 待替换 | 占位素材
authorization: "self-generated"  # self-generated | pending | licensed
tags:
  - 乘客
  - 已实装
relatedDevlog:
  - "2026-06-13-why-devlog"
---

## 角色简介

（公开 Description 的详细版本，遵守 spoiler 规则。）

## 当前试玩版中的表现

角色在当前版本中已实现的功能和已知问题。

## 素材说明

立绘来源、风格方向、是否待替换、授权状态说明。

## 相关设计笔记

- [设计笔记标题](../design/design-note-slug) *(Phase 2 placeholder until design pages exist)*
```

### A.5 Characters TypeScript Interface (Phase 2)

```typescript
interface CharacterEntry {
  name: string;
  slug: string;
  role: string;
  playtestStatus: 'in-playtest' | 'planned' | 'partial';
  description: string;
  artSource?: string;
  authorization: 'self-generated' | 'pending' | 'licensed';
  tags: string[];
  relatedDevlog?: string[];
}
```

---

## Document Metadata

- **Plan version**: v1.0
- **Created**: 2026-06-13
- **Source documents**: `devlog/AGENT.md` v0.1, `devlog/docs/spec.md` v0.1
- **Next document to create**: Implementation begins with Phase 0, Task 0.1
