# Release Note: 新手阶段渐进解锁 UI 优化

**版本**: v0.11.0-newbie-ui-unlock
版本级别: [x] minor
**日期**: 2026-06-25
**状态**: Released
**分支**: main

---

## 变更摘要

实现 UIStage 状态机驱动的渐进解锁 UI，降低新手认知负荷，优化许知微引导体验。

---

## 新增功能

### 1. UIStage 渐进解锁系统
- 7 阶段状态机：`intro` → `first_observation` → `first_dialogue` → `loop_memory_intro` → `caseboard_intro` → `contradiction_intro` → `normal_play`
- 每阶段控制不同 UI 元素可见性（按钮数、输入框、Archive 按钮等）
- 基于 AP 消耗和对话状态自动切换阶段

### 2. 许知微主界面化
- 从顶部"💡 许知微"按钮改为场景描述下方的提示卡
- 根据游戏阶段动态生成不同提示文本
- 提供 1-2 个推荐行动按钮，新手可直接点击

### 3. 案件板 (CaseBoard)
- 新增案件板渲染器，支持：已确认事实、NPC 说法、待验证、关键矛盾、下一步建议
- 仅在积累足够线索后显示 Archive 按钮

### 4. 加载状态管理
- 按钮点击时显示加载动画（旋转图标）
- 全局加载遮罩（半透明背景 + 模糊效果）
- 支持 `prefers-reduced-motion` 减弱动画

### 5. 按钮点击反馈
- 点击时缩放效果 (scale 0.96)
- 涟漪高光效果
- 过渡动画 150ms

---

## 技术变更

### 新增文件
| 文件 | 功能 | 行数 |
|------|------|------|
| `public/ui-stage.js` | UIStage 状态机 | 82 |
| `public/assistant-hint.js` | 许知微提示生成器 | 78 |
| `public/case-board.js` | 案件板渲染器 | 93 |
| `public/loading-state.js` | 加载状态管理器 | 45 |

### 修改文件
| 文件 | 变更 |
|------|------|
| `public/app.js` | 集成 UIStage（~150 行新增）、updateUIVisibility()、renderAssistantHint() |
| `public/components/actions.js` | ActionDock 支持 setActionCount() |
| `public/style.css` | 新增 150+ 行样式（提示卡、案件板、加载、动画、安全区） |
| `public/index.html` | 引入 4 个新模块 |
| `server.js` | 新增 `/api/ui-stage` 端点 |
| `scripts/start_slt.sh` | 修复超时问题（nohup 后台运行） |

### 测试
| 文件 | 类型 | 结果 |
|------|------|------|
| `tests/ui-stage.test.js` | 单元测试 | 9/9 通过 |
| `tests/assistant-hint.test.js` | 单元测试 | 通过 |
| `tests/e2e/newbie-flow.spec.js` | E2E | 5/5 通过 |
| `tests/e2e/full-player-journey.spec.js` | E2E | 10/10 通过 |
| `tests/e2e/save-restore.spec.js` | E2E | 2/2 通过 |
| `tests/e2e/ui-components.spec.js` | E2E | 8/8 通过 |

**总计：25/25 E2E 通过**

---

## 设计决策

1. **AP 判断优于 history 判断**: 使用 `ap < 10` 判断是否有行动历史，避免依赖引擎未保证的字段
2. **许知微主界面化**: 从顶部按钮改为场景下方提示卡，更自然地融入游戏流程
3. **按钮上下文化**: 消除"高风险行动"等工程术语，改为具体描述（如"强行搜查灰衣乘客行李"）
4. **不修改 engine.js**: 仅前端 UI 层控制渲染逻辑，引擎行为不变

---

## 兼容性

- **无破坏性变更**: 现有存档继续可用
- **无新增依赖**: 继续使用 Vanilla JS + CSS3
- **API 兼容**: 新增 `/api/ui-stage` 为可选端点，不影响现有 API
- **移动端适配**: 新增安全区 padding、减弱动画支持

---

## 已知问题

无

---

## 后续计划

1. 为 `loop_memory_intro` 阶段添加记忆提示 UI
2. 为 `contradiction_intro` 阶段添加矛盾可视化
3. 添加更多按钮动效（涟漪效果）

---

## 收尾检查

- [x] 稳态文档已更新（PROJECT_STATUS、CHANGELOG、ROADMAP、KNOWN_ISSUES）
- [x] Devlog 站点数据已同步
- [x] 版本号已在所有位置同步
- [x] 发布说明已包含版本级别标记
- [x] Work item 已归档到 released/

---

## 发布检查

- [x] engine.js 未修改
- [x] Smoke tests 通过 (7/7)
- [x] Runtime tests 通过 (3/3)
- [x] E2E tests 通过 (25/25)
- [x] 单元测试通过 (2/2)
- [x] 语法检查通过
- [x] 无硬编码密钥
- [x] 无 console.log 遗留
- [x] 版本号一致性检查通过

---

## 验证清单

- [x] engine.js 未修改
- [x] Smoke tests 通过 (7/7)
- [x] Runtime tests 通过 (3/3)
- [x] E2E tests 通过 (25/25)
- [x] 单元测试通过 (2/2)
- [x] 语法检查通过
- [x] 无硬编码密钥
- [x] 无 console.log 遗留
- [x] 版本号一致性检查通过
