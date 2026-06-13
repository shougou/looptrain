# LoopTrain Devlog — 视觉与 UX 设计规格书

版本：v0.2
适用范围：looptrain.me 开发日志站第一阶段全部页面及角色档案页
设计原则：移动端优先、暗色主题、克制冷静、档案工程感
技术前提：Astro + Markdown + CSS Variables + 静态构建

---

## 1. 视觉概念与基调

### 1.1 一句话视觉定位

> **深夜列车事故档案库 + 独立游戏开发记录站**

这不是博客，不是企业官网，不是赛博朋克炫技页。它是一个**冷静、可读、有工程记录感**的暗色项目档案站。

### 1.2 核心词汇

| 维度 | 正向（必须体现） | 负向（必须避免） |
|------|-------------------|-------------------|
| 光照 | 夜间列车、低照度、隧道光、屏幕冷光 | 明亮白底、高亮度卡片、日光感 |
| 情绪 | 冷静、克制、孤独、专注、时间压力 | 热闹、亢奋、煽情、营销感 |
| 质感 | 档案记录、工程日志、轻微颗粒、细边框 | 光滑渐变、大阴影、毛玻璃泛滥 |
| 色彩 | 冷蓝/青色强调、深灰背景、暗红警示 | 高饱和霓虹、彩虹色、紫色渐变 |
| 动效 | 轻微淡入、边框亮起、极低透明度扫描线 | 大面积炫光、频繁闪烁、故障特效泛滥 |
| 文化 | 技术文档感、列车时刻表、事故报告 | 二次元萌系、商业游戏宣发、卡通风 |

### 1.3 视觉参考方向

```
深夜列车车厢低照度环境，窗外隧道光高速掠过。
冷蓝色屏幕光打在深灰面板上。
轻微胶片颗粒覆盖全局。
排版像列车时刻表与工程报告的结合。
不是赛博朋克，不是恐怖游戏，是冷静的悬疑档案。
```

---

## 2. 移动端优先架构

### 2.1 设计原则

LoopTrain 游戏本身是**手机竖屏**体验。Devlog 网站必须同样以移动端为第一设计目标，桌面端是增强而非降级。

**所有组件在 390px 宽度上必须先达到完整可用状态，再进行桌面端扩展。**

### 2.2 优先级视口

以下四个视口为强制适配断点，设计审查必须逐视口验证：

| 视口 | 宽 × 高 (px) | 代表设备 | 优先级 |
|------|-------------|----------|--------|
| VP-S | 390 × 844 | iPhone 14 / 中小屏手机 | **最高** |
| VP-M | 430 × 932 | iPhone 16 Pro Max / 大屏手机 | **高** |
| VP-T | 768 × 1024 | iPad / 平板竖屏 | 中 |
| VP-D | 1440 × 900 | 笔记本 / 桌面 | 中 |

### 2.3 布局宽度约束

```css
--layout-max: 1120px;    /* 首页、列表页最大内容宽度 */
--content-wide: 960px;   /* 较宽内容区域（如路线图） */
--content-max: 720px;    /* 窄阅读区域（日志详情、关于） */
```

规则：
- 首页可使用 `--layout-max` 宽度。
- 日志详情页、关于页必须限制在 `--content-max` 内。
- 桌面端正文绝不铺满全屏。
- 移动端左右内边距 ≥ 20px。
- 所有宽度约束使用 `max-width` + `margin: 0 auto`，禁止固定宽度。

### 2.4 响应式断点

```css
/* 移动端基础（< 768px）：无媒体查询，默认样式即为移动端 */
/* 平板断点 */
@media (min-width: 768px) { /* 平板及以上增强 */ }
/* 桌面断点 */
@media (min-width: 1024px) { /* 桌面增强 */ }
/* 宽屏断点 */
@media (min-width: 1280px) { /* 宽屏微调 */ }
```

移动端优先意味着：**默认 CSS（无媒体查询）即为 VP-S (390px) 样式**，随着宽度增加逐步叠加增强。

---

## 3. 色彩系统

### 3.1 基础标记

以下色彩变量来自 `AGENT.md` §7.2，必须原样使用，禁止自行增减或修改色值。

```css
:root {
  /* 背景层级 */
  --color-bg:           #07090d;    /* 页面底色，不是纯黑 */
  --color-bg-panel:     #0d1118;    /* 卡片、面板背景 */
  --color-bg-elevated:  #121722;    /* 悬浮层、hover 高亮背景 */

  /* 边框 */
  --color-border:       #263040;    /* 可见边框 */
  --color-border-soft:  #1a2230;    /* 微弱边框、分割线 */

  /* 文本 */
  --color-text:         #d7dde8;    /* 正文 */
  --color-text-muted:   #8993a5;    /* 次要文本、辅助信息 */
  --color-text-subtle:  #5f6b7d;    /* 极弱文本、占位符 */

  /* 强调色 —— 冷蓝/青，克制使用 */
  --color-accent:       #6cc7d9;    /* 主强调色 */
  --color-accent-soft:  rgba(108, 199, 217, 0.14);  /* 强调色弱背景 */
  --color-accent-strong: #9be8f4;   /* 强调色高亮（hover/active） */

  /* 语义色 */
  --color-warning:      #c98b55;    /* 警告 */
  --color-danger:       #b84a4a;    /* 危险/严重 */
  --color-danger-soft:  rgba(184, 74, 74, 0.14);   /* 危险弱背景 */
  --color-success:      #7ca982;    /* 成功/已完成 */
}
```

### 3.2 使用原则

| 颜色 | 用途 | 禁止 |
|------|------|------|
| `--color-bg` | 页面底色 | 不要用纯黑 `#000` |
| `--color-bg-panel` | 卡片、面板 | 不要用于大面积背景 |
| `--color-bg-elevated` | hover 态、弹层 | 不要与 panel 混用 |
| `--color-text` | 所有正文 | 不要在大面积区域使用 |
| `--color-text-muted` | 日期、标签、辅助信息 | 不要用于正文 |
| `--color-text-subtle` | 占位符、极弱提示 | 不要用于任何需要阅读的文字 |
| `--color-accent` | 链接、当前页标记、版本号 Badge | 不要大面积使用 |
| `--color-accent-strong` | hover 高亮、focus 环 | 仅交互态使用 |
| `--color-danger` | 倒计时、爆炸相关、严重问题 | 绝不用于普通按钮或装饰 |
| `--color-warning` | 已知问题、待处理状态 | 不要用于成功状态 |
| `--color-success` | 已完成状态、版本发布标记 | 仅状态指示 |

### 3.3 色彩配比

全局色彩面积参考（非精确，指导性原则）：

```
--color-bg:         ~65%  （页面底色）
--color-bg-panel:   ~25%  （卡片、面板）
--color-bg-elevated: ~5%  （hover、激活）
--color-border:      ~3%  （边框、分割线）
--color-accent:      ~1%  （点缀强调）
--color-danger:     <1%  （仅关键警示）
```

---

## 4. 字体系统

### 4.1 字体栈

```css
/* 中文正文 —— 系统优先，不强依赖外部字体 */
--font-body: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
             "Noto Sans SC", "Microsoft YaHei", sans-serif;

/* 等宽字体 —— 版本号、日期、状态标签、代码 */
--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
```

**禁止**上传或分发未经授权的商业字体文件。

### 4.2 字体层级

| 用途 | font-family | 字号 (移动端) | 字号 (桌面端) | 字重 | 行高 |
|------|-------------|---------------|---------------|------|------|
| 页面大标题 (H1) | `--font-body` | 24px | 32px | 700 | 1.3 |
| 区块标题 (H2) | `--font-body` | 20px | 24px | 600 | 1.4 |
| 子标题 (H3) | `--font-body` | 17px | 19px | 600 | 1.5 |
| 正文 | `--font-body` | 16px | 17px | 400 | 1.8 |
| 小字 / 辅助 | `--font-body` | 14px | 14px | 400 | 1.6 |
| 极小 / 标签 | `--font-body` | 12px | 12px | 400 | 1.4 |
| 版本号 / 日期 / 代码 | `--font-mono` | 13px | 14px | 400 | 1.5 |

### 4.3 排版规则

- 中文正文字号不得低于 16px（移动端）。
- 中文正文字重不得低于 400，禁止使用 300 及以下。
- 长文阅读区行高固定 1.8。
- 日志详情页正文区宽度 ≤ 720px（桌面端）。
- 段落间距使用 `margin-bottom` 1em，不使用空行分割。
- 标题与正文之间保持清晰的视觉层级，但不要用过大字号跳跃。

---

## 5. 间距系统

### 5.1 基础间距刻度

基于 4px 基准，确保所有间距落在刻度上：

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

### 5.2 页面级间距

| 区域 | 移动端 (VP-S) | 桌面端 (VP-D) |
|------|--------------|---------------|
| 页面左右内边距 | 20px (`--space-5`) | 自动居中 (`max-width`) |
| 区块上下间距 | 40px (`--space-10`) | 64px (`--space-16`) |
| 卡片间距（列表） | 16px (`--space-4`) | 20px (`--space-5`) |
| 段落间距 | 1em | 1em |
| 导航高度 | 48px | 56px |

---

## 6. 圆角、边框、阴影

### 6.1 圆角

```css
--radius-sm:  4px;   /* 小标签、badge */
--radius-md:  6px;   /* 卡片、面板 */
--radius-lg:  8px;   /* 大卡片 */
```

不使用大圆角（>12px）。整体保持方正、档案感。

### 6.2 边框

```css
--border-thin: 1px solid var(--color-border-soft);   /* 默认卡片边框 */
--border-visible: 1px solid var(--color-border);     /* 强调边框 */
```

边框应细且不抢眼。不使用粗边框装饰。

### 6.3 阴影

**不使用大面积阴影。** 暗色背景下阴影不可见且无意义。

仅在必要时使用极微弱内高光代替阴影，用于表明面板层级：

```css
box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
```

---

## 7. 组件规格

### 7.1 Header（顶部导航）

**职责**：全局导航、品牌标识、移动端菜单切换。

**移动端 (VP-S)**：
- 高度 48px。
- 左侧：站点名称 "LoopTrain"，使用 `--color-accent`，字号 16px，字重 600。
- 右侧：汉堡菜单按钮（三条横线图标，使用 `--color-text-muted`）。
- 背景：`--color-bg-panel`，底部 `1px solid var(--color-border-soft)`。
- 菜单展开后为全屏覆盖层，背景 `--color-bg` 不透明，导航项垂直排列。
- 当前页面对应的导航项使用 `--color-accent`，其余使用 `--color-text-muted`。

**桌面端 (VP-D)**：
- 高度 56px。
- 导航项水平排列在右侧，展开为行内。
- 当前页面链接下划线指示（`--color-accent`，2px 粗）。
- 背景可增加极低透明度模糊（`backdrop-filter: blur(8px)`，可选）。

**导航项**（按顺序）：首页 / 试玩 / 开发日志 / 路线图 / 更新记录 / 角色 / 关于

角色导航项为**可选**：仅在角色卡片数量 ≥ 2 时显示，放在"关于"之前。

**交互**：
- 导航链接 hover：颜色从 `--color-text-muted` 过渡到 `--color-accent`。
- 当前页标记：`--color-accent` + 左侧小圆点或底部下划线。
- 过渡时间：150ms ease。

**反模式**：
- 不要做粘性顶部导航的大面积阴影。
- 不要在导航中使用图片 Logo。
- 不要高饱和度或高亮度背景。

---

### 7.2 Footer（页脚）

**职责**：版权信息、域名、素材授权入口、联系方式（可选）。

**移动端 (VP-S)**：
- 背景：`--color-bg-panel`，顶部 `1px solid var(--color-border-soft)`。
- 内边距：`--space-8 20px`。
- 文字居中，字号 13px，颜色 `--color-text-muted`。
- 内容：项目名、域名、版权年份、授权说明入口链接。

**内容示例**：
```
LoopTrain Devlog · looptrain.me
© 2026 · 素材授权记录 · 联系方式
```

**桌面端 (VP-D)**：
- 内边距增大到 `--space-10`。
- 文字可左对齐或居中，保持一致。

---

### 7.3 Layout（页面布局容器）

**职责**：包裹所有页面的全局布局壳。

```text
Layout
├── Header
├── <main> (slot)
└── Footer
```

- `<main>` 最小高度：`calc(100vh - 96px)`（保证 Footer 在短页面中不悬浮）。
- 全局背景 `--color-bg`。
- 全局文本颜色 `--color-text`。
- 全局 `scroll-behavior: smooth`。

---

### 7.4 VersionBadge（版本标记）

**职责**：显示当前版本号，例如 "v0.4.3 · Early Playtest"。

**样式**：
- 字体：`--font-mono`。
- 字号：12px（移动端）/ 13px（桌面端）。
- 颜色：`--color-accent`。
- 背景：`--color-accent-soft`。
- 边框：`1px solid var(--color-accent)`（透明度约 0.3）。
- 形状：胶囊（`border-radius: 999px`）。
- 内边距：`2px 10px`。
- 显示为 `inline-block`。

**使用场景**：
- Hero 区域右上角或标题下方。
- 试玩页面顶部。
- 首页当前状态卡片中。

---

### 7.5 StatusCard（当前状态卡片）

**职责**：首页展示项目当前状态快照。

**字段**：
- 当前版本
- 当前阶段
- 最近更新日期
- 已知问题数量
- 下一步重点

**移动端 (VP-S)**：
- 背景：`--color-bg-panel`。
- 边框：`1px solid var(--color-border-soft)`。
- 圆角：`--radius-md`。
- 内边距：`--space-5`。
- 内高光：`inset 0 1px 0 rgba(255, 255, 255, 0.03)`。
- 字段使用标签-值对布局：标签用 `--color-text-muted` 12px，值用 `--color-text` 16px。

**桌面端 (VP-D)**：
- 内边距增大到 `--space-6`。
- 可使用两列布局（标签-值对并排）。

---

### 7.6 DevlogCard（开发日志卡片）

**职责**：开发日志列表页和首页最近日志中展示每篇日志摘要。

**字段**：
- 日期（`--font-mono`）
- 标题
- 摘要（≤ 2 行截断）
- 标签
- 状态

**移动端 (VP-S)**：
- 背景：`--color-bg-panel`。
- 边框：`1px solid var(--color-border-soft)`。
- 圆角：`--radius-md`。
- 内边距：`--space-4`。
- 日期：`--font-mono`，12px，`--color-text-muted`，置于标题上方。
- 标题：16px，`--color-text`，字重 600。
- 摘要：14px，`--color-text-muted`，行高 1.6，`line-clamp: 2`。
- 标签：12px 小标签，背景 `--color-bg-elevated`，`--color-text-subtle`。
- 状态文字：12px，`--color-text-subtle`。

**交互**：
- 整个卡片为可点击区域（链接到日志详情）。
- hover：边框颜色从 `--color-border-soft` 过渡到 `--color-border`。
- 过渡：200ms ease。
- 点击：轻微缩放或背景微亮。

**状态颜色映射**：
| 状态 | 颜色 |
|------|------|
| planning（计划中） | `--color-text-muted` |
| doing（进行中） | `--color-accent` |
| done（已完成） | `--color-success` |
| paused（暂停） | `--color-warning` |
| cancelled（已取消） | `--color-text-subtle` |

---

### 7.7 RoadmapItem（路线图条目）

**职责**：路线图页面中每个阶段或任务条目。

**字段**：
- 阶段名称
- 任务名称
- 状态
- 简短说明

**移动端 (VP-S)**：
- 左侧状态指示线 + 圆点 + 右侧内容。
- 状态指示线：`1px solid var(--color-border-soft)`。
- 状态圆点：8px 直径。
- 已完成：`--color-success` 实心圆。
- 进行中：`--color-accent` 实心圆 + 极弱脉冲动画（可选）。
- 未开始：`--color-border` 空心圆。
- 暂停：`--color-warning` 空心圆。
- 废弃：`--color-text-subtle` 空心圆 + 删除线效果。

**桌面端 (VP-D)**：
- 可增加右侧简短说明列，形成时间轴两侧布局。

---

### 7.8 KnownIssue（已知问题条目）

**职责**：列表展示当前版本已知问题。

**字段**：
- 问题标题
- 影响范围
- 当前状态
- 优先级

**移动端 (VP-S)**：
- 视觉接近事故报告或问题清单风格。
- 左侧优先级标记：`!` 图标或色条（仅使用 `--color-warning` 或 `--color-danger`）。
- 背景：`--color-bg-panel`。
- 边框：`1px solid var(--color-border-soft)`，左侧加粗色条（2-3px）。
- 标题：15px，`--color-text`。
- 影响范围：13px，`--color-text-muted`。
- 优先级极高标记：`--color-danger`。
- 优先级中/低标记：`--color-warning`。

---

### 7.9 CharacterCard（角色卡片）

**职责**：在 `/characters` 页面和首页"角色档案"预览区展示角色公开信息。这是一个**二级探索页面**，主要 CTA 仍然是"进入游戏"。

**视觉定位**：

角色卡片应呈现**列车乘务档案 / 乘客登记卡**的气质，而不是粉丝 Wiki、角色数据库或手游抽卡界面。卡片像一份被归档的记录，冷静、信息密度适中、不煽情。

**公开安全字段**（所有字段均为非剧透级别）：

| 字段 | 说明 | 是否必填 |
|------|------|----------|
| 公开名称 (displayName) | 角色在游戏中可被称呼的名称 | 是 |
| 公开身份 (publicRole) | 列车上的身份（乘客/乘务员/司机等），不涉及隐藏身份 | 是 |
| 试玩状态 (playtestStatus) | 当前试玩版中是否可交互 | 是 |
| 立绘状态 (portraitStatus) | 立绘资源状态：已有/待修复/待制作 | 是 |
| 卡片类型 (cardType) | ST角色卡 / 世界书条目 / 剧情节点 | 是 |
| 来源状态 (sourceStatus) | AI生成 / 素材待确认 / 已确认 | 是 |
| 标签 (tags) | 非剧透描述标签 | 否 |
| 非剧透备注 (nonSpoilerNote) | 游戏内可自然获得的第一印象信息 | 否 |

**反剧透规则**：

- 绝不公开角色的隐藏身份、真实动机、关键秘密、剧情反转。
- 绝不公开"某某是最终反派"、"某某的真实姓名"等核心信息。
- 隐藏/未公开信息使用文案 **"未公开"** 或 **"游戏中发现"**，不使用占位图标或假信息。
- 立绘方面：未确认/待修复的立绘使用**灰色占位框** + 文字说明，不使用随机图片或未授权素材。
- 卡片整体不暗示剧情走向。

**移动端 (VP-S)**：

```
┌──────────────────────────────┐
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │     [立绘占位区域]        │ │
│ │     200×240px            │ │
│ │     或实际立绘            │ │
│ │                          │ │
│ └──────────────────────────┘ │
│                              │
│  公开名称                    │
│  ────────────────────────   │
│  公开身份 · 试玩状态        │
│                              │
│  ┌─────────┐ ┌────────────┐ │
│  │ 卡片类型 │ │ 立绘状态   │ │
│  └─────────┘ └────────────┘ │
│                              │
│  标签：标签1 标签2           │
│                              │
│  备注：在游戏中可自然获得的  │
│  第一印象信息。              │
└──────────────────────────────┘
```

**卡片样式**：

- 背景：`--color-bg-panel`。
- 边框：`1px solid var(--color-border-soft)`。
- 圆角：`--radius-md`。
- 内边距：`--space-4`。
- 整体像一份归档记录卡，有轻微内高光 `inset 0 1px 0 rgba(255, 255, 255, 0.02)`。

**立绘区域**：

- 固定高度 200px（移动端）/ 240px（桌面端）。
- 背景：`--color-bg-elevated`。
- 圆角：`--radius-sm`（仅上方两角有圆角，与卡片形成一体感）。
- 立绘可用时：图片居中适应（`object-fit: contain`），周围暗角处理（CSS `radial-gradient` 遮罩）。
- 立绘待修复/待确认时：灰色占位，中央显示 `--font-mono` 文字 "立绘待确认"（`--color-text-subtle`），无图片。
- **禁止使用未经授权素材作为占位**。

**公开名称**：

- 字体：`--font-body`，字号 18px，字重 600，`--color-text`。
- 下方 1px 分割线，颜色 `--color-border-soft`。

**公开身份 + 试玩状态**：

- 字体：`--font-body`，字号 14px。
- 公开身份使用 `--color-text-muted`。
- 试玩状态使用状态色（见下方状态映射），`--font-mono` 12px。

**状态标签行**：

- 卡片类型、立绘状态、来源状态分别显示为小标签。
- 标签样式：`--font-mono` 11px，背景 `--color-bg-elevated`，内边距 `1px 8px`，圆角 `--radius-sm`。
- 颜色映射：

| 状态类型 | 状态值 | 标签颜色 |
|----------|--------|----------|
| 试玩状态 | 可交互 | `--color-success` |
| 试玩状态 | 即将开放 | `--color-warning` |
| 试玩状态 | 暂未开放 | `--color-text-subtle` |
| 立绘状态 | 已有 | `--color-success` |
| 立绘状态 | 待修复 | `--color-warning` |
| 立绘状态 | 待制作 | `--color-text-subtle` |
| 来源状态 | 已确认 | `--color-success` |
| 来源状态 | 待确认 | `--color-warning` |
| 来源状态 | AI 生成 | `--color-text-muted` |

**备注区域**：

- 字体：`--font-body`，字号 13px，`--color-text-muted`，行高 1.6。
- 仅在备注内容非空时显示。

**交互**：

- 角色卡片为纯展示组件，不包含链接（第一阶段角色卡片无详情页）。
- 无 hover 变换（与 DevlogCard 区分，强调"查看档案"的静态感）。
- 如果未来扩展详情页，整个卡片变为可点击区域，hover 时边框微亮。

**桌面端 (VP-D)**：

- 卡片网格排列：`min-width ≥ 768px` 时 2 列，`min-width ≥ 1024px` 时 3 列。
- 每列最大宽度 `360px`，使用 `grid` 布局，`gap: var(--space-5)`。
- 立绘区域高度增大到 240px。
- 卡片之间保持均匀间距。

**空态**：

- 如果暂无角色卡片：显示 "角色档案正在整理中。"（`--color-text-muted`，居中）。
- 不展示占位假卡片。

**反模式**：

- 不要将角色卡片设计为手游抽卡/卡牌对战风格。
- 不要使用星级评分、稀有度标记、属性条。
- 不要展示角色立绘的全身/战斗姿态（仅使用头肩/半身）。
- 不要在卡片中使用高饱和强调色或大面积渐变背景。
- 不要暗示角色强度或"抽卡"机制。

---

## 8. 动效与过渡

### 8.1 允许的动效

| 类型 | 实现方式 | 用途 |
|------|---------|------|
| 页面进入 | `opacity` 0→1 + `translateY` 4px→0 | 页面加载时的极轻量淡入 |
| 卡片 hover | `border-color` 过渡 | DevlogCard、导航链接 hover |
| 按钮 hover | `translateY(-1px)` | 主按钮按下感 |
| 背景纹理 | `opacity: 0.03-0.06` 的扫描线 CSS | 全局极低透明度氛围 |
| 状态脉冲 | `opacity` 呼吸 | 仅 RoadmapItem "进行中" 圆点 |

### 8.2 动效参数

```css
--transition-fast:   150ms ease;
--transition-normal: 200ms ease;
--transition-slow:   300ms ease;
```

- 所有交互过渡使用 `--transition-normal`。
- hover 类效果统一 200ms。
- 页面加载动画 stagger 延迟 50-80ms 每项，总时长不超过 400ms。

### 8.3 禁止的动效

- 大面积炫光或扫描线动画（允许极低不透明度静态纹理，不做动态扫描）。
- 频繁闪烁（>1 次/秒）。
- 自动播放的背景动画。
- 干扰阅读的持续运动。
- 故障特效（glitch）滥用。
- 页面切换时的全屏过渡动画。
- 滚动视差效果。

### 8.4 prefers-reduced-motion

**强制执行**。全局样式表必须包含：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. 可访问性

### 9.1 必须达标项

- 所有交互元素可键盘访问（Tab、Enter、Space）。
- 所有链接有明确文本（不使用仅图标无 label 的链接）。
- 所有 `<img>` 有 `alt` 属性（装饰性图片使用 `alt=""`）。
- 色彩对比度满足 WCAG AA（正文 4.5:1，大文字 3:1）。
- 不依赖颜色作为唯一状态提示（使用图标、文字辅助）。
- 每页只有一个 `<h1>`。
- 标题层级连续（H1 → H2 → H3，不跳级）。
- `prefers-reduced-motion` 已覆盖。

### 9.2 焦点样式

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

使用 `:focus-visible` 而非 `:focus`，避免鼠标点击时出现焦点环。

---

## 10. 页面逐页设计指引

### 10.1 首页 `/`

**页面目标**：10 秒内传达四件事 —— 是什么、处于什么阶段、如何试玩、哪里看进展。

**模块垂直顺序**（移动端）：

```
┌──────────────────────────┐
│  Header (固定)            │
├──────────────────────────┤
│  Hero 区域                │
│  · 大标题 "LoopTrain 开发日志"  │
│  · 副标题                 │
│  · 简介文案（≤ 3 句）      │
│  · VersionBadge           │
│  · [开始试玩] 主按钮       │
│  · [查看开发日志] 次按钮   │
├──────────────────────────┤
│  当前状态 StatusCard       │
├──────────────────────────┤
│  最近开发日志 ×3           │
│  DevlogCard ×3 垂直排列   │
├──────────────────────────┤
│  路线摘要 RoadmapItem ×3-5│
│  "查看完整路线图 →"        │
├──────────────────────────┤
│  Footer                   │
└──────────────────────────┘
```

**Hero 区域特别要求**：
- 大标题使用 `--font-body`，字重 700，移动端 24px / 桌面端 32px。
- 副标题使用 `--color-text-muted`。
- 主按钮（开始试玩）：`--color-accent` 背景 + `--color-bg` 文字，圆角 `--radius-md`。
- 次按钮（查看开发日志）：透明背景 + `1px solid var(--color-border)`，文字 `--color-text-muted`。
- 轻微背景纹理可用 CSS 实现：极低透明度点的轨道线或扫描线，不影响文字阅读。
- **禁止使用大面积背景图片、强对比图片、重动画**。

**主按钮样式**：

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-6);
  background: var(--color-accent);
  color: var(--color-bg);
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: transform var(--transition-normal),
              box-shadow var(--transition-normal);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 20px var(--color-accent-soft);
}
```

**次按钮样式**：

```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-6);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 15px;
  font-weight: 500;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--transition-normal),
              color var(--transition-normal);
}
.btn-secondary:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
```

---

### 10.2 试玩页面 `/play`

**页面目标**：让用户进入游戏。只承担这一个核心目标。

**移动端单列垂直布局**：

```
┌──────────────────────────┐
│  Header                   │
├──────────────────────────┤
│  游戏标题                 │
│  "LoopTrain 试玩版"       │
├──────────────────────────┤
│  VersionBadge             │
│  推荐设备：手机竖屏        │
├──────────────────────────┤
│  试玩说明（≤ 4 句）       │
├──────────────────────────┤
│  [进入游戏] 大按钮         │
│  (全宽、醒目但不过度)      │
├──────────────────────────┤
│  已知问题 KnownIssue × N  │
│  事故报告风格列表          │
├──────────────────────────┤
│  反馈方式（纯文本，无表单）│
├──────────────────────────┤
│  Footer                   │
└──────────────────────────┘
```

**"进入游戏"按钮特别要求**：
- 移动端全宽（`width: 100%`，扣除左右 padding）。
- 桌面端最大宽度 320px。
- 颜色使用 `--color-accent` 背景。
- 按钮上下留有充足间距（`--space-8`），不与周围内容挤在一起。
- 字体使用 `--font-body`，不使用等宽字体。

---

### 10.3 开发日志列表 `/devlog`

**移动端**：DevlogCard 垂直堆叠，每张卡片全宽。
**桌面端**：可使用两列网格（仅当 `min-width ≥ 768px`）。

**列表页头部**：
- 页面标题 "开发日志"（H1）。
- 可选：简要说明（一行）。

**排序**：按日期倒序，最新在前。

**空态**：如无日志，显示 "暂无开发日志，即将开始记录。"（`--color-text-muted`，居中）。

---

### 10.4 开发日志详情 `/devlog/:slug`

**页面目标**：提供干净、专注的长文阅读体验。

**移动端**：
- 正文区全宽（扣除 20px 左右 padding）。
- 文章头部：标题（H1）、日期 + 版本 + 状态（标签行）、标签列表。
- 正文区内不设侧边栏、不设浮动目录。

**桌面端**：
- 正文区最大宽度 `--content-max` (720px)，居中。
- 左右留白区域保持空白，不填充内容。

**排版细节**：
- 正文段落间距 1em。
- 列表项（`<ul>`/`<ol>`）左侧缩进 1.5em。
- 代码块使用 `--color-bg-elevated` 背景 + `--font-mono`。
- 引用块（`<blockquote>`）：左侧 3px `--color-border` 色条 + `--color-text-muted` 文字。
- 图片（如有）最大宽度 100%，不超出正文区。

**文章底部**：
- 上一篇 / 下一篇导航（如果存在）。
- 返回日志列表链接。

---

### 10.5 路线图 `/roadmap`

**页面结构**（移动端）：

```
┌──────────────────────────┐
│  Header                   │
├──────────────────────────┤
│  页面标题 "项目路线图"     │
├──────────────────────────┤
│  当前阶段：试玩版稳定      │
│  RoadmapItem × N          │
├──────────────────────────┤
│  下一阶段：体验增强        │
│  RoadmapItem × N          │
├──────────────────────────┤
│  长期阶段：完整游戏        │
│  RoadmapItem × N          │
├──────────────────────────┤
│  Footer                   │
└──────────────────────────┘
```

**阶段标题**使用 H2，字重 600，`--color-accent` 可选。

**时间轴视觉**：
- 移动端：左侧竖线 + 圆点。
- 桌面端：可使用交替左右布局的时间轴，但保持简洁。

---

### 10.6 更新记录 `/changelog`

**移动端**：按版本号倒序排列，每个版本一个区块。

```
┌──────────────────────────┐
│  v0.4.3                   │
│  日期：2026-06-xx          │
│  ──────────────────────── │
│  新增                     │
│  · 项目 1                 │
│  · 项目 2                 │
│  修复                     │
│  · 项目 1                 │
│  已知问题                 │
│  · 问题 1                 │
├──────────────────────────┤
│  v0.4.2                   │
│  ...                      │
└──────────────────────────┘
```

版本号使用 `--font-mono` + `--color-accent`。
分类标题（新增/修复/已知问题）使用 H3，字号 14px，`--color-text-muted`。

---

### 10.7 关于页面 `/about`

与日志详情页共享相同的排版约束：正文区 `max-width: 720px`，居中。

**内容结构**：
- 项目是什么。
- 为什么做。
- 当前状态。
- 技术栈简述（可选）。
- 联系方式（可选）。

---

### 10.8 设计笔记 `/design` 和 `/design/:slug`

（第二阶段实现，设计规格同 `/devlog` 和 `/devlog/:slug`）

---

### 10.9 素材记录 `/assets`

（第二阶段实现，表格形式展示素材清单）

---

### 10.10 角色档案 `/characters`

**页面定位**：

这是一个**二级探索页面**，不是网站核心页面。网站的首要 CTA 始终是 `/play` 页面的"进入游戏"按钮。角色档案页面供有兴趣深入了解项目角色设定的访问者浏览。

**页面目标**：

- 展示当前项目中已公开的角色信息。
- 以"档案记录"方式呈现，而非"角色介绍"/"人物 Wiki"。
- 严格遵守反剧透规则。
- 让访问者感受项目的角色设计深度，但不泄露核心悬疑。

**移动端页面结构**：

```
┌──────────────────────────────┐
│  Header                       │
├──────────────────────────────┤
│  页面标题 "角色档案"           │
│  说明文字（≤ 2 句）            │
│  剧透安全声明                 │
├──────────────────────────────┤
│  CharacterCard × N            │
│  垂直堆叠，每张全宽           │
│  卡片间距：--space-5          │
├──────────────────────────────┤
│  底部说明：                   │
│  "更多角色将在后续版本中逐步  │
│   公开。隐藏设定请前往游戏内   │
│   自行发现。"                 │
├──────────────────────────────┤
│  Footer                       │
└──────────────────────────────┘
```

**桌面端页面结构**：

- CharacterCard 使用 CSS Grid 排列。
- 平板（≥768px）：2 列。
- 桌面（≥1024px）：3 列。
- 卡片最大宽度 `360px`。
- `gap: var(--space-5)`。

**页面标题区域**：

- H1："角色档案"，24px（移动端）/ 32px（桌面端），字重 700。
- 说明文字：14px，`--color-text-muted`，一行。
- 示例说明："LoopTrain 试玩版中已公开的角色信息。不涉及核心剧情谜底。"
- 剧透安全声明：小号文字（12px），`--color-text-subtle`，置于说明下方。
- 声明示例："本页面仅展示游戏中可自然获知的公开信息。隐藏设定请在游戏中自行发现。"

**卡片排序**：

- 默认按试玩状态排序：可交互 → 即将开放 → 暂未开放。
- 同状态内按公开名称排序。

**页面底部说明**：

- 与上方卡片区域间距 `--space-10`。
- 文字居中，14px，`--color-text-muted`。
- 内容："更多角色信息将在后续版本中逐步公开。部分角色设定需要玩家在游戏内通过探索自行发现。"

**与其他页面的关系**：

- 首页可以有一个轻量的"角色档案"预览区（1-2 张 CharacterCard + "查看全部角色 →" 链接）。
- 首页预览区放在"路线摘要"下方、"页脚"上方，优先级低于试玩入口和开发日志。
- 不将角色卡片放在 Hero 区域或试玩页面上，避免分散主要 CTA 注意力。

**URL 与导航**：

- 页面 URL：`/characters`。
- 导航中**可选**加入"角色"入口（仅当角色卡片数量 ≥ 2 时在导航中显示）。
- 导航项位置：在"关于"之前或之后，作为最后一项。
- 导航文案："角色"或"角色档案"，使用 `--color-text-muted`。

---

## 11. SEO 视觉资产

### 11.1 Open Graph / 分享图

**必须创建**一张项目封面图用于社交分享。

**规格**：
- 尺寸：1200 × 630px（OG 标准比例 1.91:1）。
- 格式：PNG 或 JPG（WebP 备选）。
- 文件大小：< 300KB。

**设计方向**：
```
暗色背景（--color-bg 基调）。
中央或左侧大标题 "LoopTrain Devlog"，
使用冷蓝/青色（--color-accent）。
副标题 "一款互动叙事解谜游戏的长期开发记录"，
使用 --color-text-muted。
可包含极简列车轨道线条或隧道光暗示。
不要人物立绘、不要游戏截图、不要复杂场景。
保持与网站一致的冷静档案感。
```

### 11.2 Favicon

- 格式：SVG（优先）+ PNG 备选。
- 内容：极简图标，可使用轨道环形、时间循环符号或 "LT" 字母组合。
- 颜色：`--color-accent` 在 `--color-bg` 上。

### 11.3 每页 Meta

所有页面必须配置 `<title>`、`<meta name="description">`、OG 标签。具体文案参考 `spec.md` §11。

---

## 12. 设计反模式（强制禁止）

### 12.1 视觉层面

| 禁止 | 原因 |
|------|------|
| 明亮白底或浅色主题 | 违背"深夜列车事故档案"定位 |
| 高饱和霓虹色（品红、亮绿、亮紫） | 过度赛博朋克，干扰阅读 |
| 大面积紫色渐变 | AI 生成式廉价感 |
| 大面积背景图片 | 加载重、干扰文字、风格失控 |
| 强对比游戏截图作为 Hero 背景 | 破坏档案站气质 |
| 玻璃态/毛玻璃泛滥 | 不适合暗色克制风格 |
| 三维旋转、视差滚动 | 过度设计，干扰内容 |
| 装饰性边框花纹 | 偏离工程档案感 |

### 12.2 交互层面

| 禁止 | 原因 |
|------|------|
| 自动播放音频 | 用户体验差、AGENT.md 明确禁止 |
| 首页自动播放视频背景 | 加载重、干扰核心信息传达 |
| 页面切换全屏动画 | 静态站不应依赖 SPA 过渡 |
| 光标跟随特效 | 分心、移动端不支持 |
| 强行劫持滚动 | 破坏可访问性 |

### 12.3 内容层面

| 禁止 | 原因 |
|------|------|
| 剧透核心悬疑谜底 | AGENT.md §2.3 铁律 |
| 强日期承诺（"7 月上线"） | AGENT.md §2.4 铁律 |
| 夸张营销文案 | AGENT.md §2.5 铁律 |
| 虚构已完成事项 | AGENT.md §20 工作规则 |
| 使用授权不明的立绘/图片 | AGENT.md §12 |
| 上传未授权商业字体 | AGENT.md §12.3 |

### 12.4 角色卡片反剧透规则（强制）

| 禁止 | 原因 |
|------|------|
| 公开角色隐藏身份/真实动机/关键秘密 | AGENT.md §2.3 铁律 |
| 使用"最终反派""真正凶手"等剧透词 | 破坏游戏体验 |
| 展示未公开 NPC 的真实姓名 | 隐藏 NPC 设定不可提前公开 |
| 使用星级评分、稀有度、属性条 | 手游卡牌风格，违反档案站定位 |
| 暗示角色强度或战斗能力 | 非战斗游戏，误导访问者 |
| 使用未授权立绘作为占位图 | AGENT.md §12 素材规定 |
| 将"未公开"信息伪装为占位符暗示 | 应使用明确文字"游戏中发现" |
| 在立绘区域使用暗示性剪影 | 避免任何形式的隐性剧透 |

---

## 13. 实现优先级

### Phase 1 — 必须（首次构建）

- [x] 全局 CSS Variables（颜色、间距、字体、圆角）
- [x] Layout 组件 + Header + Footer
- [x] 移动端基础响应式框架
- [x] VersionBadge 组件
- [x] StatusCard 组件
- [x] DevlogCard 组件
- [x] RoadmapItem 组件
- [x] KnownIssue 组件
- [x] 首页完整布局
- [x] 试玩页面完整布局
- [x] 开发日志列表 + 详情
- [x] 路线图页面
- [x] 更新记录页面
- [x] 关于页面
- [x] `prefers-reduced-motion` 覆盖
- [x] 基础焦点样式
- [x] Favicon + OG 封面图

### Phase 2 — 增强（后续迭代）

- [ ] 设计笔记列表 + 详情
- [ ] 素材记录表格页面
- [ ] 角色档案页面 `/characters` + CharacterCard 组件
- [ ] 日志标签筛选
- [ ] 上一篇/下一篇日志导航
- [ ] RSS Feed
- [ ] 暗色主题下代码高亮
- [ ] 轻量背景纹理（CSS 实现）

### Phase 3 — 可选（长期）

- [ ] 全文搜索
- [ ] 匿名访问统计
- [ ] 自动部署 CI/CD
- [ ] 反馈表单

---

## 14. 设计标记速查

### CSS Variables 完整列表

```css
:root {
  /* 背景 */
  --color-bg: #07090d;
  --color-bg-panel: #0d1118;
  --color-bg-elevated: #121722;

  /* 边框 */
  --color-border: #263040;
  --color-border-soft: #1a2230;

  /* 文本 */
  --color-text: #d7dde8;
  --color-text-muted: #8993a5;
  --color-text-subtle: #5f6b7d;

  /* 强调 */
  --color-accent: #6cc7d9;
  --color-accent-soft: rgba(108, 199, 217, 0.14);
  --color-accent-strong: #9be8f4;

  /* 语义 */
  --color-warning: #c98b55;
  --color-danger: #b84a4a;
  --color-danger-soft: rgba(184, 74, 74, 0.14);
  --color-success: #7ca982;

  /* 字体 */
  --font-body: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
               "Noto Sans SC", "Microsoft YaHei", sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;

  /* 间距 */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 20px;  --space-6: 24px;
  --space-8: 32px;  --space-10: 40px; --space-12: 48px;
  --space-16: 64px; --space-20: 80px;

  /* 布局 */
  --layout-max: 1120px;
  --content-wide: 960px;
  --content-max: 720px;

  /* 形状 */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* 动效 */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}
```

### 视口速查

| 名称 | 尺寸 | 代表设备 |
|------|------|----------|
| VP-S | 390 × 844 | iPhone 14 |
| VP-M | 430 × 932 | iPhone 16 Pro Max |
| VP-T | 768 × 1024 | iPad |
| VP-D | 1440 × 900 | 笔记本 |

### 组件清单

| 组件 | 文件（建议名） | 用途 |
|------|---------------|------|
| Layout | `Layout.astro` | 页面壳 |
| Header | `Header.astro` | 顶部导航 |
| Footer | `Footer.astro` | 页脚 |
| VersionBadge | `VersionBadge.astro` | 版本号标记 |
| StatusCard | `StatusCard.astro` | 当前状态卡片 |
| DevlogCard | `DevlogCard.astro` | 日志列表卡片 |
| RoadmapItem | `RoadmapItem.astro` | 路线图条目 |
| KnownIssue | `KnownIssue.astro` | 已知问题条目 |
| CharacterCard | `CharacterCard.astro` | 角色档案卡片 |

---

## 15. 版本记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v0.1 | 2026-06-13 | 初始设计规格书，覆盖第一阶段全部页面与组件 |
| v0.2 | 2026-06-13 | 增加角色档案页面 `/characters`、CharacterCard 组件、反剧透规则 §12.4 |

---

*本文档服务于 LoopTrain Devlog 第一阶段开发。所有设计决策必须回查本文档与 `AGENT.md` 进行一致性校验。*
