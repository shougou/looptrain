/**
 * ContentPathPolicy - validates content paths to prevent directory traversal.
 * Spec reference: Section 15
 */

import * as path from 'path';

export function validateContentPath(requestedPath: string, allowedBase: string): boolean {
  const resolved = path.resolve(allowedBase, requestedPath);
  return resolved.startsWith(path.resolve(allowedBase));
}

export const ALLOWED_CONTENT_DIRS = ['characters', 'chapters', 'templates'];

export function isAllowedContentDir(relativePath: string): boolean {
  return ALLOWED_CONTENT_DIRS.includes(relativePath.split(path.sep)[0]);
}

export function isAllowedExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.json' || ext === '.txt';
}
