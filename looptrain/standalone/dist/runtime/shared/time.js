"use strict";
/**
 * ISO-8601 UTC time utilities.
 *
 * On ES2020 target, Date.prototype.toISOString is natively available.
 * This module provides a thin shim that wraps the native implementation
 * and ensures consistent UTC formatting across the runtime.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.nowISO = nowISO;
exports.toISOString = toISOString;
exports.fromTimestamp = fromTimestamp;
/**
 * Returns the current time as an ISO-8601 UTC string.
 * Equivalent to new Date().toISOString().
 */
function nowISO() {
    return new Date().toISOString();
}
/**
 * Formats a Date object as an ISO-8601 UTC string.
 */
function toISOString(date) {
    return date.toISOString();
}
/**
 * Formats a Unix timestamp (milliseconds) as an ISO-8601 UTC string.
 */
function fromTimestamp(ms) {
    return new Date(ms).toISOString();
}
