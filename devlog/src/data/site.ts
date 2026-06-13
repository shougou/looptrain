/**
 * Site-wide constants.
 * Single source of truth for site metadata.
 */

export const SITE_NAME = 'LoopTrain 开发日志';
export const SITE_TITLE = 'LoopTrain Devlog';
export const SITE_DOMAIN = 'looptrain.me';
export const SITE_URL = 'https://looptrain.me';
export const SITE_DESCRIPTION =
  'LoopTrain 是一款个人长期开发的互动叙事解谜游戏项目。本站记录项目试玩、开发日志、版本更新、设计笔记与路线计划。';
export const SITE_OG_IMAGE = '/images/og-default.svg';

export const CURRENT_VERSION = 'v0.4.3';
export const CURRENT_PHASE = '试玩版稳定';
export const CURRENT_YEAR = '2026';

/** Navigation items. Order matters. */
export const NAV_ITEMS = [
  { label: '首页', href: '/' },
  { label: '试玩', href: '/play' },
  { label: '开发日志', href: '/devlog' },
  { label: '路线图', href: '/roadmap' },
  { label: '更新记录', href: '/changelog' },
  { label: '角色', href: '/characters' },
  { label: '关于', href: '/about' },
] as const;
