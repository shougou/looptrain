---
title: "LoopTrain v0.8.2 — 版本号单一源与工程规范扩展"
date: "2026-06-21T20:00:00+08:00"
version: "v0.8.2-version-source"
status: "done"
tags:
  - 工程规范
  - 版本管理
  - 检查脚本
  - 一致性治理
summary: "从 3 个检查脚本 PASS 但 23 处不一致的矛盾出发，建立 VERSION 单一源 + sync_version.sh 自动同步 + check_cross_consistency.py 跨文档检查，将版本号治理从人工维护变为可验证断言。"
---

## 背景：一个矛盾的发现

上周的 Work Item 流转制建立后，我做了一次全面项目分析。结果发现了一个令人不安的事实：

**3 个检查脚本全部 PASS，但实际存在 23 处文档不一致。**

最严重的是版本号：项目有 13 个位置存储版本号，但检查脚本只覆盖了 3 个。MANIFEST 停在 v0.5，site.ts 写着 v0.8-testplay，实际项目已经到 v0.8.1——落后了 4 个大版本都没人发现。

问题不是"忘记更新文档"，而是**检查脚本的覆盖范围远小于实际事实源分布**。

## 解决：单一版本源 + 自动同步 + 全覆盖检查

### 1. VERSION 文件

建立 `/VERSION`，单行 `v0.8.2-version-source`。项目版本号的唯一真实来源。

### 2. sync_version.sh

从 VERSION 自动同步到 11 个派生位置：MANIFEST、package.json、server.js、app.js、audio-manager.js、portrait-intro.js、site-status.json、AGENT.md §2。收尾阶段必须执行。

### 3. check_release_wrapup.sh 扩展

版本一致性检查从 4 个位置扩展到 13 个，并处理 npm 语义版本格式差异。

### 4. check_cross_consistency.py

新增 5 项跨文档检查：目录存在性、文件存在性、README vs PROJECT_STATUS 矛盾、changelog Removed 落地验证、changelog Added 存在性。

### 5. AGENT.md 规则 17-20

将以上操作变为强制可验证断言：
- 规则 17: VERSION 唯一源
- 规则 18: 检查全覆盖
- 规则 19: 结构同步 PROJECT_STRUCTURE.md
- 规则 20: changelog 变更必须可验证落地

## 附带修复

公开层 4 处"陆成替换赵乘警"修正为"赵乘警保留"。这正是 check_cross_consistency.py 要捕获的问题——changelog 声称的事，代码里不一定落地了。

## 数据

| 指标 | 数值 |
|------|------|
| 修复不一致 | 23 处 |
| AC 通过 | 16/16 |
| 新增/扩展脚本 | 3 个 |
| 新增规则 | 4 条（规则 17-20） |

## 反思

工程规范的价值在于**让约束可验证**。之前的 Work Item 流程解决了"每步有固定输入输出"，这次解决了"检查覆盖了多少事实源"。

当 sync_version.sh 执行后 13 个位置全部一致——不是靠人记，是靠脚本。当 check_cross_consistency.py 检查 changelog Removed 是否真实落地——这是自动化捕获不一致。

核心原则：**每一步有固定输入输出，每一条规定可验证，每一次收尾不留尾巴。**

## 后续

规范完善为后续开发扫清道路。下一步回归游戏本身：真实 LLM 接入、Playwright 回归测试、IndexedDB 存档迁移。
