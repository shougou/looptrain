# Project Status

## 当前版本

v0.8-testplay — 《寒灯初醒》试玩版

## 当前状态

- Runtime: standalone Node.js，pm2 管理，端口 3030
- 前端: vanilla HTML/CSS/JS，场景驱动布局，手机竖屏
- LLM: Mock 模式（预设模板对话），DeepSeek Bridge 已预留接口
- 音效: Web Audio API，场景环境音 + 按钮音效 + 时间压力 + 失败冲击
- 部署: https://looptrain.me/play/game（nginx 反向代理）

## 当前重点

- Goal Engine + 指令系统 + 许知微助手已上线
- 《寒灯初醒》完整试玩内容已上线
- 暂用 Mock 模式，待接入真实 LLM
- 状态持久化未完成

## 最近完成

- v0.7 Goal Engine DSL + 12 指令系统 + 许知微主动引导 + UX/UI 场景驱动
- v0.8 故事重构为《寒灯初醒》，新角色（灰衣乘客），8 线索 8 目标 3 轮结算
- 内容一致性全面审计：时间线统一 14:00→14:15，废弃角色清理，NPC ID 对齐

## 当前风险

- Mock 模式对话文本单一，真实 LLM 接入后需重测全部对话路径
- 无 Playwright 回归测试，修改后依赖手动验证
- 手机端真机测试覆盖不足
