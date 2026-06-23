# 30-implementation-log.md — 实施日志

**Work Item**: LT-20260622-clue-system-redesign
**开始日期**: 2026-06-23

---

## Phase 1: 数据层（2026-06-23）

### 变更文件

| 文件 | 操作 | 说明 |
|---|---|---|
| `looptrain/materials/runtime/timeline/trial-timeline.json` | REWRITE | 9 事件 → 17 事件，新增 observable 字段（window/locations/public_clue_id） |
| `looptrain/materials/runtime/clues/trial-clues.json` | REWRITE | 8 条旧线索 → 20 条新线索，含 source_type/contradicts/supports/derived_from/effect |
| `looptrain/materials/runtime/characters/xiaoning.json` | MODIFY | cost 3→2，+1 claim suggestion（grants_claim: claim_xiaoning_stayed_carriage2） |
| `looptrain/materials/runtime/characters/gray_passenger.json` | MODIFY | cost 3→2，+2 claim suggestions（含 requires_inference 机制） |
| `looptrain/materials/runtime/characters/zhao_police.json` | MODIFY | cost 3→2，+1 claim suggestion（grants_claim: claim_zhao_needs_actionable_evidence） |
| `looptrain/materials/runtime/commands/command-registry.json` | MODIFY | +3 时间线指令（view_npc_timeline/view_gray_timeline/view_xiaoning_timeline），共 15 条 |

### 验证
- 全部 6 个 JSON 文件通过 `JSON.parse()` 验证
- 事件数：17（6 个含 observable 字段）
- 线索数：20（4 physical + 5 claim + 6 observation + 5 inference）
- NPC cost 统一从 3→2（AP 经济调整，留容错空间）

---

## Phase 2: Engine 改造（2026-06-23）

### 变更文件

| 文件 | 操作 | 说明 |
|---|---|---|
| `looptrain/standalone/engine.js` | REWRITE | 628 行 → 1261 行，新增 10 个函数，修改 7 个现有函数 |

### 新增函数

| 函数 | 用途 |
|---|---|
| `loadTimelineEvents()` | 加载 trial-timeline.json 到 TIMELINE_EVENTS 全局 |
| `timeToMinutes()` / `timeInWindow()` / `windowsOverlap()` | 时间比较辅助 |
| `makeTimelineEntry()` | TimelineEntry 工厂函数 |
| `addTimelineEntry(state, data)` | 添加条目 + 同步 known_clues + 触发检测 |
| `observeEnvironment(state, params)` | 3 种观察行动（scene/npc/location） |
| `detectConflicts(state)` | 矛盾检测，返回冲突对 |
| `generateInference(state)` | 推理线索自动生成 |
| `evaluateEvidence(state)` | 5 维度证据评分 |
| `canConvinceZhao(state)` | 4 条成功路径判定（替代 countValidEvidence >= 2） |
| `carryTimelineToNextLoop(prevState)` | 继承时转为 memory 类型 |
| `hasCurrentEntry()` / `hasInference()` | 查找辅助 |

### 修改的现有函数

| 函数 | 变更 |
|---|---|
| `loadContent()` | 加载新 runtime 路径线索 + 调用 loadTimelineEvents() |
| `normalize()` | 初始化 player_timeline（向后兼容旧 state） |
| `START_STATE` | 新增 player_timeline + 新线索 ID |
| `suggestions()` | +观察行动 +推理解锁行动 |
| `dialogueMessage()` | +grants_claim/requires_inference 支持 |
| `endDialogue()` | canConvinceZhao 替代 + auto_grant + generateInference |
| `failLoop()` | 继承 timeline entries + inferences |
| `nextLoop()` | 恢复 memory entries + inferences |
| `countValidEvidence()` | 废弃，重定向到 evaluateEvidence() |
| `FALLBACK_CLUE_DETAILS` | 8 旧 ID → 15 新 ID |

### 验证
- `node --check engine.js` ✅ PASS（0 errors）
- `typeof e.observeEnvironment, e.detectConflicts, e.canConvinceZhao` → `function function function` ✅
- LSP diagnostics: 0 errors, 0 warnings ✅
- Smoke test: observeEnvironment 发现 1 条目、evaluateEvidence 返回 5 维度、canConvinceZhao 正确返回 false、normalize 处理旧 state ✅
- ⚠️ `smoke_test.js` 引用旧线索 ID `gray_coat_note_pressure`，需 Phase 5 更新

---

## Phase 3: Server API（2026-06-23）

### 变更文件

| 文件 | 操作 | 说明 |
|---|---|---|
| `looptrain/standalone/server.js` | MODIFY | +POST /api/action/observe 路由（7 行），接受 {type, npc_id, location, state} |

### 验证
- `node --check server.js` ✅
- curl 测试：`POST /api/action/observe {type:"scene"}` 成功发现 14:04 灰衣经过事件 ✅
- `/api/session/init` 返回 `player_timeline: {entries:[], inferences:[]}` ✅
- 缺少 type 参数返回 400 ✅

---

## Phase 4: Frontend UI（2026-06-23）

### 变更文件

| 文件 | 操作 | 行数变化 | 说明 |
|---|---|---|---|
| `looptrain/standalone/public/app.js` | MODIFY | +170 行 | 观察行动 UI + 时间线渲染 + 4 条时间线指令 |
| `looptrain/standalone/public/style.css` | MODIFY | +66 行 | 时间线面板 + 5 种标签颜色 + 观察结果样式 |

### 新增功能
- `handleObserveAction()` — 解析 `__OBSERVE_SCENE__` / `__OBSERVE_NPC__:id` / `__OBSERVE_LOCATION__:loc` 模板
- `handleObserveResponse()` — 渲染观察结果（发现/无发现/矛盾提示）
- `renderTimelineHtml()` — 时间线按 NPC 分组渲染，5 种标签颜色
- `showNpcTimeline()` / `showGrayTimeline()` / `showXiaoningTimeline()` — 3 条新指令处理
- 观察建议 chip 渲染为绿色按钮（`.lt-observe-chip`）
- `submitInput()` 拦截 `__OBSERVE_*` 模板，路由到 `/api/action/observe`

### 验证
- `node --check app.js` ✅
- LSP diagnostics: 0 errors ✅
- 服务器启动无崩溃 ✅

---

## Phase 5: 测试（2026-06-23）

### 变更文件

| 文件 | 操作 | 说明 |
|---|---|---|
| `looptrain/standalone/tests/smoke_test.js` | MODIFY | 全部旧 ID → 新 ID，7 section 全通过 |
| `looptrain/tests/engine_flow_test.js` | MODIFY | 旧 ID → 新 ID，canConvinceZhao 路径 |
| `looptrain/tests/all_npc_flow_test.js` | MODIFY | 旧 ID → 新 ID |
| `looptrain/tests/failure_next_loop_test.js` | MODIFY | 旧 ID → 新 ID，player_timeline 继承 |
| `looptrain/tests/hidden_node_test.js` | MODIFY | mother_doll_memory 移除适配 |
| `looptrain/tests/llm_bridge_test.js` | MODIFY | 旧 ID → 新 ID |
| `looptrain/tests/dialogue_turn_limit_test.js` | MODIFY | NPC cost 3→2 适配 |
| `looptrain/tests/timeline_observation_test.js` | CREATE | 9 个测试：scene/npc/location 观察 + AP/时间 + 条目同步 |
| `looptrain/tests/conflict_detection_test.js` | CREATE | 6 个测试：灰衣/小宁矛盾 + 去重 + 边缘 |
| `looptrain/tests/inference_generation_test.js` | CREATE | 7 个测试：5 条推理链 + 去重 + 单源不触发 |
| `looptrain/tests/evidence_scoring_test.js` | CREATE | 10 个测试：5 维度 + 4 路径 + police_context + memory |
| `looptrain/tests/loop_inheritance_test.js` | CREATE | 11 个测试：继承 + memory 转换 + 证据不计 |

### 验证
- 11 个引擎测试全部通过 ✅
- smoke_test.js 7 section 全绿 ✅

---

## Phase 6: 文档 + 版本号收尾（2026-06-23）

### 变更文件

| 文件 | 操作 | 说明 |
|---|---|---|
| `VERSION` | MODIFY | v0.9.0 → v0.10.0-npc-timeline-inference |
| `docs/project/GAME_DESIGN.md` | MODIFY | 线索 8→20 条 + 时间线推理 + 多维证据评分 + 角色定位更新 |
| `docs/project/PROJECT_STATUS.md` | MODIFY | 版本号 + 当前重点 + 风险更新 |
| `docs/project/ROADMAP.md` | MODIFY | NPC 自主时间线 + 线索继承 标记完成 |

### 实施总结

| Phase | 文件数 | 新增行数 | 状态 |
|---|---|---|---|
| Phase 1 数据层 | 6 | ~400 | ✅ |
| Phase 2 Engine | 1 | +633 (628→1261) | ✅ |
| Phase 3 Server | 1 | +7 | ✅ |
| Phase 4 Frontend | 2 | +236 | ✅ |
| Phase 5 测试 | 12 | ~600 | ✅ |
| Phase 6 文档 | 4 | ~50 | ✅ |
| **合计** | **26 文件** | **~1926 行** | **✅ 全部完成** |
