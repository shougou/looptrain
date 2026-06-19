# Spec: LT 文档工程治理 — Work Item 流转制度

基于 `00-idea.md` 生成。

## 1. 背景
LT 项目文档分散在 6 处，无生命周期，无强制执行机制。

## 2. 目标
- 建立统一文档目录结构
- 定义 Work Item 8 阶段流转
- 实现三层强制执行机制
- Agent 工作协议可验证

## 3. 非目标
- 不修改 devlog/src/（线上发布层）
- 不引入外部工具（CI/Jenkins）

## 4. 验收标准
- [x] docs/ 目录结构完整
- [x] 8 个模板文件就位
- [x] 6 个稳态文档有实际内容
- [x] check_work_item.sh 可执行
- [x] check_project_docs.sh 可执行
- [x] 4 个 work item 归档就位
- [x] ADR-0001 记录决策
- [x] AGENT.md 含 9 条可验证断言
- [x] 六处源头已清理
- [x] .claude/plans/ 目录已清空并移除
