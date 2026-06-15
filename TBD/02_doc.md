---
status: accepted
type: governance-review
topic: documentation-information-architecture
created: 2026-06-15
updated: 2026-06-15
owner: shougou
target: devlog/src/content/devlog/2026-06-15-doc-governance-second-pass.md
decision: accepted
---

我先给结论：**你今天的治理方向是对的，但现在的治理还停留在“把文档放进不同栏目”，没有真正建立“文档生命周期 + 事实源 + 内容类型 + 标签词表”这四件事。**
所以文章越多，混乱不会减少，只会从“文件目录混乱”变成“网站栏目混乱”。

我只能基于公开网站审查，不能看到你本地仓库里的全部 Markdown、frontmatter 和脚本实现。

---

## 一、当前网站文档结构审查

### 1. 现在最大的问题：导航维度混杂

当前顶部导航同时放了：首页、试玩、开发日志、设计、技术、决策、AI 工程笔记、路线图、更新记录、角色、关于。它们不是同一种层级：有的是页面类型，有的是主题，有的是状态，有的是档案。([LoopTrain 开发日志][1])

这会导致一个长期问题：
以后每写一篇文章，你都会纠结“它到底放开发日志、设计、技术、决策还是 AI 工程笔记？”
比如“文档治理”现在已经同时出现在开发日志、设计文档、技术文档、决策记录里。开发日志里有《给 LoopTrain 建立文档治理规则》；设计区有《文档治理设计》；技术区有《文档治理检查器》；决策区有《0001: Devlog 作为正式长期文档中心》。这些都合理，但如果没有主从关系，就会变成同一主题的多份事实。([LoopTrain 开发日志][2]) ([LoopTrain 开发日志][3]) ([LoopTrain 开发日志][4]) ([LoopTrain 开发日志][5])

### 2. 你已经意识到“文档漂移”，但治理还没有完全闭环

你自己已经在文章里写到：多个页面硬编码当前状态，会导致首页、Play、Roadmap、About、Changelog 描述不同步；这就是 Documentation Drift。([LoopTrain 开发日志][6])

你也已经提出了 Single Source of Truth，把 `site-status.json` 和 `roadmap.ts` 作为状态事实源，这是正确方向。([LoopTrain 开发日志][6])

但现在还有一个矛盾：文章里说 Roadmap 要“删除所有未开始的未来承诺”，而当前 Roadmap 页面仍然有大量“未开始”条目。([LoopTrain 开发日志][6]) ([LoopTrain 开发日志][7])
这不一定是错，但说明规则没有变成机器可验证的约束。你需要决定：
**是允许 Roadmap 展示“未开始”，还是坚持只展示已完成/进行中？**
不能两边都写。

### 3. Devlog 的定位还不够纯

你在《解决项目代码与 Devlog 网站内容脱节》中提出一个原则：Devlog 只记录“发生了什么”，不写预测性内容。([LoopTrain 开发日志][6])

但当前 Devlog 里有《Narrative State Runtime：LoopTrain 的记忆系统设计》，状态是“计划中”，版本是 `v0.6-memory-runtime`。([LoopTrain 开发日志][8])
这类文章本质更像 RFC / Design Proposal，不是已经发生的开发日志。

我的判断是：
**Devlog 不应该承载“计划中设计稿”。**
它应该只记录已发生事实、事故、复盘、版本进展。
“计划中设计”应该进入 `design/proposals` 或 `rfcs`，等确认后再升级为正式设计文档。

### 4. 标签现在已经有失控苗头

开发日志列表中，文章标签同时出现：`ai-notes`、`工程笔记`、`项目规划`、`AI Native`、`Agent Runtime`、`设计思考`、`工程实践`、`文档治理`、`部署复盘`、`信息架构` 等。([LoopTrain 开发日志][9])

问题不是标签多，而是标签承担了太多职责：
有的是栏目，有的是主题，有的是技术域，有的是文章性质，有的是状态。

应该拆开：

```yaml
docType: devlog | design | rfc | adr | technical | runbook | postmortem | character | changelog | roadmap | ai-note
domain: runtime | narrative | llm-bridge | audio | npc | deployment | governance | ai-coding | state
status: draft | proposed | accepted | current | deprecated | legacy | archived
spoilerLevel: none | minor | major | private
tags: [辅助搜索标签]
```

也就是说：
**分类用于结构，标签只用于检索。**
现在你的标签有点反过来了，标签正在承担分类职责。

### 5. 文章正文有格式污染

部分文章页面里出现了重复标题。例如《一次 Devlog 文章丢失事故》页面，布局已经渲染了一次 H1，正文里又有一次同名 H1。([LoopTrain 开发日志][10])
《给 LoopTrain 建立文档治理规则》也有类似重复标题。([LoopTrain 开发日志][2])

这说明 Markdown 正文和 Astro 页面模板的职责没有完全分清。
规则应该是：

```text
frontmatter.title 负责页面标题
正文从 ## 开始
正文里禁止再写一级标题 #
```

这个可以加入检查器。

---

## 二、建议的文档治理核心原则

我建议你把 LoopTrain 的文档治理定成 7 条铁律：

1. **只有一份当前事实源**
   当前版本、当前阶段、已知问题、路线状态只能从结构化数据读取，不允许多页面手写。

2. **文档先有生命周期，再有分类**
   先判断它是 draft、proposed、current、deprecated，之后再判断放在哪个栏目。

3. **内容类型优先于主题标签**
   一篇文章首先是 ADR、RFC、Devlog、Runbook、Postmortem、Reference，然后才是“AI Coding / 状态管理 / 音效系统”。

4. **Devlog 只记录已发生事实**
   计划、方案、推演不要放 Devlog。Devlog 可以链接到 RFC，但不要替代 RFC。

5. **公开文档和项目内部文档分离**
   你已经有 `spoilerLevel`，这个方向正确。悬疑项目尤其要避免把隐藏身份、谜底、核心反转放进公开站点。角色页目前已经有“不涉及核心剧情剧透”的说明，这是好的。([LoopTrain 开发日志][11])

6. **旧架构必须显式标记 Legacy**
   ST / SillyTavern 相关内容不能简单删除，但必须标记历史语境。你的文档治理设计里已经写了这条。([LoopTrain 开发日志][3])

7. **每次发布前必须跑治理检查器**
   你已经有 `scripts/check_docs_governance.py`，并且检查范围包括 frontmatter、date、spoilerLevel、密钥模式、ST 旧词语境等。这个方向正确，但还需要扩展。([LoopTrain 开发日志][4])

---

## 三、推荐的信息架构

我建议把顶部导航大幅收敛，不要把所有栏目平铺出来。

### 顶部导航建议

```text
首页
试玩
项目状态
文档库
开发日志
角色档案
关于
```

不要把“设计 / 技术 / 决策 / AI 工程笔记 / 更新记录 / 路线图”全部暴露在一级导航。它们应该收进“文档库”或“项目状态”。

---

## 四、文档库结构设计

建议建立一个 `/docs` 文档中心页面，下面按“内容类型”组织，而不是按随意标签组织。

```text
/docs
├── 项目总览
│   ├── 当前状态
│   ├── 路线图
│   └── 更新记录
│
├── 游戏设计
│   ├── 世界观
│   ├── 叙事机制
│   ├── 循环机制
│   ├── 角色公开设定
│   └── 剧透受限内容索引
│
├── 技术实现
│   ├── Standalone Runtime
│   ├── LLM Bridge
│   ├── Narrative State Runtime
│   ├── 内容外置化
│   ├── 音效系统
│   ├── 部署
│   └── 测试
│
├── AI 工程实验
│   ├── AI Coding 工作流
│   ├── Agent Runtime
│   ├── Prompt Builder
│   ├── Human Approval Protocol
│   └── AI 失控/越权案例
│
├── 决策记录 ADR
│   ├── 0001 Devlog 作为正式长期文档中心
│   ├── 0002 剥离 SillyTavern
│   ├── 0003 采用 Narrative State Runtime
│   └── ...
│
├── 事故复盘 Postmortem
│   ├── Devlog 文章丢失事故
│   ├── 部署覆盖事故
│   └── ...
│
└── Legacy
    ├── SillyTavern 时代文档
    ├── v0.4.3 试玩版文档
    └── 已废弃方案
```

这个结构的关键是：
**读者先知道自己要找什么类型的文档，再进入具体主题。**

---

## 五、Frontmatter 设计

建议所有正式文档统一使用类似结构：

```yaml
---
title: "Narrative State Runtime：LoopTrain 的记忆系统设计"
slug: "narrative-state-runtime"
docType: "rfc"
domain: ["state", "runtime", "narrative"]
status: "proposed"
versionIntroduced: "v0.6-memory-runtime"
versionVerified: "v0.5.0-standalone"
createdAt: "2026-06-14"
updatedAt: "2026-06-15"
lastVerified: "2026-06-15"
spoilerLevel: "none"
canonical: true
canonicalOf: []
supersedes: []
supersededBy: null
related:
  - "/decisions/0003-narrative-state-runtime"
  - "/technical/state-runtime-schema"
summary: "设计面向循环叙事的玩家记忆系统，区分事件、知识、信念、关系和归档。"
---
```

注意这里要区分：

```text
status: 文档生命周期
versionIntroduced: 计划在哪个版本引入
versionVerified: 当前内容最后基于哪个版本核验
lastVerified: 最后人工确认日期
```

不要只写 `version`，因为一篇文档可能是“为 v0.6 设计，但当前基于 v0.5 事实写成”。

---

## 六、生命周期设计

你现在的生命周期可以这样固化：

```text
idea
  ↓
draft / TBD
  ↓
proposal / RFC
  ↓
accepted / ADR
  ↓
current / formal docs
  ↓
stale
  ↓
deprecated / legacy
  ↓
archived
```

每种状态的含义要明确：

| 状态           | 含义         | 是否可作为实现依据 |
| ------------ | ---------- | --------- |
| `draft`      | 草稿，还没收束    | 否         |
| `proposed`   | 已形成方案，但未确认 | 否         |
| `accepted`   | 决策已接受      | 是         |
| `current`    | 当前事实       | 是         |
| `stale`      | 可能过期，待校验   | 谨慎        |
| `deprecated` | 已废弃        | 否         |
| `legacy`     | 历史资料       | 否         |
| `archived`   | 只保留归档      | 否         |

这样以后你看到一篇文档，不需要猜它能不能信。

---

## 七、现有内容如何迁移

### 1. 文档治理主题

保留四篇，但分清职责：

```text
/devlog/document-governance
```

定位：一次治理行动的开发日志。
只写“今天为什么做、做了什么、遇到什么问题”。

```text
/design/document-governance
```

定位：当前正式治理设计。
这是主文档，其他文档应该链接到它。

```text
/technical/documentation-governance-checker
```

定位：工具说明。
只写脚本检查什么、怎么运行、失败如何处理。

```text
/decisions/0001-devlog-as-formal-docs-hub
```

定位：ADR。
只回答为什么选择 Devlog 作为正式文档中心，其他方案为什么放弃。

这四篇不是重复，前提是每篇开头都写清楚：

```text
本文职责：
本文不是：
相关文档：
当前状态：
```

### 2. Narrative State Runtime

现在放在 Devlog 不合适。它应该迁到：

```text
/design/proposals/narrative-state-runtime
```

或者：

```text
/rfcs/0002-narrative-state-runtime
```

等你正式采用后，再新增 ADR：

```text
/decisions/0003-adopt-narrative-state-runtime
```

Devlog 里只保留一篇记录：

```text
/devlog/start-designing-narrative-state-runtime
```

内容只写：为什么开始设计、当前问题是什么、下一步会进入 RFC。

### 3. 版本历史与 Changelog

`/changelog` 应继续保留，但要注意历史版本和当前状态视觉上分离。
比如 v0.4.3 里写“线上 /play/game 暂未切换”是历史事实，不是当前事实。最好加版本块样式：

```text
历史版本记录，不代表当前状态。
当前状态请以 /status 为准。
```

### 4. AI 工程笔记

`AI 工程笔记`不应该作为平级栏目长期存在。它更适合作为一个 domain：

```yaml
domain: ["ai-coding", "agent-runtime", "protocol"]
```

然后在 `/docs/ai-lab` 聚合展示。否则你会一直纠结：
“AI Coding 的事故复盘算 AI 工程笔记，还是算 Devlog，还是算 Postmortem？”

答案应该是：
**docType = postmortem，domain = ai-coding。**

---

## 八、检查器应该新增的规则

你现在的检查器已经有基础字段、剧透等级、旧 ST 语境、密钥检查。下一步建议加这些：

```text
1. 正文禁止一级标题 #
2. docType 必须来自白名单
3. status 必须来自白名单
4. domain 必须来自白名单
5. spoilerLevel 必须来自白名单
6. devlog 类型文章不能是 proposed / planned
7. proposed 文档必须有 related ADR 或明确写 “未决策”
8. current 文档必须有 lastVerified
9. deprecated / legacy 文档必须有 supersededBy 或 legacyReason
10. 内部链接必须可解析
11. 同一 slug 不能跨 collection 重复
12. title 高相似度文档必须声明 canonical / related
13. Roadmap 规则必须一致：是否允许未开始，由配置决定
14. 公开文档禁止出现 private / secret / hidden truth 等敏感剧情关键词，除非 spoilerLevel = private
15. ST / SillyTavern 只能出现在 legacy、postmortem、changelog 或明确历史语境中
```

---

## 九、建议的落地顺序

不要一次性大重构。按这个顺序做：

### 第一步：冻结新增分类

暂时不要再增加新栏目、新标签。
先把 `docType / domain / status / spoilerLevel` 定死。

### 第二步：生成文档清单

给所有 Markdown 自动生成一张 inventory：

```text
path
title
docType
domain
status
versionVerified
lastVerified
spoilerLevel
canonical
related
```

这个 inventory 可以生成成 `/docs/inventory` 页面，也可以只在本地检查。

### 第三步：建立 `/docs` 文档中心

把现在的设计、技术、决策、AI 工程笔记统一收进文档中心。
顶部导航只保留“文档库”。

### 第四步：清理重复标题和重复事实

尤其处理：

```text
文章正文重复 H1
同一状态多处手写
Roadmap 规则不一致
Devlog 中的计划中设计稿
文档治理主题的多篇文章职责不清
```

### 第五步：扩展检查器

让检查器成为发布闸门。你已经在部署事故后建立了保护脚本，发布前会检查本地是否落后远端、工作区是否干净、运行文档治理检查器和 Astro build/check。这个方向应该继续强化。([LoopTrain 开发日志][10])

---

## 十、最终建议

LoopTrain 的文档系统不要做成“博客分类系统”，而要做成“个人长期项目知识库”。

更准确地说，它应该是：

```text
项目事实源
+ 正式知识库
+ 开发日志
+ 决策记录
+ 事故复盘
+ 叙事资料库
+ AI 协作实验档案
```

你现在最应该改的不是再细分标签，而是建立这三个东西：

```text
1. 文档类型 docType
2. 文档生命周期 status
3. 唯一事实源 canonical / source of truth
```

只要这三件事建立起来，文章数量增加不会自然导致混乱。
否则，哪怕你把栏目分成 20 个，最后还是会乱。

[1]: https://looptrain.me/ "LoopTrain 开发日志"
[2]: https://looptrain.me/devlog/document-governance "给 LoopTrain 建立文档治理规则"
[3]: https://looptrain.me/design/document-governance "文档治理设计 — LoopTrain 开发日志"
[4]: https://looptrain.me/technical/documentation-governance-checker "文档治理检查器 — LoopTrain 开发日志"
[5]: https://looptrain.me/decisions/0001-devlog-as-formal-docs-hub "0001: Devlog 作为正式长期文档中心 — LoopTrain 开发日志"
[6]: https://looptrain.me/devlog/devlog-as-dashboard "解决项目代码与 Devlog 网站内容脱节 — LoopTrain 开发日志"
[7]: https://looptrain.me/roadmap "项目路线图 — LoopTrain 开发日志"
[8]: https://looptrain.me/devlog/narrative-state-runtime "Narrative State Runtime：LoopTrain 的记忆系统设计"
[9]: https://looptrain.me/devlog "开发日志 — LoopTrain 开发日志"
[10]: https://looptrain.me/devlog/devlog-missing-article-incident "一次 Devlog 文章丢失事故：本地分支落后远端时不要部署 — LoopTrain 开发日志"
[11]: https://looptrain.me/characters "角色档案 — LoopTrain 开发日志"
