# v0.6 代码评审分析报告

**审查日期**: 2026-06-19  
**范围**: v0.6 Slice 0 + Slice 1 全部开发内容（63 files）  
**分支**: `lt-standalone-mvp`  
**基准**: `9a28011 feat: v0.6.0 Slice 1 - Narrative State Runtime Core`  
**决定**: ✅ **APPROVE** with comments

---

## 概要

v0.6 开发完成了从 v0.5 standalone flat-snapshot-state 到分层 TypeScript Runtime 架构的迁移。Slice 0 建立了 TypeScript 骨架和确定性 Assistant 流水线，Slice 1 实现了真正的 Memory Runtime Core（Knowledge/Belief/Relationship/Timeline/Archive 存储层 + 跨循环重置 + Prompt 上下文构建）。

代码结构清晰，严格遵循 spec 文档中的分层架构设计。CommonJS 模块格式一致，strict TypeScript 编译 0 错误，所有测试通过。

---

## 验证结果

| Check | Result |
|---|:---:|
| TypeScript 编译 (`tsc -p tsconfig.runtime.json`) | ✅ Pass |
| 运行时测试 (`npm run test:runtime`) | ✅ 2/2 Pass |
| 独立冒烟测试 (`npm run test:standalone`) | ✅ 6/6 Pass |
| 语法检查 (`node --check server.js`) | ✅ Pass |
| 文件总数 (src/runtime/*.ts) | 61 files, 3335 lines |
| 模块数 | 20 modules |
| 运行时导出数 | 57 named exports |

---

## 积极发现

1. **严格类型化架构**: `strict: true`、CommonJS 命名导出，无 `any` 类型
2. **安全设计**: API keys 仅环境变量，无硬编码 secret，无 eval()，无 child_process
3. **分层设计**: Knowledge/Belief 明确区分，hiddenTruthAccessible: false 类型级不变式
4. **事件溯源模式**: 29 种 MemoryEvent 类型，eventSeq 链，prevEventId 可追溯
5. **反剧透架构**: CompanionVisibilityFilter 强制执行 spoiler level 过滤
6. **输入验证加固**: 上一周期 5 个 CRITICAL 问题已全部修复
7. **路径遍历防护**: RuntimeContentLoader 强制调用 ContentPathPolicy
8. **错误边界**: AssistantController.ask() 有 try/catch 包裹

---

## 发现项

### 🔴 CRITICAL (0)

无 CRITICAL 问题。上一周期 5 个 CRITICAL 已全部修复。

---

### 🟠 HIGH (1)

**1. Express 缺少请求体大小限制**

| 文件 | 行号 |
|------|------|
| `looptrain/standalone/server.js` | 26 |

**问题**: `app.use(express.json())` 未设置 limit 参数，大体积 POST 请求可耗尽内存。

**修复**: `app.use(express.json({ limit: '1mb' }));`

---

### 🟡 MEDIUM (7)

**2. MemoryProjector.ts 259 行 — 需要拆分**

未来事件类型增多后应拆分为独立处理器文件。

---

**3. ContentLoader 同步 I/O 阻塞**

`fs.readFileSync` 在请求处理期间阻塞事件循环。建议 Slice 2 迁移为 `fs.promises`。

---

**4. 存储接口不一致**

`RelationshipStore.set(npcId, record)` vs 其他 stores 的 `add(record)` 签名不一致。

---

**5. 测试覆盖不足（~15%）**

2 个测试文件 150 行覆盖 3335 行源码。缺失专项测试：PolicyEngine、ActionPlanner、OutputValidator、IntentClassifier、Migrator、ResetPlanner。

---

**6. 硬编码内容文本**

游戏内容硬编码在 TS 源文件中。建议迁移到 `materials/runtime/` JSON。

---

**7. 数组字段缺少 readonly**

接口数组字段可变，流水线中意外修改会导致状态不一致。建议添加 `readonly` 修饰符。

---

**8. .env 加载静默吞掉错误**

dotenv 错误（权限/解析）被静默丢弃。建议区分 ENOENT 和其他错误。

---

### 🟢 LOW (4)

9. `generateViewId()` 末尾随机数导致非确定性
10. `buildErrorResult(_loopCount)` 参数未使用
11. `assistant.id: 'xu_zhiwei'` 单值字面量类型
12. `ForbiddenRevealRule.permanent: true` 字面量而非 boolean

---

## 文件审查列表（63 个）

| 模块 | 新增/修改 | 文件数 |
|------|-----------|--------|
| shared/ | Slice 0 | 4 |
| ids/ | Slice 0 | 2 |
| engine/ | Slice 0 | 3 |
| memory/ | Slice 1 新增 | 3 |
| companion-view/ | Slice 0 + 修复 | 5 |
| assistant/ | Slice 0 | 12 |
| content/ | Slice 0 + 修复 | 2 |
| policy/ | Slice 0 | 2 |
| knowledge/ | Slice 1 新增 | 2 |
| belief/ | Slice 1 新增 | 2 |
| relationship/ | Slice 1 新增 | 2 |
| timeline/ | Slice 1 新增 | 2 |
| archive/ | Slice 1 新增 | 2 |
| profile/ | Slice 1 新增 | 2 |
| snapshot/ | Slice 1 新增 | 1 |
| storage/ | Slice 1 新增 | 1 |
| migration/ | Slice 1 新增 | 3 |
| reset/ | Slice 1 新增 | 3 |
| prompt/ | Slice 1 新增 | 2 |
| tests/ | Slice 0 + 1 | 2 |
| server.js | 修改 | 1 |
| tsconfig/package | Slice 0 | 2 |

---

## 决定

**✅ APPROVE** — 零 CRITICAL，1 HIGH（body limit 建议部署前修复），7 MEDIUM，4 LOW。

审查确认：
- 上一周期 5 CRITICAL 全部已修复
- tsc 0 错误、测试全部通过
- 无安全漏洞
- 架构严格遵循 spec

**建议下一步**: 修复 body limit，进入 Slice 2（CompanionView + Assistant Integration）。
