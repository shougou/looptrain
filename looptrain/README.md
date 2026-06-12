# LoopTrain-ST v0.3.2

LoopTrain-ST 是一个基于 SillyTavern 生态的 AI 互动故事游戏扩展。

当前试玩剧集：

```text
第七节车厢：试玩版
```

## 1. 当前版本说明

当前版本：v0.3.2

本版完成：

- ST 外层 UI Extension。
- ST Server Plugin 控制层。
- Mock Harness。
- 4 个 NPC 角色卡与立绘。
- ST Character Card V2 PNG 元数据。
- 开场背景页。
- 探索 / 对话模式。
- 扮演 / 指令输入页签。
- NPC 对话轮数限制。
- 对话结算。
- 失败结算。
- 成功结算。
- 线索对象增强。
- 当前目标提示。
- 失败后下一轮记忆继承。

尚未完成：

- 真实 LLM 接入。
- 真实 ST 环境截图级验证。
- 角色卡运行时完全动态加载。
- 线索 / 人物 / 状态抽屉。
- Playwright UI 自动化测试。

## 2. 目录结构

```text
st-extension/LoopTrain/
  manifest.json
  index.js
  style.css
  *.png

st-server-plugin/looptrain/
  index.js
  engine.js
  package.json

st-character-cards/
  小宁.STcard.png
  赵乘警.STcard.png
  沈墨寒.STcard.png
  小宁妈妈_隐藏节点.STcard.png

materials/
  st_import/
  looptrain/
  assets/

mock-harness/
  index.html

tests/
  *.js

tools/
  validate_package.py
  validate_st_cards.py

docs/
  *.md

AGENT.md
README.md
```

## 3. 快速体验 Mock Harness

不需要启动 SillyTavern，直接打开：

```text
mock-harness/index.html
```

推荐路径：

```text
开始第 1 轮
→ 扮演模式输入：和小宁对话
→ 温和询问
→ 提到滴答声
→ 指令模式输入：结束对话
→ 检查座位下方
→ 找赵乘警 / 说服赵乘警检查地板
→ 试玩版成功结算
```

也可以测试失败：

```text
指令模式
→ 失败测试
→ 查看失败结算
→ 进入下一轮
```

## 4. 安装到 SillyTavern

### 4.1 安装 UI Extension

将目录：

```text
st-extension/LoopTrain
```

复制到 SillyTavern 的第三方扩展目录。

常见位置类似：

```text
SillyTavern/public/scripts/extensions/third-party/LoopTrain
```

安装后重启或刷新 ST 页面。

成功标志：

```text
页面右下角出现 LoopTrain 按钮
```

### 4.2 安装 Server Plugin

将目录：

```text
st-server-plugin/looptrain
```

复制到 SillyTavern 的插件目录。

常见位置类似：

```text
SillyTavern/plugins/looptrain
```

然后确认 ST 配置中启用 Server Plugin：

```yaml
enableServerPlugins: true
```

重启 SillyTavern。

成功标志：

```text
LoopTrain 覆盖层中状态显示 Server Plugin
```

如果没有启用 Server Plugin，UI Extension 会自动回退到 Local Mock。

## 5. 导入角色卡

可直接导入 PNG 角色卡：

```text
st-character-cards/小宁.STcard.png
st-character-cards/赵乘警.STcard.png
st-character-cards/沈墨寒.STcard.png
st-character-cards/小宁妈妈_隐藏节点.STcard.png
```

这些 PNG 内嵌 Character Card V2 的 `chara` 元数据。

同时保留 JSON sidecar：

```text
materials/st_import/character_cards/*.card.json
```

## 6. 导入世界书

WorldBook：

```text
materials/st_import/world_books/looptrain_trial_character_book.json
```

WorldInfo：

```text
materials/st_import/world_info/looptrain_trial_worldinfo.st.json
```

说明：

当前 v0.3.2 控制层主要读取内置规则与 materials 中的内容，WorldInfo 更多用于后续 LLM 接入时增强背景提示。

## 7. 运行测试

在项目根目录执行：

```bash
node --check st-extension/LoopTrain/index.js
node --check st-server-plugin/looptrain/engine.js

node tests/engine_flow_test.js
node tests/hidden_node_test.js
node tests/all_npc_flow_test.js
node tests/failure_next_loop_test.js
node tests/dialogue_turn_limit_test.js

python tools/validate_package.py
python tools/validate_st_cards.py
```

如果 Python 启动时出现 sandbox spreadsheet warmup warning，但脚本退出码为 0，可以忽略。

## 8. 真实 ST 验证 Checklist

1. 页面右下角出现 `LoopTrain` 按钮。
2. 点击后出现手机端覆盖层。
3. 首次打开显示开场背景。
4. 点击“开始第 1 轮”。
5. 底部出现“扮演 / 指令”页签。
6. 扮演模式输入“和小宁对话”。
7. 小宁立绘出现。
8. 指令模式输入“查看线索”。
9. 指令模式输入“结束对话”。
10. 对话结算卡出现。
11. 失败测试后出现失败结算。
12. 进入下一轮后开场根据记忆变化。
13. 成功路径触发试玩版成功结算页。

## 9. 当前核心路径

```text
和小宁对话
→ 温和询问 / 提到滴答声
→ 获得小宁听见声音、地板下方滴答声
→ 结束对话
→ 检查座位下方
→ 获得声音不来自座位下方
→ 说服赵乘警检查地板
→ 试玩版成功
```

备用路径：

```text
试探沈墨寒
→ 提到连接处 / 08:48 / 口琴声
→ 获得连接处有人停留过
→ 作为说服赵乘警的证据之一
```

## 10. 文档索引

```text
AGENT.md
docs/SPEC.md
docs/PROJECT_DESIGN.md
docs/UI_UX_DESIGN.md
docs/CONTROL_FLOW.md
docs/TECHNICAL_DESIGN.md
docs/ST_TO_LOOPTRAIN_MAPPING.md
docs/V0_3_2_DEVELOPMENT.md
```

## 11. 后续建议

下一步建议不要马上扩大剧情，而是先做：

1. 真实 ST 环境端到端验证。
2. 手机端实机验证。
3. 线索 / 人物 / 状态抽屉。
4. Playwright Mock Harness UI 测试。
5. v0.4 接入真实 LLM。


## v0.4-alpha: ST 原生 LLM 接入验证

v0.4-alpha 新增 `回复：Mock / 回复：ST LLM` 切换。

### 配置 DeepSeek V4 Pro

在 SillyTavern 中：

```text
API Type: Chat Completion
Chat Completion Source: Custom (OpenAI-compatible) 或 DeepSeek
Base URL: https://api.deepseek.com
Model: deepseek-v4-pro
```

然后进入 LoopTrain，点击顶部按钮切换为：

```text
回复：ST LLM
```

此时 NPC 回复会优先通过 ST 当前模型连接生成。LoopTrain 仍然负责 AP、线索、轮数和结算。

### 重要边界

- LoopTrain 不保存 API Key。
- LoopTrain 不重新实现模型连接。
- DeepSeek V4 Pro 由 ST 配置。
- LLM 只负责 NPC 表演。
- 状态裁判仍由 LoopTrain Engine 负责。

### 新增测试

```bash
node tests/llm_bridge_test.js
```


## v0.4.1: Game Shell / Admin Setup

v0.4.1 增加双模式：

```text
Admin Setup：默认模式，显示 SillyTavern，方便设置 DeepSeek、导入角色卡和世界书。
Game Shell：玩家模式，隐藏 ST 背景，只显示 LoopTrain。
```

### 默认配置入口

```text
http://host:8000/
```

默认不自动打开 LoopTrain，避免阻挡 ST 设置。

### 玩家游戏入口

```text
http://host:8000/?looptrain=game
```

或：

```text
http://host:8000/#looptrain
```

### 退出到 ST 设置

LoopTrain 顶部点击：

```text
ST设置
```

即可退出 Game Shell，回到 ST 原生界面。


## v0.4.3: generateRaw LLM Bridge + Asset Path Fix

v0.4.3 修复两个真实 ST 验证问题：

```text
1. 立绘 404：固定 ASSET_BASE 为 /scripts/extensions/third-party/LoopTrain/
2. ST LLM 返回空：LLM Bridge 从 generateQuietPrompt 改为 generateRaw
```

浏览器 Console 可执行：

```js
window.LoopTrain.getDiagnostics()
```

重点检查：

```text
assetBase = /scripts/extensions/third-party/LoopTrain/
portraitNaturalWidth > 0
hasGenerateRaw = true
replySource = st_llm
```
