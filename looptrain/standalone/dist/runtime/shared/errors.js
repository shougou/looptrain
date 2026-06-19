"use strict";
/**
 * Custom error classes for the LoopTrain Runtime.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisabledProviderError = exports.ValidationError = exports.RuntimeError = void 0;
/**
 * Base runtime error. All custom errors in the runtime inherit from this.
 */
class RuntimeError extends Error {
    constructor(message, code = 'RUNTIME_ERROR') {
        super(message);
        this.name = 'RuntimeError';
        this.code = code;
    }
}
exports.RuntimeError = RuntimeError;
/**
 * Thrown when input validation fails (ID format, missing fields, etc.).
 */
class ValidationError extends RuntimeError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Thrown when attempting to use an LLM provider that is disabled.
 */
class DisabledProviderError extends RuntimeError {
    constructor(message = 'LLM provider is disabled') {
        super(message, 'DISABLED_PROVIDER');
        this.name = 'DisabledProviderError';
    }
}
exports.DisabledProviderError = DisabledProviderError;
