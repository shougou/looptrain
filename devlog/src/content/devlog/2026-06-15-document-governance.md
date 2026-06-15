---
title: "给 LoopTrain 建立文档治理规则"
date: "2026-06-15T15:42:00+08:00"
version: "v0.5.0-standalone"
status: "planning"
tags:
  - 工程实践
  - 信息架构
  - 文档治理
summary: "LoopTrain 从 SillyTavern 验证包迁移到独立运行时后，项目文档开始分散在 README、docs、materials、devlog 和 TBD 中。本文记录一次文档治理决策：保留 TBD 作为讨论稿区，把 devlog 作为正式长期文档中心。"
---

LoopTrain 现在遇到的不是“没有文档”的问题，而是另一个更隐蔽的问题：文档开始变多了。

根目录有 README 和部署总览。`looptrain/` 下面有架构、控制流、UI/UX、部署说明。`materials/` 里有素材和控制层笔记。`devlog/` 自己也有规格、设计、内容模型和开发日志。除此之外，还有 `TBD/`，里面放着还没有定稿的角色和机制设计。

这些文档各自都有价值。但如果不治理，很快会出现一个问题：

> 同一个项目状态，被多个文件用不同时间点的语言描述。

这比没有文档更危险。没有文档时，至少知道自己缺东西；文档漂移时，每一段单独看都像是真的，组合起来却会误导人。

## 当前决定

这次先不做代码重构，只做一件事：给 LoopTrain 建立一套轻量文档治理规则。

核心决策有三条。

## 1. `TBD/` 保留为讨论稿区

`TBD/` 不删除，也不迁走。

它的职责是保存还没有定稿的东西：

- 新 NPC 设计
- 机制草案
- 架构替代方案
- LLM Bridge 风险分析
- 内容外置化计划
- 暂时不知道是否要实现的长期想法

`TBD/` 的内容可以是粗糙的，可以有多个方向，可以不稳定。它的价值就在于允许想法还没有变成正式方案。

但规则也很明确：

> `TBD/` 不代表当前事实。

如果一个方案还在 `TBD/`，它就不能直接作为实现依据。它需要先被讨论、收束、接受，再进入正式文档。

## 2. Devlog 成为正式长期文档中心

LoopTrain 的 devlog 一开始只是开发日志站。但项目演进到现在，它已经更像一个长期项目档案：

- 记录开发过程
- 记录版本变化
- 记录设计判断
- 解释当前状态
- 给试玩入口和路线图提供上下文

所以正式文档最终应该进入 devlog 内容区，而不是继续散落在各个目录。

长期目标结构会类似这样：

```text
devlog/src/content/
├── devlog/       # 开发过程记录
├── changelog/    # 版本记录
├── characters/   # 可公开角色资料
├── design/       # 设计、机制、架构说明
├── technical/    # API、部署、测试、内容模型
└── decisions/    # 重要决策记录
```

这不是说马上把所有文档搬进去。第一步只是确定方向：

> Devlog 不只是博客，而是 LoopTrain 的正式知识库。

## 3. 根目录只保留入口职责

根目录文档应该短。

`README.md` 负责告诉人：

- LoopTrain 是什么
- 当前主线是什么
- 怎么启动
- 怎么验证
- 哪些原则不能破坏
- 去哪里看详细文档

`DEPLOYMENT.md` 负责部署总览。

`MANIFEST.json` 负责机器可读的当前事实。

根目录不应该继续长成第二套文档系统。它应该像地图入口，而不是图书馆本身。

## 正式文档需要状态

以后正式文档至少要回答五个问题：

```yaml
status: current
version: v0.5.0-standalone
lastVerified: 2026-06-15
scope: documentation
spoilerLevel: none
```

这几个字段的作用很简单：

- `status`：这篇文档现在还有效吗？
- `version`：它对应哪个项目版本？
- `lastVerified`：最后一次确认是什么时候？
- `scope`：它管哪一块？
- `spoilerLevel`：它能不能公开？

LoopTrain 是悬疑叙事项目，所以 `spoilerLevel` 很重要。技术文档通常是 `none`。角色公开页最多只能有轻微设定。核心真相、隐藏身份、关键谜底不能进入公开页面。

## 旧 ST 内容要进入历史层

LoopTrain 已经从 SillyTavern 验证阶段迁移到 Standalone Runtime。

这不意味着旧 ST 文档没有价值。它们记录了项目早期如何验证想法。但它们不能继续作为当前架构说明。

所以旧 ST 内容以后要明确标记为：

```yaml
status: legacy
```

或者在正文中写清楚：

```text
本节描述历史实现，不代表当前 SLT 架构。
```

这样后面再看文档时，就不会把历史路径误当成当前事实。

## 当前事实谁说了算

当文档互相冲突时，按这个顺序判断：

```text
1. 实际运行代码
2. MANIFEST.json
3. 根 README.md
4. devlog/src/data/site-status.json
5. devlog/src/data/site.ts
6. devlog 正式文档
7. looptrain/docs 旧文档
8. TBD 草稿
```

这条规则能避免很多争论。

如果 TBD 和 README 冲突，README 赢。

如果旧文档和运行代码冲突，代码赢。

如果 devlog 文章和 `site-status.json` 冲突，说明 devlog 文章需要更新。

## 下一步

第一阶段先不追求完整迁移，只做最容易减少误解的事情：

1. 建立文档迁移清单。
2. 标记旧 ST 内容为 legacy。
3. 统一版本号表达。
4. 补齐几个关键正式文档：API Reference、LLM Bridge、Testing Guide、Content Schema。
5. 后续再把重要设计文档迁入 devlog 的正式分类。

这套规则的目标不是增加流程负担，而是让长期项目少丢上下文。

LoopTrain 接下来会继续变化。文档治理的作用，就是让变化留下可靠痕迹，而不是散落在不同目录、不同时间点、不同版本的说法里。
