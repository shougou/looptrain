# LoopTrain 音效素材授权记录

> 本文记录所有第一版音频素材的来源、作者与授权信息。  
> 格式遵循 `devlog/src/content/design/audio-core.md` LICENSES 规格。

## 授权简述

| 来源 | 许可证 | 署名 | 商用 |
|---|---|---|---|
| Mixkit | [Mixkit SFX Free License](https://mixkit.co/license/#sfxFree) | 不需要（可自愿署名） | ✅ 允许 |
| BigSoundBank | [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) | 无需署名 | ✅ 允许 |

---

## 素材清单

### 1. rail_loop_low.mp3

| 字段 | 值 |
|---|---|
| **本地文件名** | `ambience/rail_loop_low.mp3` |
| **来源站点** | Mixkit |
| **原始标题** | Old train departure |
| **原始作者** | Mixkit (Envato) |
| **原始页面** | <https://mixkit.co/free-sound-effects/old-train-departure/> |
| **下载日期** | 2026-06-15 |
| **许可证** | Mixkit Sound Effects Free License |
| **是否需要署名** | 否 |
| **备注** | 时长 1:47；Tag: Ambience, Train；CDN preview download |

### 2. faint_ticking_loop.mp3

| 字段 | 值 |
|---|---|
| **本地文件名** | `tension/faint_ticking_loop.mp3` |
| **来源站点** | BigSoundBank |
| **原始标题** | Tic Tac Mechanical Alarm Clock #3 |
| **原始作者** | Joseph SARDIN |
| **原始页面** | <https://bigsoundbank.com/tic-tac-mechanical-alarm-clock-3-s2656.html> |
| **下载日期** | 2026-06-15 |
| **许可证** | CC0 1.0 Universal (Public Domain) |
| **是否需要署名** | 否 |
| **备注** | 时长 0:20；作者标注 easy to loop；可用 EQ/音高自由处理 |

### 3. button_tap.wav

| 字段 | 值 |
|---|---|
| **本地文件名** | `sfx/button_tap.wav` |
| **来源站点** | Mixkit |
| **原始标题** | Select click |
| **原始作者** | Mixkit (Envato) |
| **原始页面** | <https://mixkit.co/free-sound-effects/interface/> <br> <https://mixkit.co/free-sound-effects/download/1109/> |
| **下载日期** | 2026-06-15 |
| **许可证** | Mixkit Sound Effects Free License |
| **是否需要署名** | 否 |
| **备注** | Tag: Interface, Click；当前为 MP3 编码；后续可替换为 WAV |

### 4. clue_found.wav

| 字段 | 值 |
|---|---|
| **本地文件名** | `sfx/clue_found.wav` |
| **来源站点** | Mixkit |
| **原始标题** | Interface hint notification |
| **原始作者** | Mixkit (Envato) |
| **原始页面** | <https://mixkit.co/free-sound-effects/sci-fi/> <br> <https://mixkit.co/free-sound-effects/download/911/> |
| **下载日期** | 2026-06-15 |
| **许可证** | Mixkit Sound Effects Free License |
| **是否需要署名** | 否 |
| **备注** | Tag: Notification, Sci-Fi, High Tech；当前为 MP3 编码 |

### 5. explosion_muffled.wav

| 字段 | 值 |
|---|---|
| **本地文件名** | `cinematic/explosion_muffled.wav` |
| **来源站点** | Mixkit |
| **原始标题** | Underground explosion impact echo |
| **原始作者** | Mixkit (Envato) |
| **原始页面** | <https://mixkit.co/free-sound-effects/explosion/> <br> <https://mixkit.co/free-sound-effects/download/1704/> |
| **下载日期** | 2026-06-15 |
| **许可证** | Mixkit Sound Effects Free License |
| **是否需要署名** | 否 |
| **备注** | Tag: Explosion, Impact, Cinematic, Crash；地下/回声感适合闷爆；当前为 MP3 编码 |

### 6. loop_rewind.wav

| 字段 | 值 |
|---|---|
| **本地文件名** | `cinematic/loop_rewind.wav` |
| **来源站点** | Mixkit |
| **原始标题** | Sci fi rewind woosh |
| **原始作者** | Mixkit (Envato) |
| **原始页面** | <https://mixkit.co/free-sound-effects/rewind/> <br> <https://mixkit.co/free-sound-effects/download/1094/> |
| **下载日期** | 2026-06-15 |
| **许可证** | Mixkit Sound Effects Free License |
| **是否需要署名** | 否 |
| **备注** | Tag: Woosh, Rewind；当前为 MP3 编码 |

---

## 注意事项

1. `button_tap.wav`、`clue_found.wav`、`explosion_muffled.wav`、`loop_rewind.wav` 当前下载的是 Mixkit CDN 预览版本 (MP3 编码)，扩展名保留 `.wav` 与 audio-core spec 目标路径一致。浏览器 `HTMLAudioElement` 通过 content-type 检测播放，不依赖扩展名。后续正式素材到位后可替换为真正的 WAV。
2. 所有素材均为可商用、免署名的授权。若未来使用要求署名的素材，需在本文件更新署名要求并将署名信息同步到游戏内或站点素材页面。
3. 素材清单应与 `manifest.json` 同步维护。
