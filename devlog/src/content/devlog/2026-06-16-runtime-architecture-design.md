---
title: "Runtime 架构设计：Slice 0 实施基线"
date: "2026-06-16T18:35:00+08:00"
version: "v0.5.0-standalone"
status: "done"
tags:
  - Runtime
  - 技术文档
  - Memory Runtime
  - Assistant Runtime
summary: "LoopTrain Runtime 架构设计已发布到技术文档库，明确 Slice 0 的 TypeScript host、Runtime API、CompanionView、Deterministic Assistant Runtime 和 LLM 边界。"
pinned: false
---

## 发布内容

Runtime 架构设计已经进入技术文档库：

```text
/technical/runtime-architecture-design/
```

这篇技术规格把当前 `looptrain/standalone/` 的 v0.5 状态，和后续分层 Runtime 的开发路径连接起来。重点不是“让 LLM 扮演许知微”，而是先建立一条可验证的边界：Engine 负责裁判，Memory 负责记录，CompanionView 负责过滤，Assistant 负责引导，LLM 只负责表达。

## 这次冻结了什么

文档把 Slice 0 的几个容易分叉的决策写死：

- Runtime TypeScript 源码放在 `looptrain/standalone/src/runtime/`。
- 编译输出放在 `looptrain/standalone/dist/runtime/`。
- Slice 0 保持 CommonJS，不切 ESM。
- `server.js` 继续作为 standalone host，通过 `require('./dist/runtime')` 引入 Runtime。
- 第一版 Assistant Runtime 必须支持 `LT_LLM_PROVIDER=disabled`。
- 推荐行动只能来自 ActionRegistry 和 ActionPlanner，点击后填充输入框，不自动执行。

## 为什么先做这个

当前 SLT 已经能跑通试玩闭环，但状态仍然是 flat snapshot。继续往上叠助手、记忆、复盘和 LLM 表达之前，必须先让系统证明一件事：

```text
许知微当前允许知道什么，允许说什么。
```

如果这个边界不清楚，后续任何“助手”都会滑向攻略、剧透或状态污染。

## 阅读入口

完整技术文档在这里：

[Runtime 架构设计](/technical/runtime-architecture-design/)
