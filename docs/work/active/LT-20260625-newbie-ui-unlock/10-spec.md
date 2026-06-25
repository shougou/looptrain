# Spec: 新手阶段渐进解锁 UI 优化

**版本**: v0.11.1-newbie-ui-unlock
**关联 Idea**: `00-idea.md`
**作者**: Sisyphus (AI Agent)
**日期**: 2026-06-25

---

## 1. 功能规格

### 1.1 UIStage 状态机

前端引入 `UIStage` 枚举，根据游戏进度控制控件可见性：

```ts
type UIStage =
  | 'intro'           // 开场覆盖层
  | 'first_observation' // 第一次观察后
  | 'first_dialogue'    // 第一次对话后
  | 'loop_memory_intro' // 第二轮引入循环记忆
  | 'caseboard_intro'   // 开放案件板
  | 'contradiction_intro' // 发现矛盾后
  | 'normal_play';      // 正常完整玩法
```

阶段判定规则：
- `intro`: state.loop === 1 && state.history.length === 0
- `first_observation`: state.loop === 1 && 至少完成 1 次观察行动
- `first_dialogue`: state.loop === 1 && 至少完成 1 次 NPC 对话
- `loop_memory_intro`: state.loop === 2 && state.history.length === 0
- `caseboard_intro`: state.loop >= 2 && 至少获得 3 条线索
- `contradiction_intro`: 检测到至少 1 个 NPC 时间线矛盾
- `normal_play`: state.loop >= 3 || 已完成 caseboard_intro

### 1.2 主界面四区重排

**区域 1: 状态区 (StatusBar)**
- 始终可见
- 内容根据阶段变化：
  - 第一轮: `第 1 次循环 · 14:00 / 剩余时间：15 分钟`
  - 第二轮后: `第 2 次循环 · 14:03 / 行动力：7`
  - AP ≤ 3 时显示红色警告

**区域 2: 当前现场区 (CurrentSceneCard)**
- 始终可见
- 内容固定为三段式：
  ```
  [位置名称]
  
  [当前异常描述，聚焦可交互 NPC/物体]
  [当前目标一句话]
  ```
- 不展示完整 NPC 状态列表

**区域 3: 许知微提示区 (AssistantHintCard)**
- 始终可见（但内容根据阶段变化）
- 取代顶部"💡 许知微"按钮
- 位置：场景描述下方，行动按钮上方
- 样式：浅色卡片，左侧带许知微头像缩略图

**区域 4: 底部行动区 (ActionDock)**
- 可见性和按钮数量根据阶段变化

### 1.3 控件可见性矩阵

| 控件 | intro | first_observation | first_dialogue | loop_memory_intro | caseboard_intro | contradiction_intro | normal_play |
|------|-------|-------------------|----------------|-------------------|-----------------|---------------------|-------------|
| 状态栏 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 场景描述 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 许知微提示 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 行动按钮(1个) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 行动按钮(2个) | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 行动按钮(3个) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 更多行动按钮 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 案件板入口 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 时间线(完整) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 高风险行动 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 对话聚焦 | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| 输入框 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 设置按钮 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 1.4 按钮重命名规则

| 当前文案 | 新文案 | 触发条件 |
|---------|--------|---------|
| 档案 | 已发现的事 | caseboard_intro 后显示 |
| 许知微 | （改为提示卡，无按钮） | 始终 |
| 对话 | 询问小宁 / 询问许知微 | 具体 NPC 名称 |
| 行动 | 观察当前车厢 / 跟住小宁 | 具体行动描述 |
| 发送 | （仅输入框激活后显示） | normal_play |
| 高风险行动 | 强行搜查灰衣乘客行李 | 具体条件满足时 |
| 取消 | 放弃搜查 / 稍后再问 | 具体场景 |
| 继续 | 确认搜查 / 开始询问 | 具体场景 |
| 重置游戏 | 清空全部存档 | 仅设置面板内 |
| 进入游戏 | 开始循环 | 开场页 |

### 1.5 案件板 (CaseBoard) 规格

**打开方式**: 点击"已发现的事"按钮

**默认视图**（案件板）：
```
已发现的事

本轮确认
· [事实 1]
· [事实 2]

NPC 说法
· [NPC 名称]: [说法摘要]

待验证
· [疑问 1]
· [疑问 2]

关键矛盾
· [矛盾描述]（仅在 contradiction_intro 后显示）

下一步建议
· [建议行动]
```

**底部二级导航**:
- [线索] [人物] [时间线] [记忆]
- 点击后切换为对应 Tab 内容

### 1.6 许知微提示卡内容生成规则

提示内容根据当前 `UIStage` 和 `state` 动态生成：

**intro**: 
```
许知微：先别急着问所有人。你刚醒来，先确认车厢里有没有异常。

推荐：[观察当前车厢]
```

**first_observation**:
```
许知微：她不像只是害怕。可以先问她刚才发生了什么。

推荐：[询问小宁] [继续观察]
```

**first_dialogue**:
```
许知微：注意，她说的是"说法"，还不是事实。需要观察验证。

推荐：[结束对话] [继续追问]
```

**loop_memory_intro**:
```
许知微：上一轮小宁说她一直坐着。但这句话需要验证。这次你可以提前盯住她。

推荐：[盯住小宁] [守在三号车厢]
```

**contradiction_intro**:
```
许知微：等一下，这里有矛盾。

小宁说：她一直坐在座位上。
你看到：她从三号车厢方向回来。

[她在隐瞒行动路线]
[还不能确定]
```

---

## 2. 接口规格

### 2.1 新增 API 端点

**GET /api/ui-stage**

返回当前 UIStage 和可见控件列表。

请求:
```json
GET /api/ui-stage?state={...}
```

响应:
```json
{
  "stage": "first_observation",
  "visible_controls": ["status", "scene", "assistant", "two_actions"],
  "action_count": 2,
  "assistant_hint": {
    "speaker": "许知微",
    "text": "她不像只是害怕...",
    "recommended_actions": ["询问小宁", "继续观察"]
  }
}
```

### 2.2 修改现有 API

**POST /api/session/init**

响应中新增 `ui_stage` 字段:
```json
{
  "state": {...},
  "ui_stage": "intro",
  "suggestions": [...],
  "goal": "..."
}
```

**POST /api/action/commit**

响应中新增 `ui_stage_transition` 字段:
```json
{
  "state": {...},
  "ui_stage": "first_observation",
  "result": {...},
  "assistant_hint": {...}
}
```

### 2.3 前端数据结构

```ts
interface UIState {
  stage: UIStage;
  visibleControls: string[];
  actionCount: number;
  assistantHint: {
    speaker: string;
    text: string;
    recommendedActions: string[];
  } | null;
  caseBoard: {
    confirmedFacts: string[];
    npcStatements: Array<{npc: string, text: string}>;
    pendingVerification: string[];
    contradictions: string[];
    nextSuggestions: string[];
  } | null;
}
```

---

## 3. UI 规格

### 3.1 颜色规范

| 用途 | 颜色值 | 说明 |
|------|--------|------|
| 主背景 | `#1a1a1a` | 深灰，保持沉浸感 |
| 卡片背景 | `#252525` | 比主背景稍亮 |
| 许知微提示卡 | `#2a2520` | 暖色调，区分于其他卡片 |
| 主按钮 | `#c9a96e` | 金色，强调行动 |
| 次按钮 | `#3a3a3a` | 灰色，次要操作 |
| 危险按钮 | `#c94040` | 红色，高风险行动 |
| 文字主色 | `#e0e0e0` | 近白 |
| 文字次色 | `#888888` | 灰色，用于描述 |
| 成功 | `#4a9a4a` | 绿色，验证通过 |
| 警告 | `#c9a040` | 黄色，AP 不足 |
| 错误 | `#c94040` | 红色，失败 |

### 3.2 字体规范

| 元素 | 大小 | 字重 | 说明 |
|------|------|------|------|
| 场景标题 | 18px | 600 | 加粗突出 |
| 场景描述 | 14px | 400 | 正文 |
| 许知微提示 | 14px | 400 | 带 2px 左边框金色装饰 |
| 按钮文字 | 14px | 500 | 居中 |
| 状态栏 | 12px | 400 | 顶部小字 |
| 案件板标题 | 16px | 600 | 区域标题 |
| 案件板内容 | 13px | 400 | 列表项 |

### 3.3 间距规范

- 卡片内边距: 16px
- 卡片间间距: 12px
- 按钮高度: 48px（拇指友好）
- 按钮圆角: 8px
- 安全区适配: 底部 `env(safe-area-inset-bottom)` + 8px

### 3.4 动画规范

| 动画 | 时长 | 缓动 |
|------|------|------|
| 按钮点击反馈 | 150ms | ease-out |
| 面板滑入 | 250ms | cubic-bezier(0.4, 0, 0.2, 1) |
| 面板滑出 | 200ms | ease-in |
| 内容切换 | 200ms | ease |
| 加载旋转 | 1s | linear infinite |

---

## 4. 验收标准

### 4.1 功能验收

| 编号 | 验收项 | 验收方法 |
|------|--------|---------|
| A-1 | 首次进入游戏，首屏只显示1个按钮"观察当前车厢" | 人工测试 |
| A-2 | 完成第一次观察后，出现2个按钮（询问+继续观察） | 人工测试 |
| A-3 | 完成第一次对话后，出现对话聚焦模式 | 人工测试 |
| A-4 | 第二轮开始后，许知微提示中出现"上一轮记忆" | 人工测试 |
| A-5 | 案件板入口在第三轮后显示 | 人工测试 |
| A-6 | 发现矛盾后，许知微提示中出现判定选项 | 人工测试 |
| A-7 | 高风险行动只在具体条件满足时显示 | 人工测试 |
| A-8 | 输入框默认隐藏，仅自定义问题时显示 | 人工测试 |
| A-9 | 设置面板始终可通过齿轮图标访问 | 人工测试 |
| A-10 | 行动按钮点击后有加载状态反馈 | 人工测试 |

### 4.2 性能验收

| 编号 | 验收项 | 标准 |
|------|--------|------|
| P-1 | 首屏加载时间 | < 2s（4G 网络） |
| P-2 | 按钮点击响应 | < 100ms |
| P-3 | 面板切换动画 | 流畅，无掉帧 |
| P-4 | 内存占用 | 无显著增长 |

### 4.3 可访问性验收

| 编号 | 验收项 | 标准 |
|------|--------|------|
| X-1 | 所有按钮 aria-label | 100% 覆盖 |
| X-2 | 颜色对比度 | ≥ 4.5:1 |
| X-3 | 焦点可见 | 键盘导航可见焦点 |
| X-4 | 屏幕阅读器 | 内容可朗读 |

### 4.4 新手体验验收（核心）

**30 秒测试**: 5 名未接触过 LT 的玩家进入游戏后，至少 4 人能回答：
- 我在列车上
- 时间很紧
- 我应该先观察当前车厢

**3 分钟测试**: 完成第一次观察和询问后，至少 4 人能回答：
- 小宁可能有问题
- 她说的话不一定是真的
- 我需要验证她有没有离开过座位

**第一轮失败**: 失败后，至少 4 人理解"下一轮可以带着记忆重新验证"

**第二轮**: 自然选择"盯住小宁"而非打开档案翻找

---

## 5. 非功能要求

### 5.1 兼容性
- 支持 iOS Safari 14+ / Chrome 90+ / Android WebView 90+
- 支持屏幕宽度 320px-428px（主流手机）
- 支持系统字体大小调整（不影响布局错乱）

### 5.2 性能
- 不引入新依赖（继续使用 Vanilla JS）
- 状态机计算在客户端完成，不增加后端请求
- 动画使用 CSS transform（GPU 加速）

### 5.3 安全
- 不修改 engine.js 核心逻辑
- 不改变现有 API 返回数据结构（仅新增字段）
- 所有前端状态计算基于已有 state 数据

---

## 6. 相关文件清单

### 6.1 修改文件

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `looptrain/standalone/public/app.js` | 修改 | 主逻辑：UIStage 状态机、控件可见性、许知微提示卡 |
| `looptrain/standalone/public/style.css` | 修改 | 新增样式：许知微提示卡、案件板、加载状态、动画 |
| `looptrain/standalone/public/index.html` | 修改 | 结构调整：新增许知微提示区容器 |
| `looptrain/standalone/server.js` | 修改 | 新增 `/api/ui-stage` 端点，修改 init/commit 响应 |
| `looptrain/standalone/engine.js` | 不修改 | 核心逻辑不变，UI 层在前端处理 |

### 6.2 新增文件

| 文件 | 说明 |
|------|------|
| `looptrain/standalone/public/ui-stage.js` | UIStage 状态机定义和阶段计算逻辑 |
| `looptrain/standalone/public/assistant-hint.js` | 许知微提示内容生成器 |
| `looptrain/standalone/public/case-board.js` | 案件板渲染逻辑 |
| `looptrain/standalone/public/loading-state.js` | 加载状态管理 |

### 6.3 测试文件

| 文件 | 说明 |
|------|------|
| `looptrain/standalone/tests/ui-stage.test.js` | UIStage 状态转换测试 |
| `looptrain/standalone/tests/assistant-hint.test.js` | 提示内容生成测试 |
| `looptrain/standalone/tests/e2e/newbie-flow.spec.js` | 新手流程 E2E 测试 |

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 老玩家习惯完整 UI，渐进解锁感到受限 | 中 | 提供"完整模式"开关，normal_play 阶段恢复所有控件 |
| 状态机判断条件不准确，导致阶段误判 | 高 | 基于 engine 已有 state 数据（history/loop/clues），不引入新逻辑 |
| 许知微提示内容过于冗长，遮挡行动区 | 中 | 限制提示文本长度（最多 3 行），添加"收起"按钮 |
| 案件板数据结构复杂，渲染性能问题 | 低 | 数据结构轻量，仅文本列表，无复杂计算 |

---

## 8. 后续迭代计划

### v0.11.2（后续）
- 支持玩家手动切换"完整模式"
- 添加更多许知微提示模板（覆盖更多游戏场景）
- 案件板支持拖拽排序
- 时间线可视化（图形化时间轴）

### v0.12.0（远期）
- 对话气泡式 UI（类似聊天应用）
- 浮动操作按钮 (FAB) 快速访问
- 底部 Tab 导航栏替代顶部按钮

---

*本规格是 00-idea.md 的细化展开。如实施过程中发现规格不可行，需回退到 idea 阶段重新评估。*
