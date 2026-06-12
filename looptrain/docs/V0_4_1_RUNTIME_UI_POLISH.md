# LoopTrain-ST v0.4.1 Runtime UI Polish

## 版本目标

v0.4.1 解决 v0.4-alpha 真实 ST 验证中暴露的两个运行形态问题：

1. LoopTrain 默认覆盖 ST，导致无法先配置 ST / DeepSeek。
2. 对话立绘在部分环境中没有可靠浮现。

本版明确采用双模式：

```text
Admin Setup：显示 ST，配置模型、角色卡、世界书。
Game Shell：隐藏 ST，只显示 LoopTrain 游戏界面。
```

## 入口规则

### 默认入口

普通访问 ST：

```text
http://host:8000/
```

默认不自动打开 LoopTrain 覆盖层，避免阻挡 ST 设置。

页面右下角会显示：

```text
进入 LoopTrain
```

点击后进入 LoopTrain。

### 游戏入口

玩家试玩可以使用：

```text
http://host:8000/?looptrain=game
```

或：

```text
http://host:8000/#looptrain
```

此时自动进入 Game Shell，隐藏 ST 背景，只显示 LoopTrain。

## Game Shell

Game Shell 会给 body 添加：

```js
document.body.classList.add("lt-game-shell")
```

并让 `#looptrain-root` 占据最高层级。

注意：ST DOM 可能随版本变化，CSS 隐藏策略采用保守兜底方式：

```css
body.lt-game-shell > *:not(#looptrain-root):not(#looptrain-show-btn) {
  visibility: hidden !important;
}
```

## Admin Setup

LoopTrain 顶部新增：

```text
ST设置
```

点击后退出 Game Shell，隐藏 LoopTrain，回到 ST 原生界面，方便：

- 设置 DeepSeek Key。
- 导入角色卡。
- 导入世界书。
- 测试普通 ST 聊天。
- 检查 Extension / Plugin。

## 开场体验

开场页改为更短、更明确的四段式：

```text
08:45：你在夜行列车第七节车厢醒来。
身份：普通乘客只是伪装，你携带绝密情报前往江城。
接头：代号“扣子”的同志会在列车上出现。
危机：09:00 前，列车将在北江铁桥前爆炸。
```

按钮改为：

```text
进入第七节车厢
```

目标是快速把玩家拉入场景，而不是让玩家先读长说明。

## 立绘浮现修正

本版强化：

- 对话模式下 `lt-has-portrait` class。
- `portraitImg.onerror` 兜底。
- 立绘 `src` 切换缓存。
- 对话状态和立绘显示状态分离。
- CSS 同时支持 `.lt-dialogue` 和 `.lt-has-portrait`。

验证要求：

```text
进入小宁对话 → 小宁立绘浮现
进入赵乘警对话 → 赵乘警立绘浮现
进入沈墨寒对话 → 沈墨寒立绘浮现
退出对话 → 立绘隐藏
```

## 边界

本版没有修改：

- ST 模型配置方式。
- DeepSeek Key 保存方式。
- Engine 线索规则。
- LLM Bridge 逻辑。
- Server Plugin API 主结构。

本版主要是运行形态和 UI 稳定性修正。
