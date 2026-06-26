# LoopTrain Standalone MVP

LoopTrain 的本地 Node.js 独立运行时。**不依赖 SillyTavern**。

## 快速启动

```bash
cd looptrain/standalone
npm install
npm start
```

浏览器打开：

```
http://localhost:3030
```

## 验证路径

推荐游戏流程（LLM 模式，v0.11 渐进解锁）：

1. 开场背景页 → 渐进解锁第一阶段，显示 1 个行动按钮
2. 点击"观察当前场景" → 解锁更多行动，许知微提示卡出现
3. 点击"和小宁对话" → 进入对话聚焦模式
4. 对话中选择"温和询问" → 获得线索
5. 点击"结束对话" → 回到主界面
6. 点击"检查座位下方" → 获得第二条线索
7. 点击"说服赵乘警检查地板" → **试玩版成功**

也可以测试失败与记忆继承：

1. 点击"强制失败测试"
2. 查看失败结算 → 点击"进入第 N 轮"
3. 新轮次开场将根据上一轮的确认事实变化

## API 端点

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/health` | 引擎健康检查，返回版本和模式 |
| POST | `/api/session/init` | 初始化会话状态 |
| POST | `/api/action/commit` | 提交探索行动 |
| POST | `/api/action/observe` | 观察环境（type/npc_id/location） |
| POST | `/api/dialogue/start` | 开始 NPC 对话 |
| POST | `/api/dialogue/message` | 发送对话消息 |
| POST | `/api/dialogue/end` | 结束对话（触发结算） |
| POST | `/api/loop/fail` | 强制循环失败 |
| POST | `/api/loop/next` | 进入下一轮 |
| GET | `/api/suggestions` | 获取当前建议行动 |
| GET | `/api/npcs` | 获取 NPC 与线索标题 |
| GET | `/api/scenes` | 获取所有场景定义 |
| GET | `/api/config` | 获取 LLM 配置状态 |
| GET | `/api/commands` | 获取指令注册表 |
| GET | `/api/xu-dialogue` | 获取许知微对话模板 |
| GET | `/api/intro` | 获取开场文字内容 |
| GET | `/api/app-strings` | 获取 UI 字符串 |
| GET | `/api/ui-stage` | 获取 UI 阶段配置（渐进解锁） |
| POST | `/api/assistant/ask` | 助手查询（Runtime v0.6） |
| GET | `/api/assistant/state` | 获取助手初始状态 |
| POST | `/api/llm/npc-reply` | LLM Bridge：NPC 回复（Mock/LLM） |

所有 API 返回 JSON。POST 请求需要 `Content-Type: application/json`。

## 运行测试

```bash
npm test                # 引擎冒烟测试 + Runtime 测试
npm run check           # 语法检查（node --check）
npm run test:e2e        # Playwright E2E 测试（需先启动服务器）
npm run test:runtime    # TypeScript Runtime 测试
```

## 架构

```
standalone/
├── server.js              # Express 服务器 + 21 个 API 路由
├── engine.js              # LoopTrain 裁判引擎 (1261 行)
├── src/runtime/           # TypeScript Runtime (68 文件, 14 子系统)
├── llm/                   # LLM Bridge (DeepSeek + Mock)
│   ├── providers.js       # DeepSeek provider + Mock reply
│   └── prompt.js          # NPC prompt 构建
├── public/                # 独立前端（无 ST 依赖）
│   ├── index.html         # HTML shell
│   ├── app.js             # 主编排器（游戏状态 + API + GameShell）
│   ├── style.css          # 手机端 UI 样式
│   ├── ui-stage.js        # 渐进解锁状态机 (7 阶段)
│   ├── assistant-hint.js  # 许知微提示生成
│   ├── case-board.js      # 案件板渲染
│   ├── loading-state.js   # 加载状态管理
│   ├── portrait-intro.js  # 立绘入场动画
│   ├── audio-manager.js   # 音效系统
│   ├── components/        # v0.11.0 组件库
│   │   ├── utils.js       # 组件基类 + 工具函数
│   │   ├── layout.js      # GameShell + 5 组件
│   │   ├── actions.js     # 3 组件 (ActionDock/MoreActionsSheet/FocusWatchBar)
│   │   ├── feedback.js    # EventFeed + ActionResultCard
│   │   └── overlays.js    # 2 组件 (ArchiveSheet/DialogueFocusSheet)
│   └── assets/            # 立绘 + 音效
├── tests/                 # 测试
│   ├── smoke_test.js      # 引擎冒烟测试
│   ├── ui-stage.test.js   # UIStage 测试
│   ├── assistant-hint.test.js # 助手提示测试
│   └── e2e/               # Playwright E2E (4 spec)
└── README.md
```

## 边界说明

- **LLM 模式**：线上已启用 DeepSeek 动态对话；LLM_ENABLED=false 时降级为 Mock 模式（引擎内置规则回复）
- **LLM Bridge**：`/api/llm/npc-reply` 和 `/api/dialogue/message` 支持 LLM 回复；`LLM_ENABLED=true` 时调用 DeepSeek API
- **环境变量**：`.env` 文件配置（`DEEPSEEK_API_KEY`, `LLM_ENABLED`, `DEEPSEEK_MODEL`, `LLM_MAX_TOKENS`, `LLM_TEMPERATURE`, `PORT`）
- **组件化前端**：11 个 UI 组件 + GameShell 编排器，vanilla JS ES6 class 架构
- **UIStage 系统**：7 阶段渐进解锁，控制 UI 元素可见性
- **无外部框架**：前端纯 HTML/CSS/JS，后端仅依赖 Express
- **线上部署**：已部署至 https://looptrain.me/play/game
- **不依赖 ST**：无 `window.SillyTavern` 调用，无 ST UI 组件

## 引擎溯源

`engine.js` 是 LoopTrain 的裁判引擎。所有游戏规则（AP、线索、对话轮数限制、失败结算、记忆继承）均由该引擎统一处理。
