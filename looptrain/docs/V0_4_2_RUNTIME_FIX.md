# LoopTrain-ST v0.4.2 Runtime Fix

## 修复目标

v0.4.1 在真实 ST 页面验证中暴露两个问题：

1. 访问 `/` 后 LoopTrain 仍自动覆盖 ST，导致无法顺利设置 ST。
2. 点击场景里的 NPC 按钮没有可靠进入对话，因此不会触发立绘浮现。

## 根因

### 问题 1：默认 Admin Setup 未真正生效

v0.4.1 中虽然实现了 Game Shell 函数，但 `init()` 仍沿用旧逻辑，`createUI()` 后没有默认隐藏 `#looptrain-root`。因此 `/` 访问仍会看到 LoopTrain 覆盖层。

另外，`game_shell` 被保存进 ST extensionSettings，导致如果之前进入过 Game Shell，下次访问 `/` 仍可能恢复覆盖状态。

### 问题 2：场景 NPC 按钮没有绑定点击逻辑

场景卡中的 NPC 按钮使用 `.lt-npc-chip`，但点击事件只处理 `.lt-chip`。因此点击“小宁”这类按钮没有触发输入提交，也不会进入 dialogue 状态，自然不会显示立绘。

## 修复内容

### 1. `/` 默认只显示 ST

`createUI()` 时立即给 root 添加：

```js
root.classList.add('lt-hidden')
```

`init()` 中：

```text
如果 URL 是 ?looptrain=game 或 #looptrain → 打开 Game Shell
否则 → 保持 LoopTrain 隐藏，只保留右下角“进入 LoopTrain”
```

### 2. Game Shell 不再持久化

`game_shell` 改为运行时状态，不保存到 extensionSettings / localStorage。

避免：

```text
上次进过 Game Shell → 下次访问 / 仍遮挡 ST
```

### 3. 所有 data-template 按钮都可点击执行

点击事件从：

```js
ev.target.closest('.lt-chip')
```

改为：

```js
ev.target.closest('[data-template]')
```

所以以下按钮都会执行：

```text
和小宁对话
找赵乘警
试探沈墨寒
检查座位下方
底部建议句
```

点击后会立即提交，不再只是填入输入框。

### 4. 立绘显示加强

对话状态下增加：

```text
.lt-has-portrait
```

并强制显示：

```css
.lt-phone.lt-has-portrait .lt-portrait-layer {
  display: block !important;
}
```

## 验收标准

```text
http://127.0.0.1:8000/
  → 不显示 LoopTrain 大面板
  → ST 可以正常设置
  → 右下角只有“进入 LoopTrain”

http://127.0.0.1:8000/?looptrain=game
  → 自动进入 LoopTrain
  → ST 背景隐藏

点击“进入第七节车厢”
  → 进入探索

点击“和小宁对话”
  → 直接进入对话
  → 小宁立绘浮现

点击“找赵乘警”
  → 直接进入对话
  → 赵乘警立绘浮现

点击“试探沈墨寒”
  → 直接进入对话
  → 沈墨寒立绘浮现
```

## 未验证边界

本修复已通过代码级测试和静态校验，但我无法在你的本地浏览器中替你完成真实 ST UI 验证。真实验证仍以你的浏览器结果为准。
