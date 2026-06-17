---
title: "Loop Engineering 的应用与 LT 自开发实验设想"
date: "2026-06-17T10:00:00+08:00"
version: "v0.5.0"
status: "done"
tags:
  - AI 工程
  - 设计思考
  - Loop Engineering
summary: "AI Coding 发展到今天，核心问题已经不再是“AI 能不能写代码”，而是“AI 如何在一个长期项目中稳定、可控、可验证地持续工作”。本文讨论 Loop Engineering 方法论，以及 LoopTrain 如何实践“LT 自己开发 LT”的自开发实验。"
---

## 一、为什么关注 Loop Engineering

AI Coding 发展到今天，核心问题已经不再是“AI 能不能写代码”，而是“AI 如何在一个长期项目中稳定、可控、可验证地持续工作”。

一次性的 Prompt 可以解决局部问题，但无法支撑长期项目。长期项目需要记忆、状态、规则、验证、回滚、审查和持续演进。尤其是像 LT 这样的项目，它不是一个普通 Web 应用，而是同时包含互动叙事、游戏运行时、角色系统、时间线、玩家记忆、移动端体验、文档治理和 AI 协作流程的综合实验项目。

因此，Loop Engineering 的价值不在于创造一个新术语，而在于提醒我们：AI 协作的核心不应该只是写好一个 Prompt，而是设计一套能够反复执行、不断验证、持续沉淀状态的工程循环。

简单说：

> Prompt 解决一次回答，Loop 解决持续演化。

LT 的长期目标并不是单纯用 AI 辅助开发一个游戏，而是探索一种更深层的可能性：让 LT 的开发过程本身也成为一种 runtime，让 AI 在受控循环中读取规划、拆解任务、实现变更、运行验证、接受审查、更新项目记忆，并逐步推动 LT 自身演化。

这就是本文讨论的核心：如何把 Loop Engineering 应用到 LT，并设计一个“LT 自己开发 LT”的实验路径。

---

## 二、Loop Engineering 的基本原理

Loop Engineering 可以理解为一种面向 AI Agent 的工程组织方法。它的核心不是让 AI 无限自动执行，而是把 AI 的工作过程组织成一个可观察、可中断、可验证、可积累状态的循环。

一个基本的 Loop 可以抽象为：

```text
目标输入
  ↓
读取上下文与状态
  ↓
生成计划
  ↓
执行动作
  ↓
运行验证
  ↓
审查结果
  ↓
记录状态
  ↓
进入下一轮
```

这与传统软件开发流程的差异非常明显。

传统开发更多依赖人的连续记忆和经验判断。AI Coding 则不同，AI 的上下文窗口有限，容易忘记历史，也容易在局部任务中产生偏移。因此，长期项目不能把关键知识只放在对话里，而必须把它们外部化、文件化、结构化。

Loop Engineering 的关键思想包括六点。

第一，**目标必须明确**。AI 不适合处理“优化一下项目”这种泛目标。每个 Loop 都应该有清晰的输入、边界和验收标准。例如“新增一名乘务员 NPC，并接入角色列表和对话入口”，比“丰富剧情角色”更适合进入开发循环。

第二，**状态必须外部化**。项目的当前目标、已完成事项、风险、未验证内容、下一步建议，都应该写入仓库中的状态文件，而不是只存在于一次对话上下文中。对于 LT 来说，可以使用 `.ai/loop-state.md` 作为 Dev Runtime 的外部记忆。

第三，**规则必须工程化**。项目规则不能只靠人反复提醒，而应该沉淀为 `CLAUDE.md`、`AGENTS.md`、skills、hooks、reviewer prompt 等固定资产。例如 LT 可以明确规定：不能擅自改主线真相，不能删除已有剧情逻辑，不能绕过移动端验证，不能在未批准情况下自动部署。

第四，**验证必须自动化**。AI 写完代码不等于任务完成。构建、lint、测试、类型检查、关键页面手工检查、剧情一致性审查，都应该成为 Loop 的一部分。没有验证的 AI Coding，本质上只是文本生成。

第五，**审查必须分离**。实现者和审查者最好不是同一个 Agent。实现 Agent 负责改代码，Reviewer Agent 负责看 diff、查风险、判断是否满足验收。对于 LT，还应该增加 Narrative Guardian，专门检查剧情、角色、人设、时间线和线索释放是否一致。

第六，**循环必须受控**。Loop Engineering 不等于放任 AI 自主开发。低风险任务可以让 AI 自动实现，中风险任务需要先出计划再执行，高风险任务只能分析不能自动修改。自动化的边界越清楚，AI 协作越可靠。

因此，Loop Engineering 的本质可以概括为：

> 将 AI 的不稳定自然语言能力，嵌入一套稳定的工程循环中，通过状态、规则、验证和审查，把一次性生成能力转化为长期项目生产力。

---

## 三、Loop Engineering 的具体方法路径

Loop Engineering 可以分为四个层次逐步落地。

### 1. Context Layer：上下文层

这是最基础的一层，目标是让 AI 每次进入项目时都知道自己面对的是什么。

对于 LT，可以建立：

```text
CLAUDE.md
AGENTS.md
.ai/loop-state.md
docs/design/
docs/devlog/
docs/runtime/
```

其中 `CLAUDE.md` 用于定义项目铁律，`.ai/loop-state.md` 用于记录当前开发状态，设计文档用于提供架构和剧情上下文。

这一层解决的问题是：AI 不应该每次都从零理解项目。

### 2. Skill Layer：技能层

当某类任务反复出现时，就应该沉淀为 Skill。

LT 可以先定义四类 Skill：

```text
lt-feature-loop      功能开发循环
lt-narrative-review  剧情一致性审查
lt-mobile-ui-check   移动端体验检查
lt-doc-sync          文档同步检查
```

Skill 的作用是把经验变成可复用流程。比如“新增角色”不是让 AI 自由发挥，而是要求它按固定步骤处理：角色设定、时间线、对话种子、线索绑定、UI 注册、记忆规则、测试和文档。

### 3. Verification Layer：验证层

这一层决定 AI Coding 是否可信。

LT 的验证不能只有 build。因为 LT 是互动叙事项目，验证至少包括：

```text
代码验证：build / lint / test
UI 验证：移动端首屏、输入框、角色展示、遮罩层
运行时验证：状态保存、循环重置、记忆继承
剧情验证：角色动机、线索释放、时间线一致性
文档验证：设计文档与实现是否同步
```

如果只验证代码能不能跑，LT 很容易出现“技术上通过，体验和剧情上失败”的情况。

### 4. Runtime Layer：开发运行时层

这是最有价值的一层，也是 LT 可以形成独特实验的地方。

传统项目中，开发流程是散乱的：人写 TODO，人写代码，人整理文档。LT 可以进一步把开发流程 runtime 化：

```text
TBD / 规划文档
  ↓
Change Request
  ↓
Loop Plan
  ↓
Agent 实现
  ↓
Verifier 验证
  ↓
Reviewer 审查
  ↓
State Writer 更新状态
```

也就是说，TBD 不再只是待办列表，而是 Dev Runtime 的输入。AI 读取 TBD 后，把自然语言规划编译成结构化 Change Request，再生成开发计划，进入受控实现循环。

这就是“LT 自己开发 LT”的基础。

---

## 四、LT 为什么适合做 Loop Engineering 实验

LT 天然适合成为 Loop Engineering 的实验场，原因有三个。

第一，LT 是长期演化项目。它不是一次性脚本，也不是单功能工具，而是会持续增加角色、剧情、线索、系统能力和文档体系。长期项目最需要外部记忆和工程循环。

第二，LT 的复杂性不是单纯代码复杂，而是“代码 + 剧情 + 状态 + 体验”的复合复杂。普通 AI Coding 很容易只解决局部代码问题，却破坏整体体验。Loop Engineering 正好可以把剧情审查、状态验证、文档同步纳入开发循环。

第三，LT 本身的游戏机制就是 Loop。玩家在游戏中经历时间循环，保存记忆，改变行动，逐步逼近真相。而开发侧也可以形成类似循环：AI 读取项目状态，执行开发行动，验证结果，保存工程记忆，再进入下一轮。

这使得 LT 有机会形成一种非常有意思的双 runtime 结构：

```text
Game Runtime：
玩家输入 → 游戏状态 → NPC 响应 → 时间线变化 → 记忆沉淀

Dev Runtime：
TBD 输入 → 开发状态 → Agent 实现 → 代码/文档变化 → 工程记忆沉淀
```

这两个 runtime 在抽象上是同构的。它们都包含输入、状态、策略、行动、验证和记忆。

因此，LT 不只是使用 Loop Engineering，而是可以把 Loop Engineering 变成项目自身的方法论。

---

## 五、LT 应用 Loop Engineering 的技术路径

LT 的技术路径不应该一开始就追求复杂自动化，而应该从文件驱动、轻量闭环开始。

### 1. 建立 `.ai` 目录

建议新增：

```text
.ai/
  loop-state.md
  tbd-index.md

  dev-runtime/
    change-request.schema.json
    loop-plan.schema.json
    verification-report.schema.json
    narrative-review.schema.json

  loops/
    add-character.md
    add-clue.md
    fix-mobile-ui.md
    sync-docs.md

  agents/
    lt-implementer.md
    lt-reviewer.md
    lt-narrative-guardian.md
    lt-test-runner.md
```

这个目录的目标不是制造形式感，而是为 AI 协作提供稳定入口。

### 2. 把 TBD 升级为结构化输入

目前 TBD 可以继续用 Markdown 写，但每个任务最好逐步形成固定结构：

```text
目标
背景
约束
影响范围
验收标准
风险等级
是否允许自动实现
```

例如“新增角色”不应该只写一句“增加乘务员角色”，而应该包含：

```text
角色作用
不能透露的信息
允许透露的信息
首次出现时机
与现有角色关系
对时间线的影响
对 UI 的影响
对记忆系统的影响
验收标准
```

这样 AI 才能从规划中生成可执行任务，而不是自由创作。

### 3. 建立 Change Request

Dev Runtime 的核心中间产物应该是 Change Request。

例如：

```json
{
  "type": "add_character",
  "title": "新增列车乘务员 NPC",
  "risk_level": "medium",
  "source": "docs/TBD.md",
  "runtime_impact": [
    "npc_registry",
    "timeline",
    "dialogue",
    "memory",
    "mobile_ui",
    "docs"
  ],
  "requires_human_approval": true,
  "acceptance": [
    "角色能在游戏中出现",
    "对话可以触发",
    "不破坏已有主线",
    "移动端 UI 正常",
    "build 通过",
    "剧情审查通过"
  ]
}
```

这个文件的意义是：把自然语言规划编译成工程任务。

### 4. 建立角色新增 Loop

角色新增是 LT 最适合的第一类实验，因为它既足够真实，又不至于直接触碰底层架构。

角色新增 Loop 可以设计为：

```text
读取 TBD 角色规划
  ↓
生成 Change Request
  ↓
生成 Loop Plan
  ↓
检查剧情冲突
  ↓
生成角色 profile
  ↓
生成 NPC timeline
  ↓
生成 dialogue seed
  ↓
注册到 runtime
  ↓
更新行动推荐逻辑
  ↓
更新 memory rule
  ↓
更新文档
  ↓
运行验证
  ↓
Reviewer 审查
  ↓
Narrative Guardian 审查
  ↓
更新 loop-state
```

这里需要注意：角色不是一段文案，而是一组 runtime artifact。

未来 LT 的角色可以统一抽象为：

```text
character profile
knowledge boundary
timeline schedule
dialogue seed
clue permission
memory rule
ui metadata
test case
```

只有角色结构化，AI 才能稳定增加角色。

### 5. 建立风险分级机制

LT 应该明确区分三类任务。

**低风险任务**：

```text
文档同步
样式微调
小型 bug 修复
测试补充
状态文件更新
```

这些可以让 AI 自动实现，但仍需要记录结果。

**中风险任务**：

```text
新增角色
新增线索
新增对话入口
新增音效触发点
调整行动推荐逻辑
```

这些必须先生成计划，经人类批准后再实现。

**高风险任务**：

```text
主线真相修改
核心时间线重写
状态机重构
持久化架构替换
自动部署
删除大量文件
```

这些只允许 AI 分析，不允许自动修改。

这个边界非常重要。LT 的核心资产不是代码，而是方向、叙事结构和体验判断，这些必须由人控制。

---

## 六、实验规划：LT Self-Development Loop

LT 可以设计一个分阶段实验计划。

### Phase 0：基础准备

目标是建立最小 Dev Runtime。

任务包括：

```text
新增 CLAUDE.md
新增 .ai/loop-state.md
整理 TBD 格式
定义 Change Request 模板
定义 Loop Plan 模板
定义 Verification Report 模板
```

验收标准：

```text
AI 能读取当前项目状态
AI 能基于 TBD 生成开发计划
AI 不直接开始改代码
AI 能明确风险和验收标准
```

这一阶段重点不是自动化，而是建立开发循环的语义基础。

### Phase 1：文档同步 Loop

目标是先让 AI 做低风险循环。

输入：

```text
最近代码变化
设计文档
devlog
loop-state
```

输出：

```text
文档差异分析
需要同步的文档列表
建议更新内容
更新后的 loop-state
```

验收标准：

```text
文档不会脱离实际实现
AI 能指出哪些设计已经过期
AI 能沉淀下一步开发建议
```

这是最安全的第一步。

### Phase 2：移动端 UI Loop

目标是让 AI 在小范围内修复体验问题。

适合任务：

```text
开场字幕位置
遮罩层显示
角色立绘布局
输入框区域
移动端滚动问题
debug 信息隐藏
```

验收标准：

```text
390px 宽度下可用
首屏不暴露底层系统
输入区不遮挡
build 通过
变更范围可控
```

这个阶段可以验证 AI 是否能在明确约束下完成小型前端闭环。

### Phase 3：角色新增 Loop

这是 LT 自开发实验的关键阶段。

输入：

```text
TBD 中的一条角色规划
```

输出：

```text
change-request.json
loop-plan.md
角色设定
时间线
对话种子
runtime 注册
memory rule
文档更新
verification report
```

验收标准：

```text
角色可以出现在游戏中
对话入口可以触发
不破坏已有角色和主线
不会提前泄露关键真相
loop memory 能记录角色相关信息
移动端展示正常
```

如果这个阶段跑通，LT 就真正具备了“从规划到实现”的自开发雏形。

### Phase 4：音效系统 Loop

音效系统适合作为第二个中风险实验。

原因是音效系统相对独立，但又会影响体验。AI 可以先实现结构，不急着处理素材质量。

实验目标：

```text
SoundManager
音效资源映射
音量配置
静音开关
场景触发点
失败/循环/线索解锁音效接口
```

验收标准：

```text
默认可关闭
没有素材时不报错
触发点清晰
不阻塞主流程
移动端兼容
```

这一阶段可以验证 AI 是否能实现“系统骨架 + 体验触发点”的工程闭环。

### Phase 5：Dev Runtime 与 Game Runtime 衔接

最终目标不是让 AI 写更多代码，而是让开发运行时和游戏运行时形成映射关系。

例如：

```text
新增角色规划
  ↓
生成角色 runtime artifact
  ↓
进入游戏 runtime
  ↓
玩家与角色交互
  ↓
产生运行反馈
  ↓
反馈进入 dev runtime
  ↓
形成下一轮优化任务
```

这一步会让 LT 从“AI 辅助开发的游戏”变成“开发过程和运行过程互相反馈的 AI Native 项目”。

---

## 七、LT 自开发实验的真正目标

“LT 自己开发 LT”不能理解为完全自动编程。更合理的定义是：

> 人类设定方向、约束和验收标准；AI 在受控 Loop 中执行、验证、记录和提出下一步；项目自身保存开发记忆，并逐步把自然语言规划转化为可运行系统。

在这个定义下，LT 的价值不只是游戏本身，而是一个 AI 协作方法论实验室。

这个实验至少有三层价值。

第一，它可以提升 LT 的开发效率。角色、线索、UI、文档、测试等重复工作可以逐步标准化。

第二，它可以形成一套面向 AI Coding 的工程资产。包括任务模板、角色 schema、审查 agent、验证报告、状态文件和开发循环。

第三，它可以反过来启发 LT 的游戏设计。游戏里的时间循环、记忆继承、状态变化和行动建议，与开发侧的 Loop Engineering 是同构的。开发 LT 的过程，本身就可以成为理解 LT 的方式。

因此，LT 的长期方向可以概括为两条线：

```text
Game Runtime：
玩家在循环中探索故事、积累线索、改变命运。

Dev Runtime：
AI 在循环中理解规划、修改项目、验证结果、沉淀记忆。
```

当这两条线逐渐合流，LT 就不再只是一个互动叙事游戏，而是一个 AI Native 创作系统的雏形。

---

## 八、结论

Loop Engineering 的核心不是更复杂的 Prompt，而是把 AI 协作纳入可持续工程系统。它要求我们设计目标、状态、规则、动作、验证、审查和记忆，而不是依赖一次性对话完成长期项目。

对于 LT 来说，这个思想尤其适合。因为 LT 本身就是一个关于循环、记忆、状态和选择的项目。玩家在游戏中通过循环接近真相，开发者也可以通过 AI 协作循环推进项目演化。

LT 的实验路径应该从轻量开始：先建立 `.ai/loop-state.md` 和规范文件，再做文档同步 Loop，然后做移动端 UI Loop，最后尝试从 TBD 自动生成角色并接入 runtime。

如果这个路径跑通，LT 将具备一种很特别的能力：它不仅是被 AI 开发的项目，而且是一个能够把规划、实现、验证和记忆组织成自我演化循环的项目。

这才是 “LT 自己开发 LT” 的真实含义。

**不是让 AI 取代人类判断，而是让 AI 成为一个持续运行的工程循环系统；不是让项目自动失控地生长，而是让项目在人的方向控制下，以更高频率、更强记忆、更好验证能力持续演化。**
