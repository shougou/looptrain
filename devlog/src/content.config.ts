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
  }),
});

const changelogCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/changelog' }),
  schema: z.object({
    version: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
  }),
});

const charactersCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/characters' }),
  schema: z.object({
    characterId: z.string(),
    displayName: z.string(),
    publicRole: z.string(),
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

export const collections = {
  devlog: devlogCollection,
  changelog: changelogCollection,
  characters: charactersCollection,
};
