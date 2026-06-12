# LoopTrain-ST 安装说明

## 1. 安装 UI Extension

把目录：

```text
st-extension/LoopTrain
```

复制到 SillyTavern 的第三方扩展目录。常见方式有两种：

### 方式 A：全局安装

复制到：

```text
<SillyTavern>/public/scripts/extensions/third-party/LoopTrain
```

### 方式 B：用户目录安装

复制到当前用户的 extensions 目录。具体路径取决于 ST 的数据目录配置。

安装后重启或刷新 SillyTavern，在扩展管理中启用 `LoopTrain Game Mode`。

## 2. 安装 Server Plugin

把目录：

```text
st-server-plugin/looptrain
```

复制到：

```text
<SillyTavern>/plugins/looptrain
```

然后修改 ST 根目录下 `config.yaml`：

```yaml
enableServerPlugins: true
```

重启 SillyTavern。

验证：

```text
http://localhost:8000/api/plugins/looptrain/health
```

应返回：

```json
{
  "ok": true,
  "engine": "looptrain",
  "version": "0.1.0"
}
```

## 3. 导入试玩版物料

物料位于：

```text
materials/st_import/character_cards/
materials/st_import/world_info/
materials/st_import/world_books/
```

建议先导入 3 个可见角色：

```text
xiaoning.card.json
zhao_police.card.json
shen_mohan.card.json
```

隐藏 NPC：

```text
xiaoning_mother_hidden.card.json
```

可以作为内容参考或后续隐藏节点专用卡，不必在 ST 普通聊天里直接作为可见角色使用。

## 4. 验证路径

在 ST 页面右下角点击 `LoopTrain` 打开游戏界面。

验证路径：

```text
和小宁对话
→ 温和询问
→ 结束对话
→ 检查座位下方
→ 说服赵乘警检查地板
```

## 5. 不安装 Server Plugin 的情况

如果没有安装 Server Plugin，UI Extension 会自动使用本地 Mock 引擎。

这适合验证 UI 和基本玩法，但正式改造建议启用 Server Plugin，因为强控制状态机应放在服务端。


## Importing ST Character Cards with Portraits

You can import the PNG-based ST cards directly from `st-character-cards/`. Each PNG embeds Character Card V2 JSON in the `chara` metadata field. Sidecar JSON versions remain under `materials/st_import/character_cards/`.
