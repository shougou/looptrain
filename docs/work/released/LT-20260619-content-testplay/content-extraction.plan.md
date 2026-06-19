# Plan: 游戏内容外置化（Content Extraction）— Revised

**Complexity**: Medium  
**Status**: ⏳ WAITING FOR CONFIRMATION

## Summary

将当前硬编码在 **15+ 个源码文件中**的 100+ 处游戏内容（NPC、场景、线索、对话、提示词、开场文本、助手回复）抽取到 `looptrain/materials/` 下的结构化 JSON 文件中。代码保留逻辑，内容全部外置。

**关键发现**：`materials/looptrain/` 已有 canonical JSON 文件（clues、scenes、episode、rules、prompts），但 engine.js 自己又硬编码了一份相同内容。策略是：**先让 engine.js 加载已有 JSON，再为缺失内容创建新文件**。

---

## 现状：100+ 处硬编码内容

| 文件 | 硬编码内容量 | 类型 |
|------|:---:|------|
| `standalone/engine.js` | **60+** | NPC(4人)、线索(8条)、场景(2个)、对话回复(10条)、系统消息(10+)、目标文本(4)、行动模板(9)、结局HTML、世界事件 |
| `standalone/public/app.js` | **15** | 命令帮助、状态格式、介绍文本、toast消息、按钮标签 |
| `standalone/public/index.html` | **8** | 开场叙事（5行中文介绍+跳过按钮+记忆闪回） |
| `llm/prompt.js` | **2** | 系统提示词模板、NPC角色规则 |
| `src/runtime/assistant/FallbackTemplateEngine.ts` | **10** | 10种意图的fallback回复 |
| `src/runtime/assistant/MockLLMProvider.ts` | **10** | Mock LLM回复模板 |
| `src/runtime/assistant/ActionRegistry.ts` | **4** | 行动定义（标签+模板） |
| `src/runtime/companion-view/CompanionViewBuilder.ts` | **2** | sceneLabel/sceneDescription |
| `src/runtime/assistant/index.ts` | **2** | 按钮标签、错误消息 |
| `src/runtime/assistant/ResponseRenderer.ts` | **2** | 助手名称、结算摘要 |
| `src/runtime/assistant/AssistantTypes.ts` | **2** | 类型字面量（'询问助手'、'许知微'） |

### 已有 Canonical JSON（engine.js 可直读）

| 已有 Materials 文件 | 对应 engine.js 硬编码 |
|------|------|
| `materials/looptrain/clues/trial_001_clues.json` | CLUE_DETAILS (lines 114-179) |
| `materials/looptrain/scenes/carriage_7.scene.json` | SCENES + suggestions |
| `materials/looptrain/episode/trial_001.episode.json` | START_STATE + 结局条件 |
| `materials/looptrain/rules/trial_001.rules.json` | 对话轮数、线索释放规则 |
| `materials/looptrain/prompts/npc_dialogue_prompt.md` | llm/prompt.js 规则 |
| `materials/looptrain/prompts/looptrain_system_prompt.md` | 系统提示词 |

---

## 目标目录结构

```text
looptrain/materials/                   # 新增文件用 ★ 标记
  looptrain/                            # 已有 canonical JSON（直接加载）
    clues/trial_001_clues.json          # 已存在 → engine.js 改为加载此文件
    scenes/carriage_7.scene.json        # 已存在 → engine.js 改为加载此文件
    episode/trial_001.episode.json      # 已存在 → engine.js 改为加载此文件
    rules/trial_001.rules.json          # 已存在 → engine.js 改为加载此文件
    prompts/                            # 已存在
  runtime/                              # ★ 新增：v0.6 运行时内容
    characters/                         # ★ 新增：NPC 定义
      xiaoning.json                     # name/role/portrait/opening/suggestions
      zhao-police.json
      shen-mohan.json
      xiaoning-mother-hidden.json
    dialogues/                          # ★ 新增：NPC 对话回复(Mock)
      xiaoning-dialogue.json            # engine.js lines 421-461 的 3 条回复
      zhao-dialogue.json
      shen-mohan-dialogue.json
    assistant/                          # ★ 新增：助手内容
      fallback-templates.json           # 10种意图 fallback（FallbackTemplateEngine）
      mock-responses.json               # 10条 Mock 回复（MockLLMProvider）
      action-definitions.json           # 4条行动定义（ActionRegistry）
      ui-labels.json                    # 按钮标签/错误消息/显示名称（AssistantController+Types+Renderer）
    intro/                              # ★ 新增：开场内容
      intro-text.json                   # index.html 的5行中文叙事
      app-strings.json                  # app.js 的 command help/toast/status labels
    scene-data/                         # ★ 新增：场景数据
      scene-labels.json                 # sceneLabel/sceneDescription（CompanionViewBuilder）
    prompts/                            # ★ 新增：LLM 提示词
      npc-system-prompt.txt             # llm/prompt.js 系统模板
      npc-rules.txt                     # llm/prompt.js 角色规则
```

---

## Files to Change

| File | Action | Why |
|---|---|---|
| `materials/runtime/characters/*.json` (4) | **CREATE** | NPC 定义（engine.js → JSON） |
| `materials/runtime/dialogues/*.json` (4) | **CREATE** | NPC 对话回复（engine.js → JSON） |
| `materials/runtime/assistant/*.json` (4) | **CREATE** | 助手内容（4个TS文件 → JSON） |
| `materials/runtime/intro/*.json` (2) | **CREATE** | 开场+前端文本（html+app.js → JSON） |
| `materials/runtime/scene-data/*.json` (1) | **CREATE** | 场景数据（CompanionViewBuilder → JSON） |
| `materials/runtime/prompts/*.txt` (2) | **CREATE** | LLM提示词（llm/prompt.js → txt） |
| `engine.js` | **UPDATE** | `loadContent()` 从 JSON 加载替代硬编码 |
| `llm/prompt.js` | **UPDATE** | 从文件加载提示词模板 |
| `public/index.html` | **UPDATE** | API 加载开场文本 |
| `public/app.js` | **UPDATE** | API 加载 app 字符串 |
| `src/runtime/assistant/FallbackTemplateEngine.ts` | **UPDATE** | RuntimeContentLoader 加载 |
| `src/runtime/assistant/MockLLMProvider.ts` | **UPDATE** | RuntimeContentLoader 加载 |
| `src/runtime/assistant/ActionRegistry.ts` | **UPDATE** | RuntimeContentLoader 加载 |
| `src/runtime/companion-view/CompanionViewBuilder.ts` | **UPDATE** | 从 materials 加载 scene |
| `src/runtime/assistant/index.ts` | **UPDATE** | 从 materials 加载 UI labels |
| `src/runtime/assistant/ResponseRenderer.ts` | **UPDATE** | 从 materials 加载显示名 |
| `server.js` | **UPDATE** | 新增 `/api/intro` + `/api/app-strings` 端点 |

---

## Tasks

### Task 1: 创建 17 个新 JSON/TXT 内容文件
NPC 定义(4) + 对话回复(4) + 助手内容(4) + 开场/前端(2) + 场景数据(1) + LLM提示词(2)

### Task 2: engine.js 改为加载已有 JSON
`loadContent()` 从 `materials/looptrain/clues/`、`scenes/`、`episode/`、`rules/` 加载，不再硬编码

### Task 3: engine.js 改为加载新 JSON
从 `materials/runtime/characters/`、`dialogues/` 加载 NPC 数据和对话

### Task 4: 抽出 Assistant 内容
FallbackTemplateEngine、MockLLMProvider、ActionRegistry、AssistantController 从 JSON 加载

### Task 5: 抽出 CompanionViewBuilder 硬编码
从 `materials/runtime/scene-data/` 加载 sceneLabel/sceneDescription

### Task 6: 抽出 LLM 提示词 + 开头文本
`llm/prompt.js` → txt 文件，`index.html` + `app.js` → API 动态加载

### Task 7: 端到端验证
`npm run build:runtime` + `npm test` + 游戏启动验证

---

## Validation

```bash
npm run build:runtime        # TS 编译
npm run test:runtime         # Runtime 测试 2/2
npm run test:standalone      # 引擎测试 6/6
node --check engine.js       # JS 语法
```

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| engine.js JSON 加载格式偏差 | **HIGH** | 先验证 JSON 输出与硬编码完全一致再替换 |
| 前端动态加载增加请求 | LOW | API 响应 < 2KB，并行加载 |
| 内容文件路径错误 | LOW | ContentPathPolicy 已加固 |

## Acceptance

- [ ] 17 个新内容文件创建 + engine.js 接入已有 6 个 JSON
- [ ] engine.js 不再包含硬编码游戏内容
- [ ] `npm run test:standalone` 6/6 pass
- [ ] `npm run test:runtime` 2/2 pass
- [ ] 游戏启动后 UI 和对话行为完全一致
