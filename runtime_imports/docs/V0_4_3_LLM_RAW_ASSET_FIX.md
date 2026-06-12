# LoopTrain-ST v0.4.3 LLM Raw Bridge + Asset Path Fix

## 修复目标

本版针对真实 ST 验证中已经确认的两个根因修复：

1. 立绘请求 `/xiaoning_portrait.png` 导致 404。
2. ST LLM Bridge 使用 `generateQuietPrompt()`，依赖当前 ST chat，Game Shell 下没有 chat_name，导致返回空并回退 Mock。

## 根因 1：立绘 404

旧逻辑依赖：

```js
document.currentScript?.src
```

在 ST 动态加载扩展时不可靠，导致 `ASSET_BASE = ""`，最终请求：

```text
http://127.0.0.1:8000/xiaoning_portrait.png
```

修复为稳定路径：

```js
const ASSET_BASE = '/scripts/extensions/third-party/LoopTrain/';
```

预期：

```js
document.querySelector('.lt-portrait')?.src
```

返回：

```text
http://127.0.0.1:8000/scripts/extensions/third-party/LoopTrain/xiaoning_portrait.png
```

并且：

```js
document.querySelector('.lt-portrait')?.naturalWidth
```

应大于 0。

## 根因 2：generateQuietPrompt 不适合 Game Shell

旧逻辑：

```text
LoopTrain → generateQuietPrompt → 依赖当前 ST chat → no chat_name → 返回空
```

修复为：

```text
LoopTrain → generateRaw → 只复用 ST 当前模型连接 → DeepSeek 返回 NPC 回复
```

SillyTavern 官方文档说明：`generateQuietPrompt()` 用于聊天上下文中的后台生成；`generateRaw()` 用于无聊天上下文的原始生成，适合完全控制 prompt 的场景。

## 新逻辑

```js
const { generateRaw } = SillyTavern.getContext();

const result = await generateRaw({
  systemPrompt,
  prompt
});
```

LoopTrain 自己构造：

- NPC 设定
- 当前场景
- 当前状态
- 已知线索
- 最近对话
- 玩家输入
- 禁止 LLM 裁判的规则

## 新增诊断

浏览器 Console 可执行：

```js
window.LoopTrain.getDiagnostics()
```

返回：

```json
{
  "version": "0.4.3",
  "assetBase": "/scripts/extensions/third-party/LoopTrain/",
  "portraitSrc": "...",
  "portraitNaturalWidth": 0,
  "replySource": "st_llm",
  "hasGenerateRaw": true,
  "hasGenerateQuietPrompt": true
}
```

## 验收标准

### 立绘

```text
进入小宁对话
→ Network 不再出现 /xiaoning_portrait.png 404
→ .lt-portrait naturalWidth > 0
→ 立绘可见
```

### ST LLM

```text
切换 回复：ST LLM
→ 输入一句话
→ 后台出现 DeepSeek request
→ 前端不再出现“ST LLM 返回为空”
→ 不再回退 Mock
→ NPC 回复来自 DeepSeek
```

## 边界声明

我无法在用户本地浏览器中执行真实 SillyTavern UI 测试。本版已基于用户提供的 Console 日志确认根因并修改代码。最终是否通过，需要用户本地验证。
