# Roadmap

## 当前阶段：试玩版内容完成

- [x] 剥离 SillyTavern，建立 Standalone MVP
- [x] 建立 TypeScript Runtime 架构（MemoryRuntime + Deterministic Assistant）
- [x] Goal Engine DSL 判定器 + 12 条指令系统
- [x] 许知微主动引导 + 三轮渐进学习 UI
- [x] 内容外置化（JSON 文件管理）
- [x] 《寒灯初醒》试玩内容上线（5 角色、3 场景、8 线索、8 目标）
- [x] 接入音效系统
- [x] UX/UI 场景驱动布局 + 立绘入场动画
- [x] 内容一致性全面审计（时间线、角色、场景、文本）
- [x] LLM Bridge 真实接入（DeepSeek，线上已启用）
- [x] Playwright 回归测试
- [x] 状态持久化（localStorage 版本化存档 + breaking change 检测，后续需迁移 IndexedDB）

## 下一阶段：体验增强

- [x] 真实 LLM NPC 动态对话（DeepSeek，线上已启用）
- [ ] Playwright 自动回归测试
- [ ] 手机端真机适配验证
- [ ] 背景音乐 + 关键事件音效
- [x] NPC 自主时间线（世界状态独立推进）
- [x] 失败结算后的线索继承完善（player_timeline + memory 转换 + current_loop_verified）

## 探索方向

- [ ] 10+ NPC 扩展
- [ ] 事故真相主线完成
- [ ] 多结局系统
- [ ] 角色卡、世界书管理机制
- [ ] 独立游戏发布方式探索
