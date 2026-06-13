import type { RoadmapPhase } from '../types/index';

const roadmap: RoadmapPhase[] = [
  {
    id: 'current',
    label: '当前阶段：试玩版稳定',
    description:
      '修复移动端体验问题，梳理游戏结构，建立最小可用试玩闭环。',
    tasks: [
      {
        task: '剥离 ST，建立 Standalone MVP',
        status: '进行中',
        description: '已建立本地 standalone 原型，复用 engine.js 跑通 Mock 成功路径和失败/下一轮路径；线上入口暂未切换。',
        priority: 'high',
      },
      {
        task: '隐藏 SillyTavern 原始界面',
        status: '进行中',
        description: 'Game Shell 模式下完全隐藏 ST 界面；长期目标是 /play/game 进入纯 LT Standalone。',
        priority: 'high',
      },
      {
        task: '修复移动端遮罩问题',
        status: '进行中',
        description:
          '移动端开场字幕、遮罩在不同屏幕尺寸下的错位和裁剪问题。',
        priority: 'high',
      },
      {
        task: '修复小宁立绘资源 404',
        status: '进行中',
        description:
          '立绘资源路径指向未部署的旧路径，需统一到 /scripts/extensions/third-party/LoopTrain/。',
        priority: 'high',
      },
      {
        task: '梳理 LT 控制层和 ST 引擎层边界',
        status: '已完成',
        description:
          '明确 LoopTrain 控制层的职责范围与 SillyTavern 引擎层的边界。',
        priority: 'high',
      },
      {
        task: 'LLM Raw Bridge 切换',
        status: '已完成',
        description:
          '从 generateQuietPrompt 改为 generateRaw，不依赖 ST 当前 chat_name 或 chat file。',
        priority: 'medium',
      },
      {
        task: '接入基础音效系统',
        status: '进行中',
        description:
          '已完成第一版音效系统设计：AudioManager、audio manifest、事件绑定、声音开关和第一批占位素材清单。',
        priority: 'medium',
      },
      {
        task: '完成基础失败结算卡',
        status: '未开始',
        description:
          '列车爆炸后显示结算页面，保留已获得线索，允许重新开始循环。',
        priority: 'medium',
      },
      {
        task: '完成 3 个 NPC + 1 个隐藏 NPC 试玩链路',
        status: '进行中',
        description:
          '确保小宁、赵乘警、沈墨寒三个 NPC 在试玩版中有完整可触发的对话和行动链路。',
        priority: 'high',
      },
      {
        task: '优化开场字幕和移动端竖屏表现',
        status: '未开始',
        description:
          '开场字幕的竖屏排版、字体大小、淡入淡出时序在移动端的优化。',
        priority: 'low',
      },
    ],
  },
  {
    id: 'next',
    label: '下一阶段：体验增强',
    description:
      '在试玩版稳定的基础上，增强视听体验、叙事深度和角色交互。',
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
    label: '长期阶段：完整游戏探索',
    description:
      '探索将 LoopTrain 从试玩版发展为完整叙事解谜游戏的可能性。',
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
