# LoopTrain-ST 文档包 v0.3.2

本包是 LoopTrain-ST v0.3.2 的单独文档包，适合交给后续 AI Coding 工具、团队成员或项目维护者阅读。

## 推荐阅读顺序

1. `README.md`  
   安装、配置、运行、测试和目录说明。

2. `AGENT.md`  
   AI Coding / Agent 协作规范，包含项目铁律、禁止事项、测试要求。

3. `SPEC.md`  
   试玩版规格说明，包括剧情背景、玩法、NPC、AP、线索、成功失败条件。

4. `PROJECT_DESIGN.md`  
   项目设计文档，包括 ST 外层扩展、Server Plugin、状态机和物料结构。

5. `UI_UX_DESIGN.md`  
   UX/UI 设计文档，包括开场页、手机端布局、扮演/指令页签、结算卡。

6. `existing_docs/`  
   项目内已有设计与版本文档，包括控制流、技术设计、ST 字段映射、v0.3.x 开发说明。

## 当前版本边界

v0.3.2 不接真实 LLM，仍以 Mock / 规则控制层验证试玩版 UX、状态机、NPC 轮数、线索、成功/失败结算。

下一步建议：

- 真实 ST 环境端到端验证。
- 手机端实机验证。
- 线索 / 人物 / 状态抽屉。
- v0.4 接入真实 LLM。

7. `V0_4_ALPHA_DEVELOPMENT.md`  
   v0.4-alpha ST 原生 LLM 接入验证说明。
