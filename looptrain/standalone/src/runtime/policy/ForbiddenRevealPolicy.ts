/**
 * ForbiddenRevealPolicy - permanently forbidden content.
 * Spec reference: Section 15.2
 */

export interface ForbiddenRevealRule {
  contentId: string;
  contentType: 'truth' | 'solution' | 'private_thought' | 'future_identity' | 'developer_only';
  description: string;
  permanent: true;
}

export interface ForbiddenRevealPolicy {
  chapterId: string;
  version: number;
  rules: ForbiddenRevealRule[];
}

export function isPermanentlyForbidden(
  contentId: string,
  policy: ForbiddenRevealPolicy
): boolean {
  return policy.rules.some((r) => r.contentId === contentId);
}

export function filterForbiddenContent<T extends { contentId: string }>(
  items: T[],
  policy: ForbiddenRevealPolicy
): T[] {
  const forbiddenIds = new Set(policy.rules.map((r) => r.contentId));
  return items.filter((item) => !forbiddenIds.has(item.contentId));
}
