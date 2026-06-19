/**
 * Simple in-memory store for Profile.
 *
 * There is only one profile per runtime instance.
 */

import type { Profile } from './Profile';

export class ProfileStore {
  private profile: Profile | null = null;

  get(): Profile | null {
    return this.profile;
  }

  update(partial: Partial<Omit<Profile, 'version' | 'playerId' | 'createdAt'>>): Profile | null {
    if (!this.profile) return null;
    this.profile = {
      ...this.profile,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    return this.profile;
  }

  set(profile: Profile): void {
    this.profile = profile;
  }
}
