---
title: "解决项目代码与 Devlog 网站内容脱节"
date: "2026-06-13T18:30:00+08:00"
version: "v0.5.0-standalone"
status: "done"
tags:
  - ai-notes
  - 工程实践
  - 信息架构
summary: "LoopTrain 完成 ST 剥离后，Devlog 网站多个页面的内容仍停留在迁移前的旧状态。本文记录这个典型的信息漂移问题及我们的解决方案：将 Devlog 从手写博客改造为数据驱动的项目仪表盘。"
---

# 解决项目代码与 Devlog 网站内容脱节

## 问题

LoopTrain 完成 ST 剥离并上线后，出现了一个尴尬的现象：

- `/play/game` 已经是纯 LT Standalone Runtime，不再显示任何 SillyTavern 界面
- 但 Devlog 首页仍把"首次进入可能显示 SillyTavern 原始界面"列为已知问题
- Roadmap 写"剥离 ST：进行中"
- About 页写"SillyTavern 作为底层对话引擎"
- Changelog 写"线上 /play/game 尚未切换"

**每一条单独看都是真的，组合起来就是假的。** 这就是典型的信息漂移（Documentation Drift）。

## 根因

Devlog 的 5 个页面（首页、Play、Roadmap、About、Changelog）各自硬编码了"当前状态"信息。更新代码后，需要手动逐一修改每个页面。个人开发者精力有限，必然导致遗忘。

本质问题是：**Devlog 变成了项目的第二份文档，而不是项目状态的一个视图。**

## 解决方案

将 Devlog 从手工维护的博客，改造为**数据驱动的项目仪表盘**。

### 建立 Single Source of Truth

创建两份数据文件作为唯一事实来源：

- `src/data/site-status.json` — 版本号、阶段、已知问题、推荐设备等运行时状态
- `src/data/roadmap.ts` — 路线图各项任务的状态

```json
// site-status.json
{
  "play": {
    "currentVersion": "v0.5.0-standalone",
    "stageDescription": "已从 SillyTavern 剥离为独立运行时...",
    "knownIssues": [
      "音效系统尚未接入真实素材。",
      "用户状态保持仍为早期方案..."
    ]
  },
  "site": {
    "currentPhase": "独立运行时稳定"
  }
}
```

### 页面改为数据驱动

所有 Astro 页面从数据文件读取，不硬编码任何状态信息：

```astro
// index.astro
import siteStatus from '../data/site-status.json';
const play = siteStatus.play;

<StatusCard version={play.currentVersion} phase={site.currentPhase} />
<KnownIssue title={issue} />  // 自动渲染已知问题列表
```

改一处（`site-status.json`），首页、Play、About 全部同步更新。

### Roadmap 去承诺化

- 当前阶段只保留 `已完成` 和 `进行中`，删除所有 `未开始` 的未来承诺
- 长期阶段改名为"探索方向"，明确标注为愿景而非承诺

### Devlog 只写"发生了什么"

坚持一个原则：Devlog 条目只记录已发生的事实（完成了什么、为什么这样设计、踩了什么坑），不写预测性内容（计划、预计、可能）。

## 效果

改造后，更新一个数据文件即可反映到所有页面。Devlog 不再是与代码脱节的第二套文档，而是项目状态的实时镜像。

## 经验

对于个人长期项目，最容易被忽视的不是代码质量，而是信息一致性。一个简单的原则可以避免大量问题：

> **只维护一份事实源。其他地方都是它的视图。**
