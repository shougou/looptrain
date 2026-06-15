---
status: draft
type: narrative-design
topic: companion-runtime
created: 2026-06-15
updated: 2026-06-15
owner: shougou
spoilerLevel: core
target: devlog/src/content/design/companion-runtime.md
decision: undecided
---

增加一个重要的NPC 助手角色，角色姓名为：许知微/林素/沈清禾/顾念秋 待定。目前倾向许知微

我觉得这个角色非常值得认真设计。

因为从 LT 长期规划来看，她不仅仅是一个 NPC。

她实际上会成为：

```text
玩家视角管理器
+
记忆系统入口
+
提示系统入口
+
剧情推进器
+
世界观记录者
+
未来循环异常检测器
```

换句话说：

> 她是整个 Narrative Runtime 暴露给玩家的“人格化界面”。

这和普通游戏里的助手完全不同。

---

# LoopTrain 角色设计文档

## 项目名称

```text
LoopTrain
Companion System Design
```

## 模块名称

```text
Companion Runtime

代号：
Project Watson
```

---

# 一、设计目标

## 为什么需要这个角色

当前 LT 玩家交互主要为：

```text
对话
行动
```

随着剧情扩展：

```text
人物增加
线索增加
时间线增加
循环次数增加
```

玩家会逐渐出现：

```text
忘记线索
忘记人物关系
忘记经历
不知道下一步做什么
```

传统方案：

```text
系统菜单
任务列表
帮助文档
```

会破坏沉浸感。

因此：

设计一个剧情内角色：

```text
年轻女记者
```

承担：

```text
记录
整理
推理
提醒
陪伴
```

功能。

---

# 二、角色设定

## 基础信息

```yaml
id: lin_su

name: 林素

age: 22

gender: female

occupation: 记者

organization: 《江城日报》

status: 普通乘客（表面）

first_appearance:
  第七节车厢
```

---

## 外观

```text
22岁

短发

学生气

戴圆框眼镜

随身携带采访本

钢笔

照相机
```

风格：

```text
民国女学生

知识分子气质

聪明

好奇

不强势
```

---

## 性格

```yaml
curious: 90

observant: 95

cautious: 70

bravery: 60

humor: 40

trusting: 50
```

特点：

```text
喜欢记录

喜欢提问

观察细节能力强

推理能力不错

但经常得出错误结论
```

这是故意设计。

因为：

```text
正确推理 -> 玩家
错误推理 -> 林素
```

这样不会变成剧透机器。

---

# 三、剧情定位

第一部：

```text
只是同行记者
```

玩家认为：

```text
普通NPC
```

实际上：

```text
她是玩家最重要的同伴
```

---

# 四、核心功能

## 功能1

记忆助手

玩家：

```text
林素，我们知道什么？
```

返回：

```text
目前可以确定：

1. 列车会发生事故

2. 小宁提前察觉异常

3. 第三节车厢出现黑色背包

至于这些事情是否有关联，
我还无法判断。
```

---

## 功能2

人物档案

玩家：

```text
林素，小宁是谁？
```

返回：

```text
姓名：
小宁

已知信息：

- 情绪紧张
- 关注车门方向
- 提前察觉危险

未知：

- 身份
- 动机
```

---

## 功能3

时间线整理

玩家：

```text
林素，我们之前经历了什么？
```

返回：

```text
Loop 1：

列车爆炸

Loop 2：

发现黑色背包

Loop 3：

与小宁接触

Loop 4：

当前循环
```

---

## 功能4

轻提示

玩家：

```text
下一步怎么办？
```

林素：

```text
我只是猜测。

不过那个黑色背包，
我们似乎还没有认真调查。
```

原则：

```text
只能软提示

不能剧透
```

---

## 功能5

推理讨论

玩家：

```text
谁最可疑？
```

林素：

```text
如果让我选，

我会怀疑赵乘警。

不过这只是直觉。
```

注意：

允许错误。

---

# 五、Runtime定位

她不是：

```text
NPC
```

而是：

```text
Companion Runtime
```

读取：

```text
Knowledge
Belief
Timeline
Archive
Relationship
```

生成：

```text
Advice
Summary
Discussion
```

---

# 六、状态结构

```yaml
companion:

  trust: 50

  memory_level: 0

  anomaly_level: 0

  awareness_level: 0
```

---

## trust

表示：

```text
林素对玩家信任
```

影响：

```text
透露信息
```

---

## memory_level

表示：

```text
保留多少循环记忆
```

---

### 0

```text
正常人
```

每次重置忘记。

---

### 1

偶尔产生既视感

例如：

```text
奇怪……

我总觉得这一幕发生过。
```

---

### 2

记住部分循环

```text
我确定，

我们不是第一次坐这趟车。
```

---

### 3

完全觉醒

```text
寒灯。

你终于想起来了吗？
```

---

# 七、长期剧情价值

这里最有意思。

---

## 第一阶段

助手

---

## 第二阶段

异常

她开始说：

```text
我好像梦见过这些事情。
```

---

## 第三阶段

觉醒

她开始拥有循环记忆。

---

## 第四阶段

揭露

玩家发现：

```text
她一直都在。
```

不是：

```text
第一次见面
```

而是：

```text
每一次循环
```

---

# 八、和寒灯的关系

建议：

不要恋爱线。

至少第一部不要。

因为：

会抢主线。

更好的定位：

```text
福尔摩斯
+
华生
```

或者：

```text
寒灯
+
记录者
```

---

# 九、UI设计

新增：

```text
对话
行动
林素
```

三个入口。

---

点击：

```text
林素
```

打开：

```text
┌─────────────┐
│ 林素的采访本 │
├─────────────┤
│ 已知线索     │
│ 人物档案     │
│ 时间线       │
│ 推理讨论     │
│ 获取提示     │
└─────────────┘
```

---

# 十、和Memory Runtime结合

林素实际上是：

```text
Knowledge Runtime
+
Belief Runtime
+
Timeline Runtime
+
Archive Runtime
```

的人格化表现。

玩家看到的是：

```text
林素
```

开发层面实际上是：

```text
Companion Runtime
```

---

# 十一、未来演进路线

## v0.6

实现：

```text
林素
+
线索整理
+
人物档案
+
时间线回顾
```

---

## v0.7

实现：

```text
推理讨论
```

---

## v0.8

实现：

```text
循环异常
```

---

## v1.0

实现：

```text
林素觉醒
```

并成为主线角色之一。

---

# 最终设计理念

我建议把林素定义为：

> **一名22岁的年轻记者，她最初只是列车上的普通乘客，但随着循环不断发生，她逐渐成为玩家的记录者、观察者、推理伙伴和记忆容器。对于玩家而言，她是旅途中的同行者；对于系统而言，她是整个 Narrative Runtime 的人格化入口；对于故事而言，她最终会成为揭开循环真相的重要钥匙。**

这个设计最大的好处是：

**功能和剧情完全统一。**

以后无论增加：

```text
线索系统
人物档案
时间线
知识图谱
提示系统
循环记忆
```

都可以自然挂在林素这个角色身上，而不会出现一个突兀的“系统菜单”。这会让 LT 的沉浸感强很多。

关于是否保留目前和玩家交互的指令按钮。

> **保留，但重新定义。**

而且我认为这是一个非常重要的设计决策。

如果你现在问我：

```text
对话
+
指令
+
林素（助手）
```

还是

```text
对话
+
林素
```

我会选择：

```text
对话
+
行动
+
林素
```

也就是说：

**保留指令的本质，但不要叫指令。**

---

# 为什么我不建议彻底取消指令

因为 LT 本质上还是一个游戏。

而游戏的核心是：

```text
玩家主动行动
```

例如：

```text
检查车厢
翻找背包
观察窗外
前往第三节车厢
跟踪某个人
```

这些属于：

```text
Action
```

而不是：

```text
Dialogue
```

---

如果全部变成：

```text
林素，我想检查座位。
```

然后：

```text
林素：
好的，我帮你检查。
```

实际上：

玩家失去了行动感。

变成：

```text
玩家
↓
秘书
↓
世界
```

而不是：

```text
玩家
↓
世界
```

这是两种体验。

---

# 我甚至觉得 LT 后期应该越来越强调 Action

因为：

大部分 AI 互动小说的问题是：

```text
只有聊天
```

最后：

```text
问
答
问
答
问
答
```

剧情推进。

但是：

没有探索感。

---

例如：

### 对话

```text
小宁，你为什么紧张？
```

这是：

Dialogue。

---

### 行动

```text
检查小宁刚才注视的方向
```

这是：

Action。

---

### 林素

```text
你怎么看？
```

这是：

Companion。

---

三者完全不同。

---

# 我建议最终界面变成

## TAB1 对话

```text
和当前NPC交流
```

例如：

```text
小宁

赵乘警

售票员
```

---

## TAB2 行动

这里原来的"指令"升级。

例如：

```text
前往第三节车厢

检查座位

观察窗外

查看行李架
```

输入：

```text
我要检查第三排座位下方
```

Runtime：

解析。

---

实际上：

这就是：

```text
Action Runtime
```

---

## TAB3 林素

这里不操作世界。

只操作记忆。

例如：

```text
整理线索

查看人物

查看时间线

讨论推理

请求提示
```

---

# 我甚至建议做进一步约束

林素：

不能直接执行行动。

例如：

玩家：

```text
林素，帮我去第三节车厢看看。
```

林素：

```text
不。

你自己去。
```

（笑）

或者：

```text
如果你真想知道，
我们一起过去看看。
```

然后：

真正触发：

```text
Action:
前往第三节车厢
```

这样：

世界状态始终由玩家推动。

---

# 从 Runtime 看

其实未来会变成三个系统

```text
Dialogue Runtime

Action Runtime

Companion Runtime
```

---

## Dialogue Runtime

负责：

```text
NPC
```

输入：

```text
玩家说什么
```

输出：

```text
NPC回答
```

---

## Action Runtime

负责：

```text
玩家做什么
```

输入：

```text
行动
```

输出：

```text
世界变化
```

例如：

```text
发现线索

时间推进

触发事件
```

---

## Companion Runtime

负责：

```text
玩家知道什么
```

输入：

```text
问题
```

输出：

```text
总结

推理

提示
```

---

# 未来甚至可以这样

玩家：

```text
林素，你觉得怎么办？
```

林素：

```text
我建议调查第三节车厢。
```

玩家：

```text
前往第三节车厢。
```

Runtime：

执行。

这就像：

```text
福尔摩斯
+
华生
```

讨论。

但是：

最终决定永远由玩家做。

---

# 我觉得最合理的最终形态

应该是：

```text
┌────────────────┐
│ 当前场景       │
├────────────────┤
│ 对话           │
│ 行动           │
│ 林素           │
└────────────────┘
```

其中：

### 对话

```text
人与人
```

### 行动

```text
人与世界
```

### 林素

```text
人与记忆
```

我特别喜欢这个划分。

因为它恰好对应我们前面设计的 Runtime：

```text
Dialogue Runtime
Action Runtime
Memory Runtime
```

而林素其实就是：

> **Memory Runtime 的人格化体现。**

所以我的建议不是：

> 保留指令。

而是：

> **保留其本质，并把它升级为“行动（Action）”。**

这样 LT 就从一个 AI 聊天游戏，开始变成一个真正的互动叙事游戏了。

关于助手记忆，prompt设计讨论
是的，这个助手必须非常小心设计。因为她不是普通 NPC，而是一个**高风险角色**：

> 她既是剧情角色，又是提示系统，又是记忆入口，又可能成为玩家长期依赖的推理对象。

如果设计不好，会出现四类问题：

```text
1. 剧透：她说出了玩家还不该知道的信息
2. 越权：她替玩家做决定，削弱玩家行动感
3. 失控：她根据模型自由发挥，改写世界设定
4. 变味：她从“同行记者”变成“系统客服”
```

所以我建议：**林素必须由 Runtime 控制，而不是由 Prompt 自由发挥。**

---

# 一、林素不能直接读取“全量真相”

这是第一条铁律。

错误做法：

```text
Prompt 里塞入完整世界观、完整真相、完整叛徒身份、寒灯任务、扣子身份。
```

然后要求模型：

```text
不要剧透。
```

这不可靠。

正确做法是：

> **林素只能读取玩家当前已知信息。**

也就是说，Prompt 不应该给她完整真相，而只给她：

```text
玩家已经发现的线索
玩家已经经历的循环
玩家已经见过的人物
玩家当前相信的判断
当前场景可见信息
当前章节允许透露的信息
```

她不知道的东西，就不应该出现在她的上下文里。

---

# 二、要把“真实世界状态”和“玩家认知状态”分开

这是 LT 状态管理的核心。

比如真实设定里：

```text
小宁可能知道某个秘密
赵乘警可能不是敌人
扣子可能已经上车
寒灯身份可能早已暴露
```

但玩家当前并不知道。

那么林素的 Prompt 里不能出现这些真实设定。

应该分成两套状态：

```text
World Truth：系统真相，只有 Runtime 知道
Player Knowledge：玩家已知，林素可以知道
Player Belief：玩家当前推测，林素可以讨论
```

林素只能访问：

```text
Player Knowledge
Player Belief
Timeline Summary
Visible Scene
Unlocked Clues
Known NPC Profiles
```

不能访问：

```text
Full Plot Truth
Future Events
Locked Clues
Hidden NPC Identity
Author Notes
Final Answer
```

---

# 三、林素的能力边界要写死

我建议给她设定一个固定协议。

## 她可以做什么

```text
1. 整理玩家已知线索
2. 回顾已经发生的循环
3. 总结人物可疑点
4. 提出软提示
5. 提出假设
6. 记录玩家推理
7. 反问玩家
8. 指出明显遗漏
```

## 她不能做什么

```text
1. 不能直接告诉玩家真相
2. 不能替玩家执行行动
3. 不能生成未解锁线索
4. 不能改变 NPC 状态
5. 不能改变世界状态
6. 不能确认隐藏身份
7. 不能用“我知道剧情”式语气说话
8. 不能给出唯一正确答案
```

这要写进系统 Prompt，也要由 Runtime 校验。

---

# 四、提示系统要分级

林素最危险的功能是“提示”。

不能让玩家问一句：

```text
我下一步该怎么办？
```

她直接回答：

```text
去第三节车厢检查黑色背包，那里有炸弹线索。
```

这就毁了探索感。

建议设计 `hint_level`：

```text
level 0：不提示，只整理现状
level 1：轻微提醒
level 2：指出可疑方向
level 3：给出明确行动建议
level 4：Debug / 开发者模式，直接给答案
```

正式玩家默认只能用 1 或 2。

例如：

### Level 1

```text
我觉得小宁刚才的反应有点不自然。
```

### Level 2

```text
她一直看向车厢连接处，也许那里有什么东西。
```

### Level 3

```text
建议你去第七节车厢连接处检查一下。
```

Level 3 可以作为“卡关多次后”的兜底，而不是随时开放。

---

# 五、林素的输出必须结构化

不要只让模型返回自然语言。

应该要求返回 JSON，然后前端展示其中的 `reply`。

例如：

```json
{
  "reply": "我不确定，但小宁刚才一直看向车厢连接处，这一点值得记下来。",
  "mode": "reasoning",
  "usedKnowledge": ["clue_xiaoning_looked_at_connector"],
  "newBeliefSuggestions": [
    {
      "target": "xiaoning",
      "belief": "hiding_something",
      "confidenceDelta": 0.1
    }
  ],
  "suggestedActions": [
    {
      "actionId": "inspect_carriage_connector",
      "label": "检查车厢连接处",
      "confidence": 0.4
    }
  ],
  "spoilerRisk": "low"
}
```

然后 Runtime 检查：

```text
usedKnowledge 是否都已解锁
suggestedActions 是否当前可执行
reply 是否包含禁用词或未解锁信息
spoilerRisk 是否超标
```

不通过就降级为安全回答。

---

# 六、Prompt 不应该是“一个大 Prompt”

建议拆成 5 层。

## 1. Character Prompt：林素是谁

```text
你是林素，22岁，《江城日报》年轻记者。
你聪明、敏锐、谨慎，擅长观察和记录。
你不是系统助手，也不是全知旁白。
你只能基于你和玩家已经经历、看到、听到的信息进行判断。
```

## 2. Capability Prompt：她能做什么

```text
你可以整理线索、回顾时间线、分析人物、提出假设、给出轻提示。
你不能替玩家行动，不能改变世界状态，不能透露未解锁真相。
```

## 3. Context Prompt：当前允许知道什么

这部分由 Runtime 动态生成：

```text
当前循环：Loop 3
当前场景：第七节车厢
玩家已知线索：
- 小宁紧张
- 车厢连接处有异常声响
- 第一轮列车发生爆炸

玩家不知道：
- 寒灯真实身份
- 扣子身份
- 爆炸原因
- 叛徒身份
```

注意：`玩家不知道` 这里只能给抽象标签，不给具体答案。

不要写：

```text
玩家不知道赵乘警其实是友方。
```

应该写：

```text
玩家不知道赵乘警的真实立场。
```

## 4. Task Prompt：这次玩家问什么

```text
玩家问：我们下一步该怎么办？
```

## 5. Output Contract：必须怎么输出

```text
只能输出 JSON。
不能输出 Markdown。
不能使用未解锁线索。
不能断言隐藏真相。
```

---

# 七、林素应该允许“推理错误”

这个很重要。

如果林素永远正确，她就会变成攻略系统。

她应该像华生一样：

```text
观察细节很强
记录能力很强
推理有时正确
推理有时偏差
```

这反而更真实。

设计上可以给她一个字段：

```json
{
  "reasoningReliability": 0.65
}
```

她的推理可以有概率偏向：

```text
过度怀疑某人
忽略某个细节
被情绪影响
相信表面证词
```

这样玩家仍然是最终判断者。

---

# 八、她不能替玩家行动

这是第二条铁律。

玩家问：

```text
林素，你去看看第三节车厢。
```

她不能返回：

```text
我去看了，发现一个黑包。
```

她应该说：

```text
我一个人过去太显眼了。如果你真觉得那里有问题，我们最好一起去。
```

然后 Runtime 给出行动建议：

```text
建议行动：前往第三节车厢
```

但必须由玩家点击或输入执行。

这样保持：

```text
玩家 → 行动 → 世界变化
```

而不是：

```text
玩家 → 林素 → 世界变化
```

---

# 九、林素和循环记忆要逐步解锁

一开始不要让她知道循环。

第一阶段：

```text
她只是普通记者。
```

第二阶段：

```text
她开始有既视感。
```

第三阶段：

```text
她意识到循环异常。
```

第四阶段：

```text
她成为记忆容器。
```

这可以用 `awareness_level` 控制：

```yaml
lin_su:
  awareness_level: 0
  memory_retention: 0
```

### awareness_level = 0

```text
正常记者，不知道循环。
```

### awareness_level = 1

```text
偶尔觉得熟悉。
```

### awareness_level = 2

```text
开始相信循环存在。
```

### awareness_level = 3

```text
能记住部分上一轮信息。
```

### awareness_level = 4

```text
完全觉醒，成为关键剧情角色。
```

她能访问多少 Timeline，也由这个字段控制。

---

# 十、建议加入“林素上下文构造器”

不要在业务代码里手写 Prompt。

做一个独立模块：

```text
CompanionContextBuilder
```

输入：

```text
saveId
currentLoop
currentScene
playerKnowledge
playerBelief
unlockedClues
npcPublicProfiles
timelineSummary
linSuState
playerQuestion
```

输出：

```text
CompanionPromptContext
```

再由：

```text
CompanionPromptBuilder
```

生成模型请求。

结构如下：

```text
Player Question
        ↓
CompanionContextBuilder
        ↓
CompanionPromptBuilder
        ↓
LLM
        ↓
CompanionOutputValidator
        ↓
Runtime Apply / Display
```

这里最重要的是：

```text
CompanionOutputValidator
```

没有 Validator，Prompt 规则不可靠。

---

# 十一、建议加“剧透防火墙”

可以做一个简单的 Spoiler Guard。

配置一个锁定信息表：

```yaml
locked_facts:
  - id: truth_han_deng_identity
    label: 寒灯真实身份
    unlock_condition: chapter1_finale
    forbidden_terms:
      - 寒灯
      - 代号
      - 绝密任务

  - id: truth_kou_zi
    label: 扣子身份
    unlock_condition: chapter1_finale
    forbidden_terms:
      - 扣子
      - 接头人
```

在林素输出后检查：

```text
如果当前未解锁，但 reply 中出现 forbidden_terms，拒绝输出。
```

这不是完美方案，但能挡住很多低级剧透。

更好的做法是：Prompt 中根本不给具体真相。

---

# 十二、建议给林素设置“回答模式”

玩家问不同问题，走不同 Prompt。

```text
summary_mode：整理已知信息
timeline_mode：回顾循环经历
profile_mode：查看人物档案
hint_mode：请求提示
reasoning_mode：推理讨论
emotion_mode：普通陪伴对话
```

不同模式允许不同信息范围。

例如：

## summary_mode

只读：

```text
Knowledge
Clues
Timeline Summary
```

## hint_mode

只读：

```text
Current Objective
Unresolved Clues
Available Actions
```

## reasoning_mode

只读：

```text
Knowledge
Belief
NPC Public State
```

不能读：

```text
World Truth
Locked Facts
```

---

# 十三、建议前期先不要全开放自由聊天

v0.6 可以先做半结构化入口：

```text
林素
├── 我们知道什么？
├── 帮我整理人物
├── 回顾上一轮
├── 你觉得哪里可疑？
├── 给我一点提示
└── 自由提问
```

先把前五个做好，自由提问放后面。

因为自由提问最容易失控。

---

# 十四、最小落地版本建议

v0.6 不要一次做全。

先做：

```text
1. 林素角色入口
2. 已知线索总结
3. 时间线回顾
4. 人物档案总结
5. 轻提示
6. 不允许执行行动
7. 不允许访问未解锁真相
8. 输出结构化 JSON
```

暂缓：

```text
1. 完整自由聊天
2. 完整觉醒剧情
3. 长期人格记忆
4. 高级推理
5. 多轮复杂陪伴
```

---

# 十五、推荐的系统规则

可以先定成这样：

```text
林素规则：

1. 你是列车上的年轻女记者林素，不是系统助手。
2. 你只能根据玩家已知信息、当前场景、已发现线索和已经历时间线进行判断。
3. 你不能透露未解锁剧情、隐藏身份、未来事件和系统真相。
4. 你不能替玩家行动，只能建议玩家可以考虑什么。
5. 你可以推理，但必须承认不确定。
6. 你可以犯错，不能表现为全知。
7. 你不能改变世界状态，不能生成新线索，只能引用已解锁线索。
8. 当信息不足时，你应该说“我还不能确定”。
9. 当玩家请求明确答案时，你只能给软提示。
10. 所有建议必须基于输入上下文中的已知信息。
```

这十条应写入 `Companion Runtime` 的铁律。

---

# 十六、最终判断

你说得对：**林素这个功能要非常谨慎。**

她一旦设计好，会让 LT 的体验跃升一层：

```text
对话 = 人物互动
行动 = 世界探索
林素 = 记忆与推理
```

但如果设计不好，她会直接毁掉游戏：

```text
变成系统客服
变成剧透机器
变成攻略机器人
变成替玩家行动的代理人
```

所以我的建议是：

> **林素不是一个“会聊天的助手”，而是一个被 Runtime 严格约束的“叙事接口”。**

她的 Prompt 只是表现层。
真正决定她知道什么、能说什么、不能说什么的，必须是 LT Runtime。
