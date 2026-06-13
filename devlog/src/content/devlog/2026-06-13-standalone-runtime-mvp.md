---
title: "开始剥离 ST，建立 LoopTrain Standalone MVP"
date: "2026-06-13T11:30:00+08:00"
version: "v0.5-standalone-mvp"
status: "doing"
tags:
  - 技术实现
  - 架构调整
  - 版本进展
summary: "本次调整确认 LoopTrain 将从 ST Extension 逐步迁移为独立运行时，第一步先提取现有 Engine 和本地 Mock 闭环，不做大重写。"
---

## 背景

LoopTrain 最早以 SillyTavern Extension + Server Plugin 的形式验证玩法。这个选择让项目在早期很快获得了角色卡、世界书、模型连接和插件加载能力，也让第一版控制层可以专注在 AP、线索、对话轮数、失败结算和循环继承上。

但随着项目进入公开试玩和独立开发日志阶段，目标已经发生变化：LoopTrain 不再只是 ST 里的一个游戏包装层，而是在逐步成为一个独立互动叙事解谜游戏。

这意味着线上入口最终不应该让玩家看到 SillyTavern 原始界面。`/play/game` 应该进入 LoopTrain 自己的游戏运行时。

## 当前问题

当前 ST 集成线存在几个结构性限制：

1. **玩家入口不够干净**：Game Shell 需要隐藏 ST 原始界面，仍然存在短暂暴露或路由依赖。
2. **运行时职责混在一起**：ST 负责模型连接和上下文，LoopTrain 负责游戏状态，但边界越来越复杂。
3. **引擎逻辑存在重复**：Server Plugin 中的 `engine.js` 和前端本地 mock 逻辑存在重复维护风险。
4. **长期扩展受 ST 机制牵制**：音效、NPC 时间线、失败结算、素材管理等游戏系统不应依赖 ST 的页面结构。

## 本次调整

本次没有直接切换线上游戏入口，也没有改生产环境的 `/play/game`。这次做的是本地架构准备和 MVP 验证。

已完成的本地工作包括：

- 创建独立迁移基线 tag：`pre-lt-standalone-20260613`
- 新建本地开发分支：`lt-standalone-mvp`
- 更新 `looptrain/AGENT.md`，明确 v0.5+ 允许独立运行时迁移
- 新增 `looptrain/docs/LT_STANDALONE_ARCHITECTURE.md`
- 新建 `looptrain/standalone/` 本地原型
- 复用现有 `engine.js` 作为独立运行核心
- 搭建本地 Node/Express API
- 实现无 ST 依赖的本地前端页面
- 本地验证成功路径和失败/下一轮路径

当前 standalone 原型仍是本地验证版本，不上传线上。

## 设计判断

### 为什么不是一上来重写 Vue / FastAPI / SQLite

这次迁移的核心不是换技术栈，而是先证明一件事：

```text
LoopTrain 不依赖 ST 也能跑通最小可玩闭环。
```

现有 `engine.js` 已经是比较干净的裁判层，输入 state，输出新 state 和 messages。它不直接依赖 ST，不调用 LLM，也不依赖数据库。相比直接重写，先提取现有引擎可以更快验证架构方向，减少重新实现规则带来的风险。

因此第一阶段采用：

```text
Node + Express + 现有 engine.js + 原生前端 + Mock 模式
```

等这个闭环稳定后，再考虑是否引入 Vue、FastAPI、SQLite 或更完整的内容系统。

### 控制权不变

无论是否剥离 ST，核心原则不变：

- Engine 是唯一裁判
- LLM 只生成 NPC 表演文本或建议
- LLM 不直接修改 AP、线索、成功失败、循环继承
- API Key 不进入前端
- 本地验证先于线上部署

## 本地验证

Standalone 本地地址：

```text
http://127.0.0.1:3030/
```

已验证：

- `window.SillyTavern === false`
- 点击顶部 NPC 进入对话
- 小宁立绘和对话卡片显示正常
- 成功路径可到达「试玩版结束」
- 失败路径可到达「循环失败」
- 下一轮可进入「第 2 轮」
- `npm run check` 通过
- `npm test` 通过

## 后续计划

下一步不是立刻上线替换 ST，而是继续清理本地 standalone 原型：

1. 消除 standalone 前端里重复的 `START_STATE / SCENES / NPC_INFO`
2. 从 `materials/looptrain/**` 读取结构化内容
3. 抽出独立 LLM bridge，但默认继续保留 Mock 模式
4. 增加本地保存机制
5. 等 standalone 本地闭环稳定后，再评估是否让线上 `/play/game` 指向纯 LT 运行时

## 备注

当前线上游戏入口仍然保持：

```text
/play/game → /?looptrain=game
```

也就是仍然进入现有 ST Game Shell。Standalone MVP 只是本地验证，不影响线上试玩入口。
