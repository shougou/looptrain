---
title: "音效系统第一版方案定稿"
date: "2026-06-13T23:10:00+08:00"
version: "v0.5-audio-core"
status: "planning"
tags:
  - 音效系统
  - 设计说明
  - 版本规划
summary: "确定 LoopTrain 音效系统第一版的边界：不改引擎、不做复杂配乐，先建立 AudioManager、事件映射层、静音开关、音频 manifest 和 6 个占位音效。"
---

## 本次定稿

第一版音效系统不追求“专业配乐”。它只解决一个问题：让 LoopTrain 的关键状态有声音反馈。

当前确定的范围是：

```text
音效系统结构 + 6 个占位音效 + 游戏事件绑定
```

第一版需要让玩家感到：

```text
列车在动。
危险在逼近。
我刚刚发现了线索。
失败是有冲击的。
循环是有记忆的。
```

暂时不做：

```text
复杂配乐
角色主题曲
动态音乐系统
Web Audio API
完整拟音
多轨混音
```

这些能力以后可以做，但不应该进入第一版。

## 架构边界

LoopTrain 当前运行在 SLT（Standalone LoopTrain）里：

```text
looptrain/standalone/
  engine.js          # 游戏裁判引擎
  server.js          # Express API
  public/app.js      # 前端主逻辑
```

音效系统不能破坏现有边界。

最终原则是：

```text
Engine 不知道音效。
AudioManager 不知道剧情。
app.js 里的事件映射层负责翻译。
```

`engine.js` 继续只负责 AP、线索、对话、失败、循环继承等游戏规则。音效不会写进 engine，也不会反过来修改游戏状态。

## 第一版目录

音效作为公开素材，放在现有 assets 体系下：

```text
looptrain/standalone/public/assets/audio/
  manifest.json
  LICENSES.md
  ambience/
    rail_loop_low.mp3
  tension/
    faint_ticking_loop.mp3
  sfx/
    button_tap.wav
    clue_found.wav
  cinematic/
    explosion_muffled.wav
    loop_rewind.wav
```

这样前端路径统一为：

```text
/assets/audio/
```

不再沿用旧 ST extension 路径。

## AudioManager 的职责

第一版新增一个前端音频管理器：

```text
looptrain/standalone/public/audio-manager.js
```

它只负责音频能力：

```text
init(manifestUrl)
unlock()
play(id)
stop(id)
fadeIn(id)
fadeOut(id)
setVolume(bus, value)
setMuted(value)
dispatch(audioEvent)
```

它不负责判断：

```text
AP 是否过低
是否获得线索
是否失败爆炸
是否进入下一轮
是否试玩成功
```

这些都属于游戏语义，不应该进入 AudioManager。

第一版使用 `HTMLAudioElement`。理由很简单：现在只有 6 个音效，只需要播放、循环、淡入淡出和静音。Web Audio API 可以等到需要滤波、动态混音或复杂分层时再引入。

## 事件映射层

声音真正接入游戏的位置在 `app.js` 的 `handleResponse(res, inDialogue)`。

所有关键游戏结果都会经过这里：

```text
res.state
res.dialogue_outcome
res.loop_failure_outcome
res.trial_success
res.memory_node
```

所以第一版增加一个轻量映射函数：

```js
function deriveAudioEvents(prevState, nextState, res) {
  const events = [];

  if (knownCluesIncreased(prevState, nextState)) {
    events.push({ action: 'play', id: 'clue_found' });
  }

  if (crossedLowApThreshold(prevState, nextState)) {
    events.push({ action: 'fadeIn', id: 'faint_ticking_loop' });
  }

  if (res.loop_failure_outcome) {
    events.push({ action: 'fadeOut', id: 'faint_ticking_loop' });
    events.push({ action: 'play', id: 'explosion_muffled' });
  }

  if (res.trial_success) {
    events.push({ action: 'fadeOut', id: 'faint_ticking_loop' });
  }

  return events;
}
```

这个函数的职责只有一个：

```text
Game Event → Audio Event
```

第一版可以先放在 `app.js` 里。等事件变多，再拆成独立的 `audio-events.js`。

## 第一批音效

第一批最少只需要 6 个文件：

| 文件 | 用途 |
|---|---|
| `rail_loop_low.mp3` | 进入游戏后淡入的列车环境底噪 |
| `faint_ticking_loop.mp3` | AP 过低或接近关键线索时出现的滴答声 |
| `button_tap.wav` | 普通 UI 点击反馈 |
| `clue_found.wav` | 获得线索时的提示音 |
| `explosion_muffled.wav` | 失败爆炸时的闷爆冲击 |
| `loop_rewind.wav` | 点击进入下一轮时的循环倒带声 |

素材来源优先：

```text
Pixabay：列车环境、滴答声
Mixkit：按钮、提示、爆炸、倒带
```

暂不使用 BBC Sound Effects、ZapSplat、Freesound 作为第一批默认素材来源。原因不是质量问题，而是授权复杂度。第一版优先使用授权清楚、下载简单、最好不要求署名的素材。

无论是否要求署名，都必须记录来源：

```text
public/assets/audio/LICENSES.md
```

记录字段：

```text
文件名
来源站点
原始标题
原始作者
原始 URL
下载日期
许可证
是否需要署名
```

## 触发规则

第一版事件表如下：

| 游戏 / 界面事件 | 音频事件 | 说明 |
|---|---|---|
| 点击「进入第七节车厢」 | `unlock()` + `fadeIn('rail_loop_low')` | 不自动播放，必须由用户点击解锁 |
| 普通 UI 点击 | `play('button_tap')` | 排除开场、静音、下一轮等关键按钮 |
| 获得新线索 | `play('clue_found')` | 通过 `known_clues` 增长判断 |
| AP 从 >3 到 <=3 | `fadeIn('faint_ticking_loop')` | 时间压力进入 |
| AP 恢复到 >3 | `fadeOut('faint_ticking_loop')` | 下一轮或状态恢复后降低压力 |
| 失败结算 | `fadeOut('faint_ticking_loop')` + `play('explosion_muffled')` | 失败只播爆炸，不提前播倒带 |
| 点击进入下一轮 | `play('loop_rewind')` | 玩家确认循环重启时触发 |
| 试玩成功 | `fadeOut('faint_ticking_loop')` | 成功后停止压力音 |

失败和循环重启分开处理。

```text
失败发生 → explosion_muffled
玩家点击进入下一轮 → loop_rewind
```

这样声音和交互语义一致。

## 静音与解锁

公网游戏必须有声音开关。

按钮放在 topbar：

```text
🔊 / 🔇
```

状态独立保存：

```text
localStorage.looptrain.audio.muted = true / false
```

不把音频偏好塞进 `looptrain.standalone.v1`，因为那是游戏进度。音频偏好是用户设置，应该独立保存。

音频不能自动播放。第一版只在用户点击「进入第七节车厢」之后调用：

```text
unlockAudio()
```

然后再淡入列车环境音。

## 加载失败策略

音频失败不能影响游戏流程。

第一版规则：

```text
manifest 加载失败 → AudioManager disabled
单个 track 加载失败 → 跳过该 track
play 失败 → console.warn，不阻断游戏
```

这是试玩版，不应该因为一个音效 404 让玩家无法继续游戏。

## 后续实现功能点

### v0.5-audio-core

目标：先把骨架接上。

```text
1. 新增 public/assets/audio/manifest.json
2. 新增 public/audio-manager.js
3. index.html 引入 audio-manager.js
4. topbar 增加声音开关
5. 静音状态写入 localStorage.looptrain.audio.muted
6. 点击「进入第七节车厢」后 unlock audio
7. rail_loop_low 淡入
8. 支持 play / loop / fadeIn / fadeOut / mute
9. 音频加载失败时静默降级
```

### v0.5.1-audio-events

目标：把声音绑定到游戏事件。

```text
1. 增加 deriveAudioEvents(prevState, nextState, res)
2. known_clues 增长 → clue_found
3. AP <= 3 → faint_ticking_loop 淡入
4. failure → explosion_muffled
5. nextLoop → loop_rewind
6. trial_success → tension fadeOut
7. 普通 UI 操作 → button_tap
```

### v0.5.2-audio-polish

目标：调体验，而不是加复杂度。

```text
1. 调整各 bus 默认音量
2. 手机端真机测试音量和解锁行为
3. 检查 rail_loop_low 与 faint_ticking_loop 的循环衔接
4. 根据具体线索触发 ticking，而不只依赖 AP
5. 增加 memory_flash 或 ear_ringing 等第二批音效
6. 完善 LICENSES.md，并同步到素材记录页面
```

## 当前结论

第一版音效系统的目标不是“听起来像完整商业游戏”。

它只需要做到：结构是对的，事件是准的，声音不烦人，后续可以替换素材。

只要这四点成立，LoopTrain 就能从“完全无声的文字试玩”进入“有时间压力和失败冲击的互动叙事试玩”。
