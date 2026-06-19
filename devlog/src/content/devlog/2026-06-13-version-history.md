---
title: "版本历史"
date: "2026-06-19T17:00:00+08:00"
version: "v0.6.1-runtime"
status: "done"
tags:
  - 版本记录
  - 项目历史
summary: "基于 Git 提交记录整理的 LoopTrain 完整版本历史，从 v0.4.3 ST 试玩版到 v0.6.1 Runtime 架构。"
---

基于 `looptrain_st_source_runtime_v0.4` 仓库的 Git 提交记录整理（共 84 个提交，2026-06-12 至 2026-06-13），及后续 v0.6 架构重构。

---

## v0.6.2-content — 游戏内容外置化

**日期**：2026-06-19
**提交**：紧随 v0.6.1

### 内容外置化
- 17 个 JSON/TXT 内容文件创建于 `materials/runtime/`：NPC定义(4)、对话(4)、助手模板(4)、场景数据(1)、开场文本(2)、LLM提示词(2)
- engine.js 改为从 JSON 加载 NPC/线索/场景/对话数据，保留完整回退
- 11 个源码文件修改：TypeScript 文件使用 RuntimeContentLoader，服务端新增 /api/intro 和 /api/app-strings 端点
- 前端 index.html 和 app.js 改为从 API 动态加载开场文本和UI字符串

### 验证
- `npm run test:standalone` 6/6 pass · `npm run test:runtime` 2/2 pass · tsc 0 errors

---

## v0.6.1-runtime — TypeScript Runtime 架构

**日期**：2026-06-19
**提交**：`112d650` → `f572938`（6 个提交）

### Slice 0：TypeScript 骨架 + Assistant 接口
- 34 文件跨 9 模块，新增 `POST /api/assistant/ask` + `GET /api/assistant/state`
- Deterministic Assistant 8 步流水线

### Slice 1：Narrative State Runtime Core
- 25 新文件：Knowledge/Belief/Relationship/Timeline/Archive stores
- MemoryRuntime 核心引擎，Legacy 迁移器，跨循环 Reset

### Slice 2：CompanionView + Assistant 对接
- CompanionViewBuilder 从 MemoryRuntime 读取 live 数据
- ActionPlanner 基于真实 Knowledge/Belief 评分

### UX 增强 + 安全加固
- 消息发送音效、4 项高优 UX 优化
- 5 CRITICAL + 7 HIGH 全部修复（3 轮审查，零回归）

---

## v0.5.0-standalone — 独立运行时完成 + UX/UI 审计修复

**日期**：2026-06-13（当天）
**提交**：待提交（当前工作区变更）

### ST 剥离收尾

- 删除 `todos/architecture/` 空目录
- 修正 6 个文件中引用已删除 ST 路径的文档
- 消除 `app.js` 与 `engine.js` 的 6 个重复函数（`countValidEvidence`、`currentGoal`、`getSuggestions`、`clueName`、`npcName`、`sceneName`）
- `.env.example` 清除真实 API Key，新增 `.gitignore`
- 版本号全局统一到 `v0.5.0-standalone`

### UX/UI 全面审计修复

- **无障碍**：文本域添加 `aria-label`，焦点环替换为金色 `box-shadow`
- **触控**：NPC 芯片、频道标签、发送按钮等全部 `min-height ≥ 44px`
- **渲染**：`color-scheme: dark` 消除白色闪烁
- **动效**：`prefers-reduced-motion` 尊重系统减动偏好
- **性能**：`backdrop-filter` 添加 `@supports not` 降级
- **UX**：移除对话上方的快捷行动按钮
- **Bug**：修复对话中途关闭浏览器后 UI 锁死（stale dialogue 检查）

### 开发日志

- 新增 `changelog/v0.5.0-standalone.md`
- 新增 `devlog/2026-06-13-standalone-complete-ux-polish.md`
- 新增 `docs/DEPLOY.md` 部署文档
- Devlog 版本号、about、play 页面同步更新
- 上线部署至 `looptrain.me`

---

## v0.5-standalone-mvp — SLT 独立运行时 MVP

**日期**：2026-06-13
**提交**：`b4c6066` → `ad813f5`（33 个提交）
**基线标记**：`pre-lt-standalone-20260613`

### 架构迁移

- 创建分支 `lt-standalone-mvp`，打 tag `pre-lt-standalone-20260613`
- 授权独立运行时迁移（`SLT 架构: 授权独立运行时迁移`）
- 新增 `looptrain/standalone/` 本地独立 Node + Express 运行时
- 复用 `engine.js` 核心裁判引擎，无 ST 依赖
- 新增 `scripts/start_slt.sh` 和 `scripts/verify_slt.sh`

### ST 删除

- 删除 `workspace/SillyTavern/`
- 删除 `st-extension/`、`st-server-plugin/`、`st-character-cards/`
- 删除 `mock-harness/`、`runtime_imports/`
- 删除全部 ST 相关脚本

### LLM Bridge

- 新增 `llm/prompt.js`、`llm/providers.js`
- 新增 `/api/llm/npc-reply` 端点
- 前端 Mock/LLM 双模式切换
- DeepSeek 调用已验证
- API Key 仅在后端 `.env`

### 内容去重

- `app.js` 从 API 动态加载 START_STATE / SCENES / NPC_INFO
- 前端不再硬编码内容数据

### UI 修复

- 对话滚动修复、重置状态清理
- Intro 期间隐藏内容区
- 频道切换提示（扮演说明 + 指令列表）
- 隐藏 NPC 立绘闪回 + 芯片独立配色
- 按钮样式切换、焦点移除

### 文档重写

- `AGENT.md`、`README.md`、`SPEC.md`、`UI_UX_DESIGN.md`、`LT_STANDALONE_ARCHITECTURE.md` 全部 SLT-first
- 测试迁移为 `require('../standalone/engine')`

### Devlog 初始化

- `Devlog 工程骨架: 初始化 Astro 静态站`
- `Devlog 设计系统: 增加全局样式和基础组件`
- `Devlog 页面: 实现首页试玩和内容路由`
- `Devlog 内容: 增加日志版本和角色资料`
- `Devlog 部署: 增加发布说明和 Nginx 模板`

---

## v0.4.3 — ST 试玩版基线

**日期**：2026-06-12
**提交**：`f2bc396` → `8953369`（51 个提交）

### 核心技术

- LoopTrain-ST Source Runtime v0.4.3 基线（`f2bc396`）
- 双场景 + NPC 场景分布 + 场景切换 + 默认全屏（`e620ee5`）
- Server Plugin CRSF token 自动获取（`4e7cdec`）
- 游戏状态持久化：localStorage 主存档 + ST chatMetadata 备用（`366b405`）
- CSRF 降级重试（`8953369`）

### Game Shell 移动端适配

- Game Shell 手机端页面截断修复：`100vh → 100% + dvh`（`fcc1cef`）
- 手机黑屏修复：JS 设 phone 高度 + CSS dvh 兜底（`dba06af`）
- Game Shell 偏位修复：shell 顶部对齐（`0ab9cfe`）
- 右上角非游戏按钮移除：状态徽章、重置、ST 设置（`fe191a7`）

### 启动遮罩

- 共 11 个提交迭代，从 CSS 伪元素到 JS DOM 注入
- 最终方案：`boot-hide.html` 持久化注入，`game-ready` 事件驱动移除
- 支持竖版背景图资产

### 语音输入

- Web Speech API 实时语音转文字（`134b67b`）
- Android Chrome 兼容适配、getUserMedia 权限预获取
- 按住说话 + 点击切换两种模式迭代
- 静默失败修复：no-speech 不中断 + 15 秒超时保护

### NPC 与剧情

- 年代更新：1947 → 1939，加入重庆大轰炸开场背景（`a4ab3a0`）
- 开场动画：电影字幕滚动入场 + 点击跳过（`80d9196`）
- 小宁妈妈隐藏节点：触发难度提升 + 兼容旧状态 + 解锁可对话 NPC（`00b823e`、`366b405`）
- NPC 立绘清晰度提升 + 移动端高度兜底（`4b7d857`）

### LLM 控制

- NPC 提示词和清洗规则强化：禁止编造称谓/人物信息/过度情绪（`8c31961`）

### 交互简化

- 移除快捷行动提示（`1672d08`、`f997039`）
- 场景切换移至场景卡蓝色按钮
- 新增结束对话按钮 + 修复语音重复

### 部署

- 云服务器一键部署方案：`deploy_setup.sh` + nginx 配置 + 部署文档（`967bbbb`）
- 项目铁律追加：根因分析优先 + 先本地部署确认再发布线上

---

## 版本演进总览

```text
v0.4.3 (ST baseline)
  ├─ 核心游戏引擎
  ├─ Game Shell 移动端适配
  ├─ 启动遮罩 / 语音输入
  ├─ NPC 与剧情 / LLM 规则
  └─ 一键部署方案

       ↓ 打 tag: pre-lt-standalone-20260613

v0.5-standalone-mvp (SLT extraction)
  ├─ 删除所有 ST 文件
  ├─ standalone/ 独立运行时
  ├─ LLM Bridge (DeepSeek + Mock)
  ├─ UI 修复 / 内容去重
  └─ Devlog 网站初始化

       ↓ 全面审计 + UX/UI 打磨

v0.5.0-standalone (当前)
  ├─ 代码去重 / 安全加固 / 文档统一
  ├─ 无障碍 / 触控 / 性能优化
  ├─ 版本号全局统一
  └─ Devlog 部署上线

       ↓ UX 优化 + 音效 + v0.6 架构重构

v0.6.1-runtime (当前最新)
  ├─ 61 TS 文件 / 20 模块 / 3 Slice
  ├─ MemoryRuntime (Event Log → Knowledge/Belief/Timeline)
  ├─ Deterministic Assistant 流水线
  ├─ 3 轮代码审查 (12 issues 全部修复)
  └─ LOOP_ENGINEERING 开发范式建立
```

## 统计

| 指标 | 数值 |
|------|------|
| 总提交数 | 91 |
| 涉及日期 | 2026-06-12 ~ 2026-06-19 |
| 版本里程碑 | 4 个（v0.4.3, v0.5-mvp, v0.5.0, v0.6.1） |
| TS 源文件 | 61 files, 20 modules |
| 编译 | 0 errors (strict mode) |
| 测试 | 8/8 pass |
