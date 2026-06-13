import type { RoadmapPhase } from '../types/index';

const roadmap: RoadmapPhase[] = [
  {
    id: 'current',
    label: '当前阶段：独立运行时稳定',
    description:
      '纯 LT Standalone Runtime 已上线，建立状态持久化、补全 NPC 链路、接入音效系统。',
    tasks: [
      {
        task: '剥离 ST，建立 Standalone MVP',
        status: '已完成',
        description: '已建立 standalone runtime，复用 engine.js。线上 /play/game 已切换到纯 LT Standalone，不再显示 SillyTavern 界面。',
        priority: 'high',
      },
      {
        task: '移除 SillyTavern 原始界面暴露',
        status: '已完成',
        description: '/play/game 进入纯 LT Standalone，公开入口不再呈现任何 ST UI。',
        priority: 'high',
      },
      {
        task: 'LLM Bridge 接入',
        status: '已完成',
        description:
          'DeepSeek + Mock 双模式，API Key 仅在后端环境变量中。',
        priority: 'high',
      },
      {
        task: '完善 LT Runtime 状态保持',
        status: '进行中',
        description:
          '刷新页面后恢复当前轮次、场景、线索、NPC 状态和对话摘要。',
        priority: 'high',
      },
      {
        task: '内容外置化',
        status: '进行中',
        description:
          '将剧情内容、NPC 配置、场景描述从代码中分离为独立数据文件。',
        priority: 'high',
      },
      {
        task: '接入音效系统',
        status: '进行中',
        description:
          '已完成音效系统设计，待接入真实音效素材。',
        priority: 'medium',
      },
      {
        task: '修复角色立绘资源',
        status: '进行中',
        description:
          '立绘路径已迁移到 /assets/，沈墨寒立绘仍存在加载稳定性问题，需压缩优化。',
        priority: 'high',
      },
      {
        task: '完成 3 个 NPC + 1 个隐藏 NPC 试玩链路',
        status: '进行中',
        description:
          '小宁、赵乘警、沈墨寒三个 NPC 的对话和行动链路补全中。',
        priority: 'high',
      },
    ],
  },
  {
    id: 'next',
    label: '下一阶段：体验增强',
    description:
      '在独立运行时稳定的基础上，增强视听体验、叙事深度和角色交互。',
    tasks: [
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
        task: '完善 NPC 自主时间线',
        status: '未开始',
        description: 'NPC 在不同时间点会执行不同动作和对话，增加世界真实感。',
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
        status: '未开始',
        description: '失败结算后保留关键线索，减少重复操作。',
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
