"use strict";
/**
 * Result type for representing success/error outcomes without throwing.
 *
 * Usage:
 *   Result<T, E> = { success: true; value: T } | { success: false; error: E }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.failure = failure;
/**
 * Creates a successful Result.
 */
function success(value) {
    return { success: true, value };
}
/**
 * Creates a failed Result.
 */
function failure(error) {
    return { success: false, error };
}
