import type { RoadmapPhase } from '../types/index';

const roadmap: RoadmapPhase[] = [
  {
    id: 'current',
    label: '当前阶段：Playtest v0.12.0 Replay Echo',
    description:
      'v0.7 建立了目标引擎、指令系统和许知微助手；v0.8 完成《寒灯初醒》全部试玩内容；v0.10 建立 NPC 时间线推理系统；v0.11 实现渐进式 UI 解锁系统；v0.12 引入时间线回放（失败后从锚点接入）和 NPC 记忆残响（跨轮情感残留）。',
    tasks: [
      {
        task: '剥离 ST，建立 Standalone MVP',
        status: '已完成',
        description: '已建立 standalone runtime，复用 engine.js。线上 /play/game 已切换到纯 LT Standalone。',
        priority: 'high',
      },
      {
        task: '建立 TypeScript Runtime 架构',
        status: '已完成',
        description: 'v0.6 建立分层 Runtime 架构（MemoryRuntime + Deterministic Assistant），61 文件 20 模块。',
        priority: 'high',
      },
      {
        task: 'Goal Engine + 指令系统 + 许知微',
        status: '已完成',
        description: 'v0.7 建立 GoalEngine DSL 判定器、12 条指令 CommandRegistry、许知微主动引导和三轮渐进学习 UI。',
        priority: 'high',
      },
      {
        task: '内容外置化',
        status: '已完成',
        description: 'v0.8 完成所有游戏内容外置为 JSON 文件：5 角色、3 场景、8 线索、8 目标、3 轮结算、开场/结尾。',
        priority: 'high',
      },
      {
        task: '《寒灯初醒》试玩内容上线',
        status: '已完成',
        description: '新故事：14:00→14:15 时间线，灰衣乘客新角色（赵乘警保留），8 线索 8 目标，电影式开场，试玩版结局。',
        priority: 'high',
      },
      {
        task: '接入音效系统',
        status: '已完成',
        description: '场景环境音、按钮音效、消息发送音效、时间压力提示、失败冲击音效和循环转场音效。',
        priority: 'medium',
      },
      {
        task: 'UX/UI 场景驱动布局',
        status: '已完成',
        description: 'v0.7.1 场景驱动布局、NPC 立绘入场动画、对话面板扩展、3 轮渐进学习 UI。',
        priority: 'high',
      },
      {
        task: 'LLM Bridge 真实接入',
        status: '已完成',
        description: 'v0.11.0 接入 DeepSeek 动态 NPC 对话，Mock 降级为 fallback 模式。v0.12.0 增加 LLM Echo Guard 禁词检测。',
        priority: 'high',
      },
      {
        task: '建立 Playwright 回归测试',
        status: '已完成',
        description: 'v0.9.0 建立 12 步 E2E + 存档恢复测试，v0.10.0 修复 verify_slt.sh 服务器启动。',
        priority: 'high',
      },
      {
        task: '渐进式 UI 解锁系统',
        status: '已完成',
        description: 'v0.11.0 实现 7 阶段 UIStage 状态机、许知微主界面化提示卡、案件板 CaseBoard、加载状态管理、按钮点击反馈动效。',
        priority: 'high',
      },
      {
        task: 'NPC 时间线推理系统',
        status: '已完成',
        description: 'v0.10.0 建立 player_timeline + 3 种观察行动 + 矛盾检测 + 推理生成 + 多维证据评分 + 失败继承。',
        priority: 'high',
      },
      {
        task: '状态持久化',
        status: '已完成',
        description: 'localStorage 版本化双 key 存档（SaveMeta + runtime），启动时自动检测 breaking change 并引导重置。后续需迁移到 IndexedDB。',
        priority: 'high',
      },
      {
        task: '时间线回放系统',
        status: '已完成',
        description: 'v0.12.0 实现失败后从上一轮锚点接入：resumeFromReplayAnchor + calculatePrepositionAP + 预置 AP 计算。',
        priority: 'high',
      },
      {
        task: 'NPC 记忆残响系统',
        status: '已完成',
        description: 'v0.12.0 实现跨轮情感残留：buildNpcMemoryEchoes + resolveNpcOpening + LLM 残响段落注入。',
        priority: 'high',
      },
      {
        task: 'LLM Echo Guard',
        status: '已完成',
        description: 'v0.12.0 实现禁词检测（6 禁词 + 3 组 forbidden_reveals）+ 回退 Mock 模式。',
        priority: 'high',
      },
      {
        task: 'Runtime 事件记录系统',
        status: '已完成',
        description: 'v0.12.0 实现 IndexedDB 前端封装（5 store + 降级策略）+ 行动边界自动记录。',
        priority: 'medium',
      },
    ],
  },
  {
    id: 'next',
    label: '下一阶段：体验验证与 E2E 测试',
    description:
      '验证 v0.12.0 新系统的稳定性，更新 E2E 测试，完成剩余体验增强。',
    tasks: [
      {
        task: 'E2E 时间线回放完整流程测试',
        status: '未开始',
        description: 'replay-flow.spec.js：多轮失败 → 选择锚点 → 接入 → 推进的完整流程。',
        priority: 'high',
      },
      {
        task: 'Chrome 隐私模式 IndexedDB 降级验证',
        status: '未开始',
        description: '验证 IndexedDB 不可用时 localStorage fallback 正确工作。',
        priority: 'medium',
      },
      {
        task: '增加背景音乐',
        status: '未开始',
        description: '寻找或制作适合列车悬疑氛围的循环背景音乐。',
        priority: 'medium',
      },
      {
        task: '增加关键事件音效',
        status: '未开始',
        description: '为关键交互节点（按钮、对话、线索发现、时间警告）增加音效。',
        priority: 'medium',
      },
      {
        task: '增加循环重启音效',
        status: '未开始',
        description: '循环重启时的过渡音效，增强时间循环的感知。',
        priority: 'low',
      },
      {
        task: '许知微判定交互',
        status: '未开始',
        description: '检测到矛盾时许知微主动发起对话，展示判定选项，玩家选择生成推理线索。',
        priority: 'high',
      },
      {
        task: '增强角色对话状态',
        status: '未开始',
        description:
          '角色根据与玩家的对话历史调整态度和信息披露程度。',
        priority: 'medium',
      },
      {
        task: '完善失败后的线索继承',
        status: '已完成',
        description: 'v0.10.0 实现 player_timeline memory 转换 + current_loop_verified 机制。',
        priority: 'medium',
      },
      {
        task: '增加剧情节点配置能力',
        status: '未开始',
        description:
          '建立剧情节点的结构化配置方式，便于扩展故事内容。',
        priority: 'medium',
      },
    ],
  },
  {
    id: 'longterm',
    label: '探索方向',
    description:
      '这些是长期愿景，不是承诺。随着项目发展可能调整或放弃。',
    tasks: [
      {
        task: '扩展至 10 个以上 NPC',
        status: '未开始',
        description:
          '增加更多列车乘客和工作人员角色，每个人有自己的故事线和对话。',
        priority: 'low',
      },
      {
        task: '完成事故真相主线',
        status: '未开始',
        description:
          '完成从开场到揭示事故真相的完整主线叙事。',
        priority: 'low',
      },
      {
        task: '完成多个结局',
        status: '未开始',
        description:
          '根据玩家在不同循环中的行动和发现，导向不同结局。',
        priority: 'low',
      },
      {
        task: '建立角色卡、世界书和剧情节点管理机制',
        status: '未开始',
        description:
          '结构化管理和版本化管理角色卡、世界书和剧情节点配置。',
        priority: 'low',
      },
      {
        task: '建立素材版权记录',
        status: '未开始',
        description:
          '完整记录所有素材的来源、授权方式和用途。',
        priority: 'low',
      },
      {
        task: '探索独立游戏发布方式',
        status: '未开始',
        description: '研究独立的游戏打包和分发方式，降低对特定平台的依赖。',
        priority: 'low',
      },
    ],
  },
];

export default roadmap;
