/**
 * Custom error classes for the LoopTrain Runtime.
 */

/**
 * Base runtime error. All custom errors in the runtime inherit from this.
 */
export class RuntimeError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'RUNTIME_ERROR') {
    super(message);
    this.name = 'RuntimeError';
    this.code = code;
  }
}

/**
 * Thrown when input validation fails (ID format, missing fields, etc.).
 */
export class ValidationError extends RuntimeError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when attempting to use an LLM provider that is disabled.
 */
export class DisabledProviderError extends RuntimeError {
  constructor(message: string = 'LLM provider is disabled') {
    super(message, 'DISABLED_PROVIDER');
    this.name = 'DisabledProviderError';
  }
}
