/**
 * Site-wide constants.
 * Single source of truth for site metadata.
 */

export const SITE_NAME = 'LoopTrain 开发日志';
export const SITE_TITLE = 'LoopTrain Devlog';
export const SITE_DOMAIN = 'looptrain.me';
export const SITE_URL = 'https://looptrain.me';
export const SITE_DESCRIPTION =
  'LoopTrain 是一个互动叙事游戏，也是一个 AI 协同开发实验室。本站记录项目试玩、开发日志、AI 工程笔记、版本更新与路线计划。';

export const SITE_OG_IMAGE = '/images/og-default.svg';

export const CURRENT_VERSION = 'v0.8-testplay';
export const CURRENT_PHASE = '独立运行时稳定';
export const CURRENT_YEAR = '2026';

/** Navigation items. Order matters. */
export const NAV_ITEMS = [
  { label: '首页', href: '/' },
  { label: '试玩', href: '/play' },
  { label: '项目状态', href: '/roadmap' },
  { label: '文档库', href: '/docs' },
  { label: '开发日志', href: '/devlog' },
  { label: '角色档案', href: '/characters' },
  { label: '关于', href: '/about' },
] as const;
