/**
 * RuntimeId value object with validation.
 *
 * All Runtime IDs MUST satisfy: ^[a-z][a-z0-9_-]*$
 *
 * Prohibited characters: spaces, Chinese, colons, slashes, backslashes, URLs, random natural language.
 */

import { ValidationError } from '../shared/errors';

const ID_PATTERN = /^[a-z][a-z0-9_-]*$/;

export class RuntimeId {
  public readonly value: string;

  constructor(value: string) {
    if (!ID_PATTERN.test(value)) {
      throw new ValidationError(
        `Invalid RuntimeId: "${value}". Must match ${ID_PATTERN.source}`
      );
    }
    this.value = value;
  }

  /**
   * Validates an ID string without throwing.
   * Returns true if the string matches the required pattern.
   */
  static isValid(id: string): boolean {
    return ID_PATTERN.test(id);
  }

  /**
   * Safely creates a RuntimeId, returning null on invalid input.
   */
  static tryCreate(id: string): RuntimeId | null {
    if (RuntimeId.isValid(id)) {
      return new RuntimeId(id);
    }
    return null;
  }

  toString(): string {
    return this.value;
  }

  /**
   * Equality check based on the underlying value.
   */
  equals(other: RuntimeId): boolean {
    return this.value === other.value;
  }
}
