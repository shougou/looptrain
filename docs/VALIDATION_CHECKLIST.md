# LoopTrain-ST 真实 ST 验证清单

## A. ST 运行环境

- [ ] `workspace/SillyTavern` 已存在。
- [ ] `config.yaml` 已存在。
- [ ] `enableServerPlugins: true`。
- [ ] ST 可以正常启动。
- [ ] 浏览器可以打开 ST 页面。

## B. LoopTrain 安装

- [ ] `public/scripts/extensions/third-party/LoopTrain/index.js` 存在。
- [ ] `public/scripts/extensions/third-party/LoopTrain/style.css` 存在。
- [ ] `plugins/looptrain/index.js` 存在。
- [ ] `plugins/looptrain/engine.js` 存在。
- [ ] ST 重启后 LoopTrain 按钮出现。

## C. 导入材料

- [ ] 导入小宁角色卡。
- [ ] 导入赵乘警角色卡。
- [ ] 导入沈墨寒角色卡。
- [ ] 导入小宁妈妈隐藏节点角色卡。
- [ ] 导入 / 绑定 WorldInfo。
- [ ] 确认当前聊天使用正确角色 / 世界书。

## D. DeepSeek V4 Pro

- [ ] 在 ST 中配置 API Key。
- [ ] Base URL 为 `https://api.deepseek.com`。
- [ ] Model 为 `deepseek-v4-pro`。
- [ ] 普通 ST 聊天能生成回复。

## E. LoopTrain Mock 验证

- [ ] 打开 LoopTrain 覆盖层。
- [ ] 开场页正常。
- [ ] `回复：Mock`。
- [ ] 和小宁对话。
- [ ] 获得线索。
- [ ] 结束对话出现结算。
- [ ] 失败测试出现失败结算。
- [ ] 下一轮继承记忆。
- [ ] 成功路径可完成试玩版。

## F. LoopTrain ST LLM 验证

- [ ] 切换到 `回复：ST LLM`。
- [ ] 和小宁对话时由 DeepSeek 生成回复。
- [ ] 和赵乘警对话时由 DeepSeek 生成回复。
- [ ] 和沈墨寒对话时由 DeepSeek 生成回复。
- [ ] LLM 回复不直接修改真实状态。
- [ ] 对话轮数仍然生效。
- [ ] 线索仍由控制层发放。
- [ ] 成功 / 失败仍由控制层判定。

## G. 手机端体验

- [ ] 手机浏览器可以打开 ST。
- [ ] LoopTrain 覆盖层正常。
- [ ] 输入框不被键盘遮挡。
- [ ] NPC 立绘不遮挡主要文字。
- [ ] 失败结算可以滚动。
- [ ] 成功结算可以完整阅读。
