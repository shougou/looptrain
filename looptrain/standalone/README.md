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

推荐游戏流程（Mock 模式）：

1. 开场背景页 → 点击"进入第七节车厢"
2. 扮演模式 → 点击"和小宁对话"
3. 对话中选择"温和询问" → 获得线索
4. 指令模式 → 点击"结束对话"（或输入：结束对话）
5. 点击"检查座位下方" → 获得第二条线索
6. 点击"说服赵乘警检查地板" → **试玩版成功**

也可以测试失败与记忆继承：

1. 指令模式 → 点击"强制失败测试"
2. 查看失败结算 → 点击"进入第 N 轮"
3. 新轮次开场将根据上一轮的确认事实变化

## API 端点

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/health` | 引擎健康检查 |
| POST | `/api/session/init` | 初始化会话状态 |
| POST | `/api/action/commit` | 提交探索行动 |
| POST | `/api/dialogue/start` | 开始 NPC 对话 |
| POST | `/api/dialogue/message` | 发送对话消息 |
| POST | `/api/dialogue/end` | 结束对话（触发结算） |
| POST | `/api/loop/fail` | 强制循环失败 |
| POST | `/api/loop/next` | 进入下一轮 |
| GET | `/api/suggestions` | 获取当前建议行动 |
| GET | `/api/npcs` | 获取 NPC 与线索标题 |

所有 API 返回 JSON。POST 请求需要 `Content-Type: application/json`。

## 运行测试

```bash
npm test        # 运行引擎冒烟测试
npm run check   # 语法检查（node --check）
```

## 架构

```
standalone/
├── engine.js         # LoopTrain 裁判引擎
├── server.js         # Express 服务器 + API 路由
├── package.json
├── public/
│   ├── index.html    # 独立前端（无 ST 依赖）
│   ├── app.js        # 游戏逻辑（vanilla JS）
│   ├── style.css     # 手机端 UI 样式
│   └── assets/       # NPC 立绘 + 背景
├── tests/
│   └── smoke_test.js # 引擎冒烟测试
└── README.md
```

## 边界说明

- **Mock 模式**：默认使用本地引擎规则回复，不需要任何 API Key
- **LLM 占位**：`/api/dialogue/message` 接受 `llm_reply` 字段作为 LLM 提供商边界；不传入时使用引擎内置 Mock 回复
- **无外部依赖**：前端纯 HTML/CSS/JS，后端仅依赖 Express
- **不部署**：仅本地运行，不暴露公网
- **不依赖 ST**：无 `window.SillyTavern` 调用，无 ST UI 组件

## 引擎溯源

`engine.js` 是 LoopTrain 的裁判引擎。所有游戏规则（AP、线索、对话轮数限制、失败结算、记忆继承）均由该引擎统一处理。
