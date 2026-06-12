# Source Runtime 架构说明

本验证包采用源码运行方式，不使用 Docker。

## 架构

```text
Host OS
  └─ workspace/SillyTavern       # 官方 ST release 分支
       ├─ public/scripts/extensions/third-party/LoopTrain
       ├─ plugins/looptrain
       ├─ looptrain_imports
       └─ config.yaml

LoopTrain Source Runtime Package
  ├─ scripts
  ├─ looptrain
  └─ runtime_imports
```

## 责任边界

```text
SillyTavern:
  - 角色卡
  - 世界书
  - Prompt / Preset
  - 模型连接
  - API Key
  - 聊天历史
  - 用户环境

LoopTrain:
  - 游戏 UI
  - 控制层
  - AP / 时间
  - 线索
  - 对话轮数
  - 成功失败
  - 循环继承
```

## 不做的事情

本验证包不做：

- 不重新实现 ST。
- 不绕过 ST 模型连接。
- 不在 LoopTrain 中保存 DeepSeek API Key。
- 不把 ST 打成 Docker 黑盒。
- 不直接内置 ST 源码快照。

## 为什么拉取官方 release 分支

这样可以：

- 保持与官方 ST 更新一致。
- 后续通过 `git pull` 更新。
- 云主机部署时路径清晰。
- 方便排查 ST / LoopTrain 边界问题。
