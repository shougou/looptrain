/**
 * RuntimeContentLoader - loads runtime content from materials directories.
 * Reads from looptrain/materials/runtime/ and looptrain/materials/looptrain/.
 * Spec reference: Section 15
 */

import * as path from 'path';
import * as fs from 'fs';
import { ValidationError } from '../shared/errors';
import { validateContentPath, isAllowedExtension } from './ContentPathPolicy';

export class RuntimeContentLoader {
  private readonly runtimeBase: string;
  private readonly legacyBase: string;

  constructor(runtimeBase?: string, legacyBase?: string) {
    const repoRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');
    this.runtimeBase = runtimeBase || path.join(repoRoot, 'looptrain', 'materials', 'runtime');
    this.legacyBase = legacyBase || path.join(repoRoot, 'looptrain', 'materials', 'looptrain');
  }

  loadRuntimeJSON<T = unknown>(relativePath: string): T {
    this.enforceContentPolicy(relativePath);
    return this.loadJSON<T>(path.join(this.runtimeBase, relativePath));
  }

  loadLegacyJSON<T = unknown>(relativePath: string): T {
    this.enforceContentPolicy(relativePath);
    return this.loadJSON<T>(path.join(this.legacyBase, relativePath));
  }

  runtimeFileExists(relativePath: string): boolean {
    this.enforceContentPolicy(relativePath);
    return fs.existsSync(path.join(this.runtimeBase, relativePath));
  }

  loadRuntimeText(relativePath: string): string {
    this.enforceContentPolicy(relativePath);
    return fs.readFileSync(path.join(this.runtimeBase, relativePath), 'utf-8');
  }

  private enforceContentPolicy(relativePath: string): void {
    if (!validateContentPath(relativePath, this.runtimeBase)) {
      throw new ValidationError(`Content path rejected: ${relativePath}`);
    }
    if (!isAllowedExtension(relativePath)) {
      throw new ValidationError(`File extension not allowed: ${relativePath}`);
    }
  }

  private loadJSON<T>(fullPath: string): T {
    if (!fs.existsSync(fullPath)) throw new Error(`Content file not found: ${fullPath}`);
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as T;
  }
}
