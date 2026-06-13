---
title: "LoopTrain 长期规划：游戏只是实验对象"
date: "2026-06-13T23:30:00+08:00"
version: "long-term"
status: "planning"
tags:
  - ai-notes
  - 工程笔记
  - 项目规划
  - AI Native
  - Agent Runtime
  - 设计思考
pinned: true
summary: "LoopTrain 的长期方向不是单纯做完一个互动叙事游戏，而是把游戏作为实验对象，探索 AI Native Software Engineering：故事演进、事件溯源、Agent Runtime、Prompt Builder、知识图谱、自动测试和可回放协作协议。"
---

## 先重新定义 LoopTrain

我稍微重新想了一下 LoopTrain 的长期规划。

如果只把它定义成一个游戏项目，这个项目会很容易被误解。别人会问：什么时候做完？多少章节？有没有商业化？什么时候上架？这些问题当然可以问，但它们不是这个项目最核心的问题。

从今天开始，我更愿意把 LT 定义成：

> **一个 AI Native Software Engineering Lab。**

游戏只是实验对象。

真正的 LoopTrain 有两个维度：

```text
纵轴：游戏本身（Story Evolution）
横轴：AI 协作实验（AI Engineering Evolution）
```

这两个维度交叉在一起，才是真正的 LoopTrain。

一边是互动叙事游戏：列车、循环、情报、人物、线索、失败和记忆。

另一边是软件工程实验：Runtime、Event Sourcing、Agent Pool、Prompt Builder、知识图谱、自动测试、Replay、Protocol。

如果只看前者，LoopTrain 是一个故事。

如果只看后者，LoopTrain 是一套工程实验。

但我真正想做的，是用一个复杂、自由、长期演化的互动叙事项目，观察人与 AI 如何共同设计、构建、维护和演化复杂软件。

---

## 一、故事线：系列案件 + 世界观递进

第一部不应该急着解释完整世界观。

第一部只需要完成一件事：

> **让玩家接受 LoopTrain 世界观。**

就像《命运石之门》的第一章、《Outer Wilds》的第一次循环、《十三机兵》的开场，它们一开始都没有解释全部真相。它们先让玩家进入一个规则不完整、信息不充分、但足够有吸引力的世界。

LoopTrain 的第一部也应该这样。

### 第一部：《第七节车厢》

主题：

> **活下去。**

玩家的目标不是一开始就破解所有阴谋，而是：

```text
发现危险
→ 理解循环
→ 活过第一次
→ 找到真正身份
```

第一部的最终 Reveal 可以很简单，但必须有效：

```text
我是地下工作者？
代号：寒灯
接头人：扣子
绝密任务尚未完成
```

最后，列车爆炸。

循环再次开始。

玩家知道：

> 原来这不是结束，而是真正的开始。

这就是第一幕应该完成的事情。

### 第二部：《失踪的情报》

第二部可以把格局稍微打开。

背景是：

```text
组织内部出现叛徒。
```

情报同时流向：

```text
中统
军统
日本方面
```

玩家逐渐发现，每一方都认为自己是正义的，而每一方都在利用玩家。

这时候主题从“活下去”变成：

> **你还能相信谁？**

第二部不只是扩大地图或增加 NPC，而是改变玩家对世界的判断方式。第一部是在列车上求生，第二部是在不同组织的叙事中判断谁在说谎。

### 第三部：历史真相与个人选择

第三部可以继续把循环机制推进一步。

玩家可能终于知道：

```text
寒灯并不是一个人。
它是一个代号。
```

也许已经有：

```text
寒灯一号
寒灯二号
寒灯三号
```

而玩家只是其中之一。

甚至，真正死去的人不是你，而是别人。

这时，循环开始出现裂缝。

玩家不再只是想逃出循环，而是必须面对：

```text
历史真相
个人选择
身份继承
牺牲代价
```

### LoopTrain Universe

后续可以继续扩展成一个更大的 LoopTrain Universe。

时间可以推进：

```text
1939
↓
1941
↓
1943
↓
1945
```

不同列车、不同任务、不同人物，共同组成一个更大的世界。

甚至以后不一定只有列车。

飞机、轮船、集中营、边境、地下交通站，都可以成为 Loop。

只要核心仍然是：

```text
有限时间
封闭空间
信息不完整
循环重启
记忆继承
```

LoopTrain 的世界观就可以继续扩展。

---

## 二、LT 更大的价值不在故事

故事很重要，但它不是我最期待的地方。

我最期待的是：

> **LT 成为 AI Native Development 的实验平台。**

也就是说，LoopTrain 不只是一个由 AI 辅助开发出来的游戏，而是一个用来实验 AI 如何参与长期软件工程的项目。

我把这个过程分成几个阶段。

### 第一阶段：AI 作为 Copilot

这是现在最常见的阶段。

AI 的角色是：

```text
写代码
补函数
改样式
生成测试
解释错误
```

人负责设计、判断和确认。

这阶段的 AI 更像一个效率工具。

它很有用，但还不是项目成员。

### 第二阶段：AI 作为 Architect Assistant

下一步，AI 不只是写代码，而是参与方案设计。

比如我们讨论一个“状态保持”问题，AI 不应该直接开始改代码，而是先生成：

```text
RFC
ADR
Schema
Migration
Test Plan
风险清单
验收标准
```

人负责 Review。

这时 AI 已经从“执行者”变成了“架构协作者”。

### 第三阶段：AI 管理 Context

更进一步，AI 不应该只靠当前聊天上下文工作。

它应该能管理项目上下文：

```text
Character
Timeline
Prompt
NPC
State
Clue
Rule
```

这些内容不应该靠人手动复制粘贴，也不应该永远塞进 prompt。

AI 应该能从结构化项目资料中获取上下文，并知道哪些信息可以进入当前任务，哪些信息不应该进入。

### 第四阶段：AI 提出 Refactor

再下一步，AI 应该能主动发现结构问题，但不能越权执行。

例如它发现：

```text
StateManager 过大。
```

它可以提出：

```text
拆分为：
LoopManager
SaveManager
EventLogger
```

但必须等待确认。

这点非常重要。

AI 可以建议，可以分析，可以生成方案，但不能脑补“用户已经同意”。

### 第五阶段：AI 变成 Project Member

最终，我希望 AI 能成为项目成员，而不是一次性工具。

每天它可以生成 Morning Report：

```text
昨天改了什么
当前风险是什么
哪些测试在失败
哪些文档已经过期
哪些模块开始变大
下一步建议是什么
```

然后提出 RFC，生成 PR，等待 Review。

这个过程里，AI 有职责，但没有最终权力。

最终权力仍然在人这里。

---

## 三、Agent Runtime：不是聊天，而是协作协议

我觉得 LT 特别适合探索 Agent Runtime。

未来的工作方式可能不是：

```text
我和一个 AI 聊天。
```

而是：

```text
Developer
↓
Project Runtime
↓
Agent Pool
```

Agent Pool 里可以有不同角色：

```text
Architect
Writer
Programmer
Tester
Reviewer
Prompt Engineer
Timeline Manager
Music Agent
UI Agent
```

它们不是在同一个聊天窗口里互相说话。

它们通过 Event 协作。

例如：

```text
Writer：新增剧情
↓
Timeline Agent：检查时间线
↓
Character Agent：检查人物一致性
↓
Prompt Agent：更新 Prompt Builder 输入
↓
Test Agent：生成测试
↓
Reviewer：Review
↓
Human：Approve
```

这个过程的关键不是“AI 很聪明”。

关键是：

```text
流程固定
职责明确
事件可追踪
人类确认不可跳过
```

这才是我真正想探索的方向。

---

## 四、LT 自己开发 LT

我甚至期待一个更有趣的阶段：

> **LT 自己开发 LT。**

这听起来像一句玩笑，但它其实很具体。

例如今天修改了一个 NPC：

```text
修改 NPC
↓
更新 Character.md
↓
更新 Timeline
↓
更新 Prompt Builder 输入
↓
更新 Roadmap
↓
生成 Devlog
```

这些事情现在都需要人记住。

但未来，它们应该由项目 Runtime 触发，由 Agent 完成，由人 Review。

人不应该花大量时间维护散落的上下文。

人应该做更重要的事情：

```text
判断方向
确认边界
决定取舍
批准执行
```

---

## 五、长期最大的实验：AI 如何维护活着的软件

AI 写代码和 AI 维护软件，是两回事。

写代码是一次性能力。

维护软件是长期能力。

LoopTrain 最适合实验后者。

例如，今天增加一个 NPC，AI 不应该只修改一段对话。它应该知道这件事会影响：

```text
Prompt
Timeline
Clue
Tests
Docs
Localization
Devlog
Roadmap
```

最后由 Human Approve。

这才是真正的 AI Native。

AI Native 不是“代码由 AI 写”。

AI Native 是：

> 项目的结构、状态、协议、测试、文档和演进过程，都天然为人机协作而设计。

---

## 六、状态管理继续深化：从 State 到 World State

LT Runtime 不应该只是一个简单的 State 对象。

它应该逐渐演化成 World State。

例如：

```text
Player
NPC
Scene
Timeline
Weather
Trust
Loop
Clue
Event
```

这些状态不应该只是当前快照。

更好的方式是：

```text
Event Sourcing
```

也就是说，不是只保存 Current State，而是保存 Event Log。

例如：

```text
Game Start
→ Enter Carriage
→ Talk XiaoNing
→ Gain Clue
→ Loop Failed
→ Restart
```

Current State 只是 Event Log replay 出来的结果。

这样就天然支持：

```text
Replay
Debug
Branch
Undo
History
Migration
AI Analysis
```

我觉得 LT 应该尽早朝这个方向走。

因为时间循环游戏本身就非常适合 Event Sourcing。

游戏里有循环。

开发过程也有循环。

两者都需要可回放。

---

## 七、Prompt 最终应该消失

这是我最近越来越强烈的判断。

未来项目里不应该到处都是：

```text
prompt.txt
```

而应该是：

```text
State
+
Character
+
Timeline
+
Rules
↓
Prompt Builder
↓
LLM
```

Prompt 不应该长期由人手写。

人应该维护结构化数据。

Prompt 应该动态生成。

例如：

```text
Character.yaml
Scene.yaml
Timeline.yaml
Rules.yaml
↓
Prompt Builder
↓
Prompt
```

这样做的好处是，Prompt 不再是一段不可维护的长文本，而是项目状态的编译结果。

Writer 维护剧情。

Timeline Agent 检查时间线。

Prompt Builder 生成当前所需的上下文。

LLM 只负责表现。

Runtime 负责逻辑。

---

## 八、Story DSL、Knowledge Graph 和 Story Compiler

如果 LT 继续扩展，Markdown 迟早不够用。

故事应该逐渐变成结构化 DSL。

例如：

```yaml
scene:
  id: carriage_3
  npc:
    - xiaoning
  events:
    - talk
    - search
    - timer
  clues:
    - black_bag
```

Runtime 解释 DSL。

AI 基于 DSL 生成表现。

测试基于 DSL 判断剧情是否可达。

这会引出第二个系统：Knowledge Graph。

人物、关系、事件、线索、组织、时间，应该组成 Graph。

例如：

```text
寒灯
→ 认识
→ 扣子
→ 属于
→ 地下组织
→ 被叛徒出卖
```

AI 查询 Graph，而不是翻聊天记录。

第三个系统是 Story Compiler。

作者写：

```text
Scene A
→ Scene B
→ Scene C
```

Compiler 检查：

```text
时间冲突
人物冲突
线索冲突
Loop 冲突
Flag 冲突
```

甚至 AI 可以自动指出：

```text
这里逻辑错误。
```

我觉得 LLM 非常适合做这种 Compiler。

不是替作者写全部内容，而是帮助作者维护复杂系统的一致性。

---

## 九、AI 自动测试和 AI Reviewer

传统测试当然还需要。

但 LT 这种项目还需要另一种测试：

```text
AI 扮演玩家，自动跑剧情。
```

例如：

```text
Agent 玩家
→ 随机探索
→ 跑 1000 次
→ 统计卡关、死循环、Bug、不可达剧情、无解分支
```

这比普通单元测试更接近真实玩家行为。

另一个方向是 AI Reviewer。

新增 NPC 后，AI 可以自动检查：

```text
是否符合世界观？
是否符合人物性格？
是否和已有剧情冲突？
是否泄露伏笔？
是否破坏时间线？
```

这件事价值很高。

因为互动叙事项目最难维护的不是代码，而是一致性。

---

## 十、Devlog 自动生成

Devlog 不应该只是我手写的记录。

长期看，它应该 80% 自动生成。

例如：

```text
Git Commit
↓
AI 读取 Diff
↓
生成 Devlog 草稿
↓
记录：完成了什么、为什么这样做、踩了什么坑、下一步是什么
↓
Human Review
```

这件事和项目本身高度一致。

如果 LoopTrain 是一个 AI Native Software Engineering Lab，那么 Devlog 就不只是展示窗口。

它应该是实验记录的一部分。

每一次设计、修改、失败、修复和回滚，都应该能留下可读的轨迹。

---

## 十一、Replay System

Replay 是 LT 最大特色之一。

它不只属于游戏。

它也属于开发过程。

游戏需要 Replay：

```text
玩家为什么失败？
哪条线索没拿到？
哪一步导致循环重启？
```

开发也需要 Replay：

```text
AI 为什么修改 Prompt？
为什么改了状态结构？
为什么选择这个部署方案？
哪一次确认允许了这次修改？
```

未来的 AI Engineering 必须可回放。

否则一切都只是聊天记录。

我希望 LT 能做到：

```text
Decision
→ Reasoning
→ Tool
→ Patch
→ Verification
→ Human Approval
```

全部可回放。

---

## 十二、Protocol 比 Agent 更重要

最后，我最希望 LT 探索的方向，不是 Agent，不是 Prompt，不是 MCP，不是 RAG。

而是：

> **Protocol。**

Agent 能力会越来越强。

但如果没有协议，强能力只会带来更大的风险。

协议应该固定：

```text
Human：Design
↓
Agent：RFC
↓
Architect：Review
↓
Tester：Generate Test
↓
Reviewer：Approve
↓
Human：Commit
```

Agent 不能跳。

Agent 不能脑补。

Agent 不能说：

```text
我觉得用户同意了。
```

它必须等待 Runtime 里的真实事件。

这是我从最近开发中得到的最重要的教训之一。

---

## 十三、未来三年的探索路线

### 2026：Standalone Runtime

主题：

```text
Standalone Runtime
```

目标：

```text
让 LT 脱离 ST，成为真正独立运行时。
```

重点：

```text
State
Event
Save
Replay
Prompt Builder
```

这是目前已经开始做的方向。我觉得方向完全正确。

### 2027：AI Native Runtime

主题：

```text
AI Native Runtime
```

也就是说，游戏运行时不是人写死，而是由结构化状态驱动。

流程应该是：

```text
Human
↓
State
↓
Runtime
↓
LLM
```

LLM 不再直接聊天。

它由 Runtime 驱动。

AI 不负责逻辑。

AI 负责表现。

逻辑永远由 Runtime 控制。

### 2028：Agent Runtime

主题：

```text
Agent Runtime
```

这时项目不再是“人写需求，AI 写代码”。

而是：

```text
Project Runtime
→ Agent Pool
→ Event Protocol
→ Human Approval
```

Agent 可以参与写作、编程、测试、审查、翻译、音乐、UI、Prompt、时间线管理。

但它们都必须在协议内工作。

---

## 最后

我想给 LoopTrain 写一句最符合它长期定位的话：

> **LoopTrain 不是一个以完成为目标的游戏，而是一个持续演进的 AI 协作实验。它借助互动叙事这一最复杂、最自由的软件形态，探索人与 AI 如何共同设计、构建、维护和演化复杂系统。游戏只是表象，真正的作品，是整个协作过程本身。**

几年以后，当我回头看 LoopTrain，真正有价值的未必只是“寒灯”和“扣子”的故事。

更有价值的，可能是 Devlog 里完整记录了一个开发者如何与 AI 一起，从零开始探索 AI Native Software Engineering 的全过程。

这很可能会成为这个项目最独特、也最难复制的价值。
