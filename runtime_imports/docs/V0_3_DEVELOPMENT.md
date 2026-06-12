# LoopTrain-ST v0.3 开发说明

v0.3 的目标是：在不修改 SillyTavern 核心代码的前提下，让 LoopTrain 作为外层 UI Extension + Server Plugin 运行。

## 本版新增

- 四个 NPC 立绘全部接入前景浮层：小宁、赵乘警、沈墨寒、小宁妈妈（隐藏记忆节点）。
- UI Extension 优先调用 `/api/plugins/looptrain/*`，失败时自动回退本地 Mock 引擎。
- Server Plugin 补齐 `/suggestions`、`/npcs`，并完善三 NPC 试玩流程。
- 小宁妈妈隐藏节点会以“记忆立绘”方式短暂覆盖出现，不推进主线。
- 失败结算卡、下一轮记忆继承、NG 背景已接入前端流程。
- 增加所有 NPC 分支测试和失败继承测试。

## 安装到 ST

1. 将 `st-extension/LoopTrain` 复制到 SillyTavern 的扩展目录。
2. 将 `st-server-plugin/looptrain` 复制到 SillyTavern 的 `plugins/looptrain`。
3. 在 `config.yaml` 中启用：

```yaml
enableServerPlugins: true
```

4. 重启 SillyTavern。
5. 页面右下角出现 `LoopTrain` 按钮后打开覆盖层。

## 试玩验证路径

```text
和小宁对话
→ 温和询问 / 提到滴答声
→ 结束对话，获得线索
→ 试探沈墨寒，追问连接处 / 口琴声
→ 结束对话，获得第二证据
→ 说服赵乘警检查地板
→ 试玩版成功
```

失败验证：点击“失败测试”，确认出现失败结算卡，并可进入下一轮。

## 设计边界

v0.3 仍然不接真实 LLM。NPC 回复仍由强控制规则/Mock 引擎生成。v0.4 再接 ST 当前模型调用，让 LLM 只负责 NPC 表演，不负责线索、AP、成功失败裁判。
