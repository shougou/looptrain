# AGENT.md — LoopTrain Standalone 开发协作规范

## 1. 项目定位

LoopTrain 当前本地开发主线是 **SLT（Standalone LoopTrain）**。

目标：

```text
不依赖 SillyTavern，独立运行 LoopTrain 互动叙事解谜游戏。
```

历史 ST 集成线已经从本地默认工作流中移除。后续所有本地开发、验证和调试都以 `looptrain/standalone/` 为准。

---

## 2. 当前版本

当前版本：

```text
v0.5-standalone-mvp
```

当前状态：

- 已建立 `looptrain/standalone/` 本地运行时。
- 已复用原 `engine.js` 作为裁判引擎。
- 已实现本地 Express API。
- 已实现无 ST 的手机端游戏前端。
- 已验证成功路径、失败路径、下一轮路径。
- 尚未接入真实 LLM。
- 尚未切换线上 `/play/game`。

---

## 3. 项目铁律

### 3.1 Engine 永远是裁判

LLM 或前端不得直接决定：

- AP 扣除
- 时间推进
- 获得线索
- NPC 状态变化
- 试玩版成功
- 循环失败
- 下一轮继承记忆

这些必须由 `standalone/engine.js` 或后续提取出的 Engine 模块统一计算。

### 3.2 LLM 只做表演文本

未来接入真实 LLM 时，LLM 只能输出：

- NPC 回复文本
- 语气变化建议
- 可选情绪描述

LLM 输出必须经过清洗，不能作为真实游戏裁判。

### 3.3 API Key 不进入前端

任何真实模型 API Key 只能保存在后端环境变量中。

禁止：

- 写入前端 JS
- 写入 HTML
- 提交到 Git
- 放入公开 JSON

### 3.4 本地验证先于线上

所有修改必须先在本地验证：

```bash
bash scripts/verify_slt.sh
```

禁止未经最终确认切换线上 `/play/game`。

### 3.5 不回退到 ST 工作流

本地默认开发禁止依赖：

- `workspace/SillyTavern`
- `?looptrain=game`
- `/api/plugins/looptrain/*`
- ST Extension
- ST Server Plugin

如需查看历史实现，使用 Git 历史。

---

## 4. 当前目录结构

```text
looptrain/
  standalone/
    server.js
    engine.js
    public/
      index.html
      app.js
      style.css
      assets/
    tests/
      smoke_test.js
    README.md

  materials/
    looptrain/       # 可复用剧情、规则、线索、场景、Prompt
    assets/          # 可复用角色立绘和概念图

  docs/
    LT_STANDALONE_ARCHITECTURE.md
    CONTROL_FLOW.md
    SPEC.md
    UI_UX_DESIGN.md
```

---

## 5. 本地命令

启动：

```bash
bash scripts/start_slt.sh
```

验证：

```bash
bash scripts/verify_slt.sh
```

手动访问：

```text
http://127.0.0.1:3030/
```

---

## 6. 修改要求

### 修改 Standalone 前端

文件：

```text
looptrain/standalone/public/app.js
looptrain/standalone/public/style.css
looptrain/standalone/public/index.html
```

要求：

- 手机端优先。
- 不引用 `window.SillyTavern`。
- 不访问 ST 路由。
- 点击 NPC 必须显示立绘和底部浮动对话卡片。
- 修改后必须使用 Playwright 或浏览器实际验证。

### 修改 Standalone 后端

文件：

```text
looptrain/standalone/server.js
looptrain/standalone/engine.js
```

要求：

- Engine 尽量保持纯函数。
- API 只暴露 `/api/*`，不使用 `/api/plugins/*`。
- 不在 Engine 中调用 LLM。
- 不依赖 ST。

### 修改内容数据

优先迁移到：

```text
looptrain/standalone/content/
```

当前过渡期可继续读取：

```text
looptrain/materials/looptrain/
```

---

## 7. 测试与验证

基础验证：

```bash
cd looptrain/standalone
npm run check
npm test
```

完整本地验证：

```bash
bash scripts/verify_slt.sh
```

浏览器 checklist：

1. 打开 `http://127.0.0.1:3030/`。
2. 页面不包含 SillyTavern。
3. `window.SillyTavern === false`。
4. 点击「进入第七节车厢」。
5. 点击顶部 NPC「小宁」。
6. 立绘显示在中下方。
7. 对话卡片显示在底部上方。
8. 输入栏固定在底部。
9. 成功路径可到达「试玩版结束」。
10. 失败路径可进入下一轮。

---

## 8. 下一阶段目标

1. 消除 `app.js` 中重复的 `START_STATE / SCENES / NPC_INFO`。
2. 从 `materials/looptrain/**` 读取结构化内容。
3. 增加 LLM Bridge，但默认保留 Mock。
4. 增加本地 Playwright 回归测试。
5. 准备生产部署，但线上切换必须等待最终确认。
