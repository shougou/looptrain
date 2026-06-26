# LoopTrain -- 《寒灯初醒》

## 项目介绍

LoopTrain（《寒灯初醒》）是一款手机端互动叙事解谜游戏。

故事发生在 1939 年冬，一列名为"江城号"的列车上。玩家被困在一段 15 分钟的时间循环里，必须反复调查车厢、与 NPC 对话、收集线索，将碎片化的信息拼接成完整的时间线，逼近爆炸背后的真相。

核心玩法：

- **时间循环**：每一轮 15 分钟，失败后重置世界但保留玩家记忆（知识继承）。
- **AP 行动点系统**：每次探索消耗 AP，对话消耗多轮 AP，资源管理是生存关键。
- **线索收集与时间线推理**：通过三种观察行动（快速扫视、仔细观察、直觉判断）获取不同深度线索，拼合 NPC 行动时间线，检测矛盾并触发推理。
- **多维证据评分**：完整性、时效性、可靠性、关联度、矛盾标记五个维度综合评估证据质量。
- **许知微助手**：自带提示卡、案件板和推荐行动，辅助玩家推进调查。

当前版本：**v0.11.0-newbie-ui-unlock**，已从 SillyTavern 完全独立，本地运行时代号为 **SLT（Standalone LoopTrain）**。

线上部署：https://looptrain.me/play/game

---

## 系统架构

```text
浏览器 (Browser)
  └── SLT 前端 (Vanilla JS 组件化架构)
        ├── GameShell (根编排器)
        ├── 11 个 UI 组件 (layout / actions / feedback / overlays)
        ├── UIStage 渐进解锁系统 (7 阶段状态机)
        ├── 许知微助手提示系统 (assistant-hint.js)
        ├── 案件板 (case-board.js)
        └── 音效系统 (audio-manager.js, Web Audio API)

SLT Server (Node.js + Express, 端口 3030)
  ├── engine.js -- 裁判引擎 (纯函数, 唯一状态裁判)
  ├── TypeScript Runtime (src/runtime/ -- MemoryRuntime + 事件溯源 + Assistant AI)
  ├── LLM Bridge (llm/ -- DeepSeek provider + Mock fallback)
  └── 数据层 (materials/runtime/ -- 13 子目录, 24+ JSON 文件)

线上部署 (Alibaba Cloud ECS)
  ├── nginx 反向代理
  ├── pm2 进程管理
  └── https://looptrain.me/play/game
```

---

## 技术架构

| 层 | 技术栈 | 说明 |
|---|---|---|
| 前端 | Vanilla HTML/CSS/JS | 无框架, 组件化 ES6 class 架构, 手机竖屏优先 (390px 基准) |
| 后端 | Node.js + Express | 端口 3030, 21 个 API 端点 |
| 引擎 | engine.js (纯函数) | AP/线索/对话/循环/时间线推理/证据评分 |
| Runtime | TypeScript (src/runtime/) | 24 目录 68 文件, MemoryRuntime + 事件溯源 + 14 子系统 |
| LLM | DeepSeek Bridge | 线上已启用, Mock 为降级 fallback, API Key 服务端持有 |
| 数据 | JSON 文件 (materials/runtime/) | 13 子目录 24+ 文件, 内容完全外置化 |
| 测试 | Node.js assert + Playwright | 引擎单元测试 + standalone smoke test + 4 E2E spec |
| 存档 | localStorage 版本化双 key | SaveMeta + runtime, breaking change 自动检测 |
| 部署 | nginx + pm2 | Alibaba Cloud ECS Ubuntu 22.04 |
| Devlog | Astro 静态站 | https://looptrain.me/ |

---

## 快速启动

> **注意**：`node server.js` 是长期运行的守护进程，直接执行会阻塞终端。使用 tmux/screen 将其放入后台 session。

启动本地 SLT（推荐使用 tmux，不阻塞终端）：

```bash
# 方式一：tmux（推荐）
tmux new-session -d -s lt 'cd /home/shougou/11_looptrain && bash scripts/start_slt.sh'

# 方式二：screen（备选）
screen -dmS lt bash -c 'cd /home/shougou/11_looptrain && bash scripts/start_slt.sh'

# 方式三：nohup（简易，但重启不方便）
cd looptrain/standalone && nohup node server.js > /tmp/lt-server.log 2>&1 & disown
```

查看服务器输出：

```bash
tmux capture-pane -p -t lt | tail -20    # tmux
screen -S lt -X hardcopy /dev/stdout     # screen
tail -f /tmp/lt-server.log              # nohup
```

停止服务器：

```bash
tmux kill-session -t lt                 # tmux
screen -S lt -X quit                    # screen
pkill -f "node server.js"               # nohup
```

访问：

```text
http://127.0.0.1:3030/
```

验证本地 SLT：

```bash
bash scripts/verify_slt.sh
```

验证内容包括：

- `node --check` 语法检查
- standalone engine smoke tests
- `/api/health` 健康端点
- `/api/npcs` NPC 数据端点
- 首页 HTML 不包含 `SillyTavern`

---

## 当前架构

```text
looptrain/
  standalone/              # 当前本地默认运行时
    server.js              # Express 后端, 端口 3030, 21 个 API 端点
    engine.js              # LoopTrain 裁判引擎 (1263 行)
    src/runtime/           # TypeScript Runtime (24 目录, 68 文件, 14 子系统)
    llm/                   # LLM Bridge (DeepSeek + Mock)
    public/                # 独立游戏前端与资产
      app.js               # 主编排器
      components/          # 11 个 UI 组件 (layout / actions / feedback / overlays)
      ui-stage.js          # 渐进解锁状态机 (7 阶段)
      assistant-hint.js    # 许知微提示生成
      case-board.js        # 案件板渲染
      loading-state.js     # 加载状态管理
      portrait-intro.js    # 立绘入场动画
      audio-manager.js     # 音效系统
      style.css            # 手机端 UI 样式
      assets/              # 立绘 + 音效
    tests/                 # standalone smoke tests + e2e/ (4 Playwright spec)

  materials/
    looptrain/             # 设计态内容 (线索/剧集/规则/场景/Prompt)
    runtime/               # 运行态数据 (13 子目录, 24+ JSON 文件)
    assets/                # 可复用立绘和概念图
    sound/                 # 音频源素材

  tests/                   # 引擎单元测试 (6 个测试文件)
  docs/                    # 游戏架构文档

devlog/                    # looptrain.me 开发日志静态站 (Astro)
docs/                      # 根级架构文档 + Work Item 流转
scripts/                   # SLT 启动/验证/部署脚本 (10 个)
```

---

## 当前能力

### SLT 已具备

- 独立 Express 后端, 无 SillyTavern 依赖
- engine.js 纯函数裁判引擎 (AP/线索/对话/循环/时间线推理/证据评分)
- 组件化前端架构 (GameShell + 11 组件, flex 布局, 手机竖屏)
- UIStage 渐进解锁系统 (7 阶段: intro -> first_observation -> first_dialogue -> loop_memory_intro -> caseboard_intro -> contradiction_intro -> normal_play)
- NPC 时间线推理系统 (3 种观察行动 + 矛盾检测 + 推理生成 + 5 维证据评分)
- Goal Engine DSL + 12 条指令系统
- 许知微助手 (提示卡 + 案件板 + 推荐行动)
- 《寒灯初醒》试玩版完整内容 (5 角色, 3 场景, 20 线索, 8 目标)
- 音效系统 (场景环境音 + 按钮音效 + 时间压力 + 失败冲击)
- 存档系统 (localStorage 版本化双 key + breaking change 检测)
- Playwright E2E 回归测试 (4 spec)
- TypeScript Runtime (MemoryRuntime + 事件溯源 + Assistant AI 子系统)
- 已部署线上: https://looptrain.me/play/game
- 真实 LLM 动态对话 (DeepSeek, 线上已启用, Mock 为降级模式)

### SLT 尚未具备

- 许知微判定交互 (verdict_options 数据已预留)
- IndexedDB 存档迁移 (当前 localStorage)
- 手机端真机测试覆盖

---

## 不变铁律

- Engine 是唯一裁判。
- LLM 只能生成 NPC 表演文本或建议。
- LLM 不直接修改 AP、线索、状态、成功失败、循环继承。
- API Key 不进入前端。
- 本地验证先于线上部署。
- 未经最终确认，不上传线上、不切换生产 `/play/game`。

---

## 文档治理

任何改变项目事实、运行方式、公开状态、设计判断或剧情设定的迭代，都必须检查文档影响。

```bash
python3 scripts/check_docs_governance.py
```

事实源优先级：运行代码 > `MANIFEST.json` > 根 `README.md` > `devlog/src/data/*` > devlog 正式文档 > 旧文档 > `TBD/` 草稿。`TBD/` 只用于讨论稿；正式长期文档最终进入 `devlog/src/content/`。

---

## Devlog 网站

Devlog 静态站位于：

```text
devlog/
```

本地开发：

```bash
cd devlog
npm install
npm run dev -- --host 127.0.0.1
```

生产站点：

```text
https://looptrain.me/
```

---

## Legacy ST 说明

历史上的 LoopTrain-ST 验证包已经不再是本地默认运行目标。

旧 ST 相关内容已作为历史参考/可迁移素材处理，不再作为默认本地工作流。

如需回看旧集成思路，请查看 Git 历史或相关历史文档。

---

## 推荐下一步

1. LLM 对话质量调优 (DeepSeek 已上线, 需优化 prompt 和回复质量)
2. 实现许知微判定交互系统
3. 存档系统迁移到 IndexedDB
4. 手机端真机适配验证
5. 扩展 NPC 和剧情 (10+ NPC, 事故真相主线)
6. 多结局系统探索
