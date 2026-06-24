# LoopTrain Standalone Runtime

LoopTrain 是一个互动叙事解谜游戏项目。

当前本地开发主线已经切换为：

```text
SLT = Standalone LoopTrain
```

也就是说，本地运行和验证不再依赖 SillyTavern。

---

## 当前本地默认入口

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

- `node --check`
- standalone engine smoke tests
- `/api/health`
- `/api/npcs`
- 首页 HTML 不包含 `SillyTavern`

---

## 当前架构

```text
looptrain/
  standalone/       # 当前本地默认运行时
    server.js       # Express 后端，端口 3030
    engine.js       # LoopTrain 裁判引擎
    public/         # 独立游戏前端与资产
    tests/          # standalone smoke tests

  materials/        # 可复用剧情/规则/素材
  docs/             # 架构文档

devlog/             # looptrain.me 开发日志静态站
scripts/            # SLT 本地启动/验证脚本
```

---

## 当前边界

### SLT 已经具备

- 无 `window.SillyTavern`
- 无 ST UI
- 本地 Express 后端
- 复用 `engine.js`
- Mock 模式可玩
- 成功路径可达「试玩版结束」
- 失败路径可进入下一轮

### SLT 尚未具备

- 真实 LLM Bridge
- 后端 `.env` API Key 管理
- 生产进程管理
- 线上 `/play/game` 切换

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

当前线上游戏入口仍处于迁移前状态；本地目标已经切换为 SLT。\n\n直到 SLT 生产部署完成并经确认后，才切换线上 `/play/game` 到 standalone runtime。

---

## Legacy ST 说明

历史上的 LoopTrain-ST 验证包已经不再是本地默认运行目标。

旧 ST 相关内容已作为历史参考/可迁移素材处理，不再作为默认本地工作流。

如需回看旧集成思路，请查看 Git 历史或相关历史文档。

---

## 推荐下一步

1. 增加 LLM Bridge，但默认保留 Mock 模式。
2. 增加 Playwright 本地回归测试。
3. 本地稳定后，再评估线上 `/play/game` 切换。
