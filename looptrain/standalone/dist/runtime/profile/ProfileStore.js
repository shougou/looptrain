"use strict";
/**
 * Simple in-memory store for Profile.
 *
 * There is only one profile per runtime instance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileStore = void 0;
class ProfileStore {
    constructor() {
        this.profile = null;
    }
    get() {
        return this.profile;
    }
    update(partial) {
        if (!this.profile)
            return null;
        this.profile = {
            ...this.profile,
            ...partial,
            updatedAt: new Date().toISOString(),
        };
        return this.profile;
    }
    set(profile) {
        this.profile = profile;
    }
}
exports.ProfileStore = ProfileStore;
