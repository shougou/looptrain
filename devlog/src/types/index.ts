export interface DevlogFrontmatter {
  title: string;
  date: Date;
  version: string;
  status: 'idea' | 'planning' | 'doing' | 'done' | 'paused' | 'cancelled';
  tags: string[];
  summary: string;
  pinned?: boolean;
}

export interface ChangelogFrontmatter {
  version: string;
  date: Date;
  summary: string;
  pinned?: boolean;
}

export interface CharacterFrontmatter {
  characterId: string;
  displayName: string;
  publicRole: string;
  date?: Date;
  pinned?: boolean;
  availability: 'public' | 'locked';
  playtestStatus: 'in-playtest' | 'planned' | 'partial';
  portraitAsset?: string;
  cardSourceStatus: string;
  tags: string[];
  spoilerLevel: 'none' | 'mild' | 'critical';
  summary: string;
  publicNotes?: string;
  relatedDevlog?: string[];
  assetLicenseStatus?: string;
}

export interface RoadmapTask {
  task: string;
  status: '未开始' | '进行中' | '已完成' | '暂停' | '废弃';
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RoadmapPhase {
  id: string;
  label: string;
  description: string;
  tasks: RoadmapTask[];
}
