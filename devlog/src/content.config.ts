import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const devlogCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/devlog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    version: z.string(),
    status: z.enum([
      'idea',
      'planning',
      'doing',
      'done',
      'paused',
      'cancelled',
    ]),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    pinned: z.boolean().default(false),
  }),
});

const changelogCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/changelog' }),
  schema: z.object({
    version: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    pinned: z.boolean().default(false),
  }),
});

const charactersCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/characters' }),
  schema: z.object({
    characterId: z.string(),
    displayName: z.string(),
    publicRole: z.string(),
    date: z.coerce.date().optional(),
    pinned: z.boolean().default(false),
    availability: z.enum(['public', 'locked']).default('public'),
    playtestStatus: z
      .enum(['in-playtest', 'planned', 'partial'])
      .default('partial'),
    portraitAsset: z.string().optional(),
    cardSourceStatus: z.string().default('待确认'),
    tags: z.array(z.string()).default([]),
    spoilerLevel: z.enum(['none', 'mild', 'critical']).default('none'),
    summary: z.string(),
    publicNotes: z.string().optional(),
    relatedDevlog: z.array(z.string()).optional(),
    assetLicenseStatus: z.string().optional(),
  }),
});

const formalDocSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  status: z.enum(['current', 'planned', 'stale', 'legacy', 'deprecated']),
  version: z.string(),
  lastVerified: z.coerce.date(),
  scope: z.string(),
  spoilerLevel: z.enum(['none', 'light', 'internal', 'core']).default('none'),
  tags: z.array(z.string()).default([]),
  summary: z.string(),
  sourceDraft: z.string().optional(),
  pinned: z.boolean().default(false),
});

const designCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/design' }),
  schema: formalDocSchema,
});

const technicalCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/technical' }),
  schema: formalDocSchema,
});

const decisionsCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/decisions' }),
  schema: formalDocSchema.extend({
    decisionId: z.string(),
    deciders: z.array(z.string()).default([]),
    supersedes: z.array(z.string()).default([]),
    supersededBy: z.string().optional(),
  }),
});

export const collections = {
  devlog: devlogCollection,
  changelog: changelogCollection,
  characters: charactersCollection,
  design: designCollection,
  technical: technicalCollection,
  decisions: decisionsCollection,
};
