"use strict";
/**
 * RuntimeId value object with validation.
 *
 * All Runtime IDs MUST satisfy: ^[a-z][a-z0-9_-]*$
 *
 * Prohibited characters: spaces, Chinese, colons, slashes, backslashes, URLs, random natural language.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeId = void 0;
const errors_1 = require("../shared/errors");
const ID_PATTERN = /^[a-z][a-z0-9_-]*$/;
class RuntimeId {
    constructor(value) {
        if (!ID_PATTERN.test(value)) {
            throw new errors_1.ValidationError(`Invalid RuntimeId: "${value}". Must match ${ID_PATTERN.source}`);
        }
        this.value = value;
    }
    /**
     * Validates an ID string without throwing.
     * Returns true if the string matches the required pattern.
     */
    static isValid(id) {
        return ID_PATTERN.test(id);
    }
    /**
     * Safely creates a RuntimeId, returning null on invalid input.
     */
    static tryCreate(id) {
        if (RuntimeId.isValid(id)) {
            return new RuntimeId(id);
        }
        return null;
    }
    toString() {
        return this.value;
    }
    /**
     * Equality check based on the underlying value.
     */
    equals(other) {
        return this.value === other.value;
    }
}
exports.RuntimeId = RuntimeId;
