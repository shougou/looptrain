# LoopTrain-ST Source Runtime Validation v0.4

这是 LoopTrain-ST 的 **源码运行验证包**，不使用 Docker。

目标是验证项目架构的底层链路：

```text
拉取官方 SillyTavern 项目源码
→ 安装 SillyTavern 运行环境
→ 安装 LoopTrain UI Extension
→ 安装 LoopTrain Server Plugin
→ 启用 enableServerPlugins
→ 准备角色卡 / 世界书 / 剧情物料
→ 在 ST 中配置 DeepSeek V4 Pro
→ 在 ST 内进入 LoopTrain 游戏模式
→ 切换“回复：ST LLM”
→ 验证真实 LLM 对话 + LoopTrain 控制层结算
```

## 1. 为什么不用 Docker

本验证包不采用 Docker，原因是：

1. 更贴近未来云主机部署方式。
2. 方便直接维护 SillyTavern 项目源码。
3. 方便跟随 ST 官方 release 分支更新。
4. 方便排查 ST Extension / Server Plugin / 角色卡 / 世界书问题。
5. 避免把 ST 包装成黑盒，保持项目底层逻辑清晰。

SillyTavern 官方 Linux/Mac 安装文档也推荐通过 Git 方式克隆 release 分支，并运行 `start.sh` 启动；官方更新文档也说明通过 `git pull` 更新是推荐方式。  

## 2. 包结构

```text
looptrain_st_source_runtime_v0.1/
  scripts/
    setup_linux.sh
    start_sillytavern.sh
    verify_install.sh
    update_looptrain.sh
    setup_windows.ps1
    start_sillytavern.ps1
    verify_install.ps1
    patch_config.py

  looptrain/
    st-extension/LoopTrain/
    st-server-plugin/looptrain/
    st-character-cards/
    materials/
    docs/
    tests/
    tools/

  runtime_imports/
    character_cards/
    world_books/
    world_info/
    looptrain_materials/
    docs/

  workspace/
    SillyTavern/        # setup 脚本运行后自动生成
```

## 3. Linux / macOS 快速验证

要求：

```text
git
Node.js latest LTS
npm
python3
```

执行：

```bash
cd looptrain_st_source_runtime_v0.1
bash scripts/setup_linux.sh
bash scripts/verify_install.sh
bash scripts/start_sillytavern.sh
```

默认会把 SillyTavern 拉到：

```text
workspace/SillyTavern
```

也可以指定目录：

```bash
ST_DIR=/opt/SillyTavern bash scripts/setup_linux.sh
ST_DIR=/opt/SillyTavern bash scripts/start_sillytavern.sh
```

## 4. Windows 快速验证

要求：

```text
Git for Windows
Node.js latest LTS
Python
PowerShell
```

执行：

```powershell
cd looptrain_st_source_runtime_v0.1
powershell -ExecutionPolicy Bypass -File scripts\setup_windows.ps1
powershell -ExecutionPolicy Bypass -File scripts\verify_install.ps1
powershell -ExecutionPolicy Bypass -File scripts\start_sillytavern.ps1
```

## 5. setup 脚本做了什么

`setup_linux.sh` / `setup_windows.ps1` 会执行：

1. 检查 git / node / npm。
2. 拉取官方 SillyTavern release 分支：

```bash
git clone https://github.com/SillyTavern/SillyTavern.git -b release
```

3. 创建 / 初始化 `config.yaml`。
4. 执行 `npm install`。
5. 修改 `config.yaml`：

```yaml
enableServerPlugins: true
listen: false
```

6. 安装 LoopTrain UI Extension 到：

```text
SillyTavern/public/scripts/extensions/third-party/LoopTrain
```

7. 安装 LoopTrain Server Plugin 到：

```text
SillyTavern/plugins/looptrain
```

8. 准备导入材料到：

```text
SillyTavern/looptrain_imports/
```

## 6. 导入材料

启动 ST 后，手动导入：

### 6.1 角色卡

目录：

```text
SillyTavern/looptrain_imports/character_cards/
```

包含：

```text
小宁.STcard.png
赵乘警.STcard.png
沈墨寒.STcard.png
小宁妈妈_隐藏节点.STcard.png
```

### 6.2 世界书 / WorldInfo

目录：

```text
SillyTavern/looptrain_imports/world_books/
SillyTavern/looptrain_imports/world_info/
```

导入后建议与当前聊天绑定。

### 6.3 LoopTrain 剧情物料

目录：

```text
SillyTavern/looptrain_imports/looptrain_materials/
```

这些用于开发核对，不一定需要 ST UI 手动导入：

```text
episode/
clues/
rules/
scenes/
prompts/
schemas/
```

## 7. 配置 DeepSeek V4 Pro

在 SillyTavern 中配置模型连接：

```text
API Type: Chat Completion
Chat Completion Source: Custom OpenAI-compatible 或 DeepSeek
Base URL: https://api.deepseek.com
Model: deepseek-v4-pro
API Key: 你的 DeepSeek Key
```

LoopTrain 本身不保存 API Key。模型连接、API Key、世界书、角色卡仍由 ST 管理。

## 8. 验证路径

### 8.1 验证 ST 底座

1. 启动 ST。
2. 浏览器打开 ST 页面。
3. 确认角色卡可以导入。
4. 确认世界书可以导入。
5. 确认 DeepSeek V4 Pro 可以正常生成普通 ST 回复。

### 8.2 验证 LoopTrain Extension

1. 页面右下角出现 `LoopTrain` 按钮。
2. 点击后出现手机端游戏覆盖层。
3. 首次打开显示《第七节车厢》开场背景。
4. 点击“开始第 1 轮”。

### 8.3 验证 Server Plugin

LoopTrain 顶部状态应显示：

```text
Server Plugin｜Mock 回复
```

如果显示 `Local Mock`，说明 Server Plugin 没有加载，需要检查：

```text
config.yaml 中 enableServerPlugins 是否为 true
plugins/looptrain 是否存在
是否已重启 ST
```

官方 Server Plugins 文档说明：插件位于 ST 的 `plugins` 目录，并且只有 `config.yaml` 中 `enableServerPlugins` 为 `true` 时才会加载。

### 8.4 验证 Mock 闭环

```text
回复：Mock
→ 和小宁对话
→ 提到滴答声
→ 结束对话
→ 检查座位下方
→ 说服赵乘警
→ 试玩版成功
```

### 8.5 验证 ST LLM / DeepSeek 闭环

```text
切换到：回复：ST LLM
→ 和小宁对话
→ 自由输入问题
→ DeepSeek 生成小宁回复
→ LoopTrain 仍然控制线索、AP、轮数、结算
```

重点观察：

```text
LLM 是否只做 NPC 表演
LLM 是否乱发线索
LoopTrain 是否清洗系统裁判文本
对话轮数是否仍然生效
结束对话后是否正常结算
```

## 9. 更新 LoopTrain

如果只更新 LoopTrain 扩展，不重新拉取 ST：

```bash
bash scripts/update_looptrain.sh
```

Windows：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup_windows.ps1
```

## 10. 云主机部署建议

当前验证默认：

```yaml
listen: false
```

适合本地验证。

未来云主机公网部署时，再改成：

```yaml
listen: true
```

但必须加：

```text
反向代理
HTTPS
访问密码
ST 多用户或账号保护
模型额度保护
只开放试玩环境
```

不要把无保护的 ST 直接暴露公网。

## 11. 当前边界

本包不是：

```text
Docker 一键部署包
完整公网生产包
SillyTavern 源码打包副本
```

本包是：

```text
源码拉取式 ST 运行环境验证包
```

它通过脚本拉取官方 ST release 分支，再把 LoopTrain 安装进去。


## v0.2 变更：Game Shell / Admin Setup

本验证包已更新到 LoopTrain-ST v0.4.1。

默认访问：

```text
http://host:8000/
```

用于 Admin Setup，不自动打开 LoopTrain，避免阻挡 ST 设置。

玩家入口：

```text
http://host:8000/?looptrain=game
```

或：

```text
http://host:8000/#looptrain
```

会进入 Game Shell，隐藏 SillyTavern 背景，只显示 LoopTrain。

LoopTrain 顶部的：

```text
ST设置
```

用于退出 Game Shell，回到 ST 原生界面配置 DeepSeek、角色卡和世界书。


## v0.3 变更：v0.4.2 Runtime Fix

本验证包已更新到 LoopTrain-ST v0.4.2。

修正：

```text
1. http://host:8000/ 默认不显示 LoopTrain 大面板，只保留右下角“进入 LoopTrain”。
2. http://host:8000/?looptrain=game 才自动进入 Game Shell。
3. Game Shell 状态不再持久化，避免下次访问 / 继续遮挡 ST。
4. 场景里的 NPC 按钮现在会直接执行，不再只是填入输入框。
5. 点击“和小宁对话”应直接进入对话并触发立绘。
```

如果你已经安装过旧版 ST 环境，解压本包后执行：

```bash
bash scripts/update_looptrain.sh
bash scripts/verify_install.sh
bash scripts/start_sillytavern.sh
```

Windows：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup_windows.ps1
powershell -ExecutionPolicy Bypass -File scripts\verify_install.ps1
powershell -ExecutionPolicy Bypass -File scripts\start_sillytavern.ps1
```

验证地址：

```text
管理员配置：http://127.0.0.1:8000/
玩家模式：http://127.0.0.1:8000/?looptrain=game
```


## v0.4 变更：v0.4.3 LLM Raw Bridge + Asset Path Fix

本验证包已更新到 LoopTrain-ST v0.4.3。

修正：

```text
1. 立绘资源路径固定为 /scripts/extensions/third-party/LoopTrain/
2. LLM Bridge 从 generateQuietPrompt 改为 generateRaw
3. 不再依赖 ST 当前 chat_name / chat file
4. 新增 window.LoopTrain.getDiagnostics()
```

如果已安装旧版，执行：

```bash
bash scripts/update_looptrain.sh
bash scripts/verify_install.sh
bash scripts/start_sillytavern.sh
```

验证 Console：

```js
window.LoopTrain.getDiagnostics()
```

重点检查：

```text
assetBase = /scripts/extensions/third-party/LoopTrain/
portraitNaturalWidth > 0
hasGenerateRaw = true
replySource = st_llm
```
