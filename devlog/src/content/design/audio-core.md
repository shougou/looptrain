---
title: "音效系统第一版开发规格"
date: "2026-06-15T20:05:00+08:00"
status: "planned"
version: "v0.5-audio-core"
lastVerified: "2026-06-15"
scope: "audio-system"
spoilerLevel: "none"
tags:
  - 音效系统
  - 开发规格
  - 设计说明
summary: "LoopTrain 音效系统第一版开发规格：AudioManager、事件映射层、静音开关、音频 manifest、占位音效和验收标准。"
sourceDraft: "devlog/src/content/devlog/2026-06-13-audio-core-design.md"
pinned: true
---

## 文档目的

本文是 LoopTrain 音效系统第一版的开发规格。它从 `2026-06-13-audio-core-design.md` 中提取已经确认的设计边界，转化为后续实现可以直接使用的工程契约。

本文不替代开发日志。开发日志记录“为什么这样决定”；本文记录“实现时必须满足什么”。

## 能力定义

`v0.5-audio-core` 交付后，玩家在 SLT 试玩版中应获得基础声音反馈：进入列车后听到环境底噪，发现线索时有提示，AP 过低时出现时间压力，失败和进入下一轮时有明确的听觉转场。

该能力必须保持游戏规则边界不变：声音只响应游戏结果，不参与游戏裁判。

## 范围

第一版范围固定为：

```text
音效系统结构 + 音频 manifest + AudioManager + 静音开关 + 6 个占位音效 + 事件映射层
```

### 必须包含

1. `public/assets/audio/manifest.json`。
2. `public/assets/audio/LICENSES.md`。
3. `public/audio-manager.js`。
4. `index.html` 引入 `audio-manager.js`。
5. 游戏 UI 提供声音开关。
6. 用户首次点击「进入第七节车厢」后解锁音频。
7. 列车环境音 `rail_loop_low` 淡入。
8. 支持 `play / stop / fadeIn / fadeOut / setVolume / setMuted / dispatch`。
9. 音频加载或播放失败时静默降级，不阻断游戏。
10. 游戏结果映射为音频事件。

### 不做

第一版明确不做：

```text
复杂配乐
角色主题曲
动态音乐系统
Web Audio API
完整拟音
多轨混音
基于剧情语义的复杂音频推理
音频驱动游戏状态变化
```

这些能力可以在后续版本重新评估，但不能进入 `v0.5-audio-core` 的验收范围。

## 架构边界

当前 SLT 运行时结构为：

```text
looptrain/standalone/
  engine.js          # 游戏裁判引擎
  server.js          # Express API
  public/app.js      # 前端主逻辑
```

音效系统必须遵守以下边界：

```text
Engine 不知道音效。
AudioManager 不知道剧情。
app.js 的事件映射层负责翻译。
```

### Engine 边界

`engine.js` 继续只负责：

- AP
- 线索
- 对话
- 失败
- 成功
- 循环继承
- 当前状态归一化

音效实现不得修改 `engine.js` 的裁判职责。除非后续出现必须暴露状态字段的明确需求，否则第一版不改 Engine。

### AudioManager 边界

`AudioManager` 只负责浏览器音频能力，不判断游戏语义。

它不能直接判断：

- AP 是否过低
- 是否获得线索
- 是否失败爆炸
- 是否进入下一轮
- 是否试玩成功
- 哪个 NPC 或哪个剧情节点更重要

### 事件映射边界

`app.js` 负责把游戏响应转为音频事件。第一版可以先把映射函数放在 `app.js`，当事件数量增长后再拆为：

```text
looptrain/standalone/public/audio-events.js
```

## 文件结构

新增公开音频素材目录：

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

新增前端管理器：

```text
looptrain/standalone/public/audio-manager.js
```

前端访问路径统一为：

```text
/assets/audio/
```

不得沿用旧 ST extension 音频路径。旧 ST 路径只作为历史资料，不作为当前实现依据。

## manifest 规格

`manifest.json` 需要描述音频总线和 track 元信息。

第一版建议结构：

```json
{
  "version": "0.1",
  "buses": {
    "master": { "volume": 0.75 },
    "ambience": { "volume": 0.35 },
    "sfx": { "volume": 0.7 },
    "tension": { "volume": 0.25 },
    "cinematic": { "volume": 0.8 }
  },
  "tracks": {
    "rail_loop_low": {
      "file": "ambience/rail_loop_low.mp3",
      "bus": "ambience",
      "loop": true,
      "fadeInMs": 1800,
      "fadeOutMs": 1200
    },
    "faint_ticking_loop": {
      "file": "tension/faint_ticking_loop.mp3",
      "bus": "tension",
      "loop": true,
      "fadeInMs": 1200,
      "fadeOutMs": 800
    },
    "button_tap": {
      "file": "sfx/button_tap.wav",
      "bus": "sfx",
      "loop": false
    },
    "clue_found": {
      "file": "sfx/clue_found.wav",
      "bus": "sfx",
      "loop": false
    },
    "explosion_muffled": {
      "file": "cinematic/explosion_muffled.wav",
      "bus": "cinematic",
      "loop": false
    },
    "loop_rewind": {
      "file": "cinematic/loop_rewind.wav",
      "bus": "cinematic",
      "loop": false
    }
  }
}
```

实现必须容忍 manifest 中某个 track 缺失或加载失败。失败策略见“降级策略”。

## LICENSES 规格

所有音频素材，无论是否要求署名，都必须记录来源。

`LICENSES.md` 至少记录：

| 字段 | 说明 |
|---|---|
| 文件名 | 本地文件名 |
| 来源站点 | 例如 Pixabay / Mixkit |
| 原始标题 | 下载页面标题 |
| 原始作者 | 作者或上传者 |
| 原始 URL | 下载来源页面 |
| 下载日期 | `YYYY-MM-DD` |
| 许可证 | 来源站标注的授权 |
| 是否需要署名 | yes / no / unknown |

第一版素材来源优先：

```text
Pixabay：列车环境、滴答声
Mixkit：按钮、提示、爆炸、倒带
```

暂不把 BBC Sound Effects、ZapSplat、Freesound 作为第一批默认素材来源，原因是授权和署名规则更复杂。

## AudioManager 接口

`audio-manager.js` 需要暴露一个可由 `app.js` 使用的音频管理对象。

建议接口：

```js
AudioManager.init(manifestUrl)
AudioManager.unlock()
AudioManager.play(id)
AudioManager.stop(id)
AudioManager.fadeIn(id)
AudioManager.fadeOut(id)
AudioManager.setVolume(bus, value)
AudioManager.setMuted(value)
AudioManager.dispatch(audioEvent)
```

### init(manifestUrl)

职责：

- 加载 manifest。
- 创建 track registry。
- 创建 `HTMLAudioElement`。
- 应用 bus 默认音量。
- 读取静音偏好。
- 如果 manifest 加载失败，将 AudioManager 标记为 disabled。

约束：

- 不抛出阻断游戏流程的错误。
- 不自动播放任何音频。
- 不要求用户在页面加载阶段授权播放。

### unlock()

职责：

- 在用户手势后解锁浏览器音频播放能力。
- 只在玩家点击「进入第七节车厢」之后调用。
- 解锁成功后允许环境音淡入。

约束：

- 不在页面加载时调用。
- 不在非用户手势回调中调用。
- 解锁失败时只降级，不阻断游戏。

### play(id)

职责：播放指定一次性音效。

约束：

- 对 `loop: false` 的 track，应从开头播放。
- 如果 id 不存在、track 未加载或浏览器拒绝播放，只 `console.warn`。
- 静音时不播放，或播放前直接返回。

### stop(id)

职责：停止指定 track。

约束：

- 对不存在的 id 安全返回。
- 停止后可重置播放位置。

### fadeIn(id) / fadeOut(id)

职责：对循环或长音频做渐入渐出。

约束：

- 第一版用简单定时器或 `requestAnimationFrame` 均可。
- 同一个 track 重复 fade 时不能产生多个互相竞争的计时器。
- `fadeOut` 完成后应暂停 track。

### setVolume(bus, value)

职责：设置 bus 音量。

约束：

- `value` clamp 到 `0..1`。
- 总音量 = `master.volume * bus.volume * track.volume`。
- 第一版可以不提供 UI 细分 bus 音量，但内部模型需要支持。

### setMuted(value)

职责：设置全局静音状态。

约束：

- 写入 `localStorage.looptrain.audio.muted`。
- 静音时当前循环音应停止或音量归零。
- 取消静音不应自动恢复所有一次性音效；只允许恢复当前应该存在的环境/压力循环音。

### dispatch(audioEvent)

职责：执行事件映射层产生的音频事件。

建议事件结构：

```js
{ action: 'play', id: 'clue_found' }
{ action: 'fadeIn', id: 'faint_ticking_loop' }
{ action: 'fadeOut', id: 'faint_ticking_loop' }
{ action: 'setMuted', value: true }
```

## 状态与持久化

音频偏好独立于游戏进度保存。

```text
localStorage.looptrain.audio.muted = true / false
```

不得把音频偏好写入：

```text
looptrain.standalone.v1
```

原因：`looptrain.standalone.v1` 是游戏进度，音频偏好是用户设置。两者生命周期不同。

## UI 要求

### 声音开关

公网游戏必须提供声音开关。

第一版位置：游戏 topbar。

显示形态：

```text
🔊 / 🔇
```

实现要求：

- 点击后切换 muted 状态。
- 状态写入 `localStorage.looptrain.audio.muted`。
- 刷新页面后保持用户选择。
- 不影响游戏状态存档。
- 按钮必须可键盘访问。
- 按钮需要有可读 `aria-label`，例如“关闭声音”或“开启声音”。

### 自动播放限制

任何音频不得在页面加载时自动播放。

允许的首次播放流程：

```text
用户点击「进入第七节车厢」
→ AudioManager.unlock()
→ AudioManager.fadeIn('rail_loop_low')
```

## 事件映射层

声音接入游戏的位置为 `app.js` 的游戏响应处理流程。

源设计建议位置：

```text
handleResponse(res, inDialogue)
```

关键输入：

```text
prevState
nextState / res.state
res.dialogue_outcome
res.loop_failure_outcome
res.trial_success
res.memory_node
```

建议函数：

```js
function deriveAudioEvents(prevState, nextState, res) {
  const events = [];

  if (knownCluesIncreased(prevState, nextState)) {
    events.push({ action: 'play', id: 'clue_found' });
  }

  if (crossedLowApThreshold(prevState, nextState)) {
    events.push({ action: 'fadeIn', id: 'faint_ticking_loop' });
  }

  if (recoveredFromLowAp(prevState, nextState)) {
    events.push({ action: 'fadeOut', id: 'faint_ticking_loop' });
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

该函数职责只有：

```text
Game Event → Audio Event
```

它不能修改状态，不能调用 API，不能决定游戏成功失败。

## 触发规则

第一版事件表：

| 游戏 / 界面事件 | 音频事件 | 说明 |
|---|---|---|
| 点击「进入第七节车厢」 | `unlock()` + `fadeIn('rail_loop_low')` | 必须由用户点击解锁 |
| 普通 UI 点击 | `play('button_tap')` | 排除开场、静音、下一轮等关键按钮 |
| 获得新线索 | `play('clue_found')` | 通过 `known_clues` 增长判断 |
| AP 从 `> 3` 到 `<= 3` | `fadeIn('faint_ticking_loop')` | 时间压力进入 |
| AP 从 `<= 3` 回到 `> 3` | `fadeOut('faint_ticking_loop')` | 下一轮或状态恢复后降低压力 |
| 失败结算 | `fadeOut('faint_ticking_loop')` + `play('explosion_muffled')` | 失败只播爆炸，不提前播倒带 |
| 点击进入下一轮 | `play('loop_rewind')` | 玩家确认循环重启时触发 |
| 试玩成功 | `fadeOut('faint_ticking_loop')` | 成功后停止压力音 |

失败和循环重启必须分开处理：

```text
失败发生 → explosion_muffled
玩家点击进入下一轮 → loop_rewind
```

不要在失败瞬间自动播放倒带声。

## 6 个第一批音效

| ID | 文件 | Bus | 用途 |
|---|---|---|---|
| `rail_loop_low` | `ambience/rail_loop_low.mp3` | `ambience` | 进入游戏后淡入的列车环境底噪 |
| `faint_ticking_loop` | `tension/faint_ticking_loop.mp3` | `tension` | AP 过低或接近关键线索时出现的滴答声 |
| `button_tap` | `sfx/button_tap.wav` | `sfx` | 普通 UI 点击反馈 |
| `clue_found` | `sfx/clue_found.wav` | `sfx` | 获得线索时的提示音 |
| `explosion_muffled` | `cinematic/explosion_muffled.wav` | `cinematic` | 失败爆炸时的闷爆冲击 |
| `loop_rewind` | `cinematic/loop_rewind.wav` | `cinematic` | 点击进入下一轮时的循环倒带声 |

素材筛选标准：

- 授权清楚。
- 音量不刺耳。
- 风格克制，不卡通化。
- 列车环境声不应包含现代广播、人声或地铁提示音。
- 可循环素材优先。
- 后续可被替换，不把素材质量作为架构阻塞项。

## 降级策略

音频失败不能影响游戏流程。

第一版规则：

| 失败场景 | 行为 |
|---|---|
| manifest 加载失败 | `AudioManager.disabled = true`，游戏继续 |
| 单个 track 加载失败 | 跳过该 track，其他 track 可用 |
| play 被浏览器拒绝 | `console.warn`，不抛出阻断错误 |
| localStorage 不可用 | 使用内存状态，刷新后不保证保存 |
| 音频文件 404 | 记录 warning，后续 dispatch 该 track 时安全返回 |

禁止出现：

```text
音效失败 → 游戏无法开始
音效失败 → API 请求失败
音效失败 → 状态丢失
音效失败 → 页面白屏
```

## 版本拆分

### v0.5-audio-core

目标：先把骨架接上。

交付项：

1. 新增 `public/assets/audio/manifest.json`。
2. 新增 `public/assets/audio/LICENSES.md`。
3. 新增 `public/audio-manager.js`。
4. `index.html` 引入 `audio-manager.js`。
5. topbar 增加声音开关。
6. 静音状态写入 `localStorage.looptrain.audio.muted`。
7. 点击「进入第七节车厢」后 `unlock()`。
8. `rail_loop_low` 淡入。
9. 支持 `play / stop / fadeIn / fadeOut / setVolume / setMuted / dispatch`。
10. 音频加载失败时静默降级。

### v0.5.1-audio-events

目标：把声音绑定到游戏事件。

交付项：

1. 增加 `deriveAudioEvents(prevState, nextState, res)`。
2. `known_clues` 增长 → `clue_found`。
3. AP `<= 3` → `faint_ticking_loop` 淡入。
4. AP 恢复 → `faint_ticking_loop` 淡出。
5. failure → `explosion_muffled`。
6. next loop click → `loop_rewind`。
7. trial success → tension fadeOut。
8. 普通 UI 操作 → `button_tap`。

### v0.5.2-audio-polish

目标：调体验，而不是加复杂度。

交付项：

1. 调整各 bus 默认音量。
2. 手机端真机测试音量和解锁行为。
3. 检查 `rail_loop_low` 与 `faint_ticking_loop` 的循环衔接。
4. 根据具体线索触发 ticking，而不只依赖 AP。
5. 评估第二批音效，例如 `memory_flash` 或 `ear_ringing`。
6. 完善 `LICENSES.md`，并同步到素材记录页面。

## 验收标准

### 功能验收

1. 页面加载后不会自动播放任何声音。
2. 点击「进入第七节车厢」后，音频被解锁，`rail_loop_low` 淡入。
3. 点击普通 UI 控件时播放 `button_tap`。
4. 获得新线索时播放 `clue_found`。
5. AP 首次从 `> 3` 进入 `<= 3` 时淡入 `faint_ticking_loop`。
6. AP 恢复到 `> 3` 或进入成功/失败结算时淡出 `faint_ticking_loop`。
7. 失败结算播放 `explosion_muffled`。
8. 玩家点击进入下一轮时播放 `loop_rewind`。
9. 声音开关能静音/取消静音，并在刷新后保持。
10. 音频文件缺失时游戏仍可完成试玩流程。

### 架构验收

1. `engine.js` 不包含音频相关逻辑。
2. `AudioManager` 不包含剧情判断。
3. 游戏事件到音频事件的转换集中在映射层。
4. 音频偏好不写入游戏进度存档。
5. manifest 可以替换素材而不改业务代码。

### 文档验收

1. `LICENSES.md` 包含 6 个第一批素材的来源记录。
2. manifest 中的每个 track 在 `LICENSES.md` 中都有对应条目。
3. 如果素材为占位素材，需要明确标记可替换。

## 测试计划

### 静态检查

```bash
node --check looptrain/standalone/public/audio-manager.js
python3 scripts/check_docs_governance.py
```

如果 `audio-manager.js` 被拆为 ES module 或普通 script，应根据实际加载方式补充语法检查命令。

### 手动浏览器测试

1. 打开本地 SLT 首页。
2. 刷新页面，确认无自动播放声音。
3. 点击「进入第七节车厢」，确认环境音淡入。
4. 切换静音，刷新页面，确认静音状态保持。
5. 触发获得线索，确认提示音播放。
6. 将 AP 降到 `<= 3`，确认滴答声淡入。
7. 触发失败，确认滴答声淡出并播放闷爆声。
8. 点击进入下一轮，确认倒带声播放。
9. 删除或临时改名一个音频文件，确认游戏流程不被阻断。

### 自动化测试建议

第一版如果暂不引入浏览器音频断言，也至少应覆盖：

1. `deriveAudioEvents()` 的纯函数单元测试。
2. `knownCluesIncreased()` 的边界测试。
3. AP 阈值跨越测试：`4 → 3` 触发，`3 → 2` 不重复触发。
4. failure / next loop 分离测试。
5. muted localStorage key 读写测试。

## 安全与隐私

音频系统不得引入：

- 用户上传音频。
- 外部运行时音频 URL 注入。
- API Key 或第三方密钥。
- 远端追踪脚本。
- 需要登录或个人信息的音频服务。

音频 manifest 第一版应只引用本地 `/assets/audio/` 下的静态文件。

## 实现顺序建议

推荐按以下顺序开发：

1. 创建音频目录、manifest、LICENSES 占位记录。
2. 实现 `audio-manager.js` 的 disabled-safe 骨架。
3. 在 `index.html` 引入脚本。
4. 在 `app.js` 初始化 AudioManager。
5. 添加 topbar 声音开关与 localStorage 持久化。
6. 接入开场 unlock + rail loop。
7. 添加 `deriveAudioEvents()`。
8. 接入线索、AP、失败、下一轮、成功事件。
9. 做手机端和桌面端手动验证。
10. 根据体验调默认音量与 fade 时间。

## 开放问题

以下问题不阻塞第一版，但应在 `v0.5.2-audio-polish` 前确认：

1. 是否需要把 `deriveAudioEvents()` 从 `app.js` 拆到 `audio-events.js`。
2. 是否需要独立的音量设置 UI，还是第一版只保留静音开关。
3. `faint_ticking_loop` 是否只由 AP 阈值触发，还是也由特定线索触发。
4. 是否需要第二批音效 `memory_flash` / `ear_ringing`。
5. 是否需要在 devlog 中公开音频素材授权页面。

## 完成定义

本规格完成实现后，LoopTrain 应从“完全无声的文字试玩”进入“有基础时间压力、线索反馈、失败冲击和循环转场的互动叙事试玩”。

完成不意味着音效素材最终定稿。完成意味着：

```text
结构正确
事件准确
声音不干扰
失败可降级
后续可替换素材
```
