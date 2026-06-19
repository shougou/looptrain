"use strict";
/**
 * ContentPathPolicy - validates content paths to prevent directory traversal.
 * Spec reference: Section 15
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_CONTENT_DIRS = void 0;
exports.validateContentPath = validateContentPath;
exports.isAllowedContentDir = isAllowedContentDir;
exports.isAllowedExtension = isAllowedExtension;
const path = __importStar(require("path"));
function validateContentPath(requestedPath, allowedBase) {
    const resolved = path.resolve(allowedBase, requestedPath);
    return resolved.startsWith(path.resolve(allowedBase));
}
exports.ALLOWED_CONTENT_DIRS = ['characters', 'chapters', 'templates'];
function isAllowedContentDir(relativePath) {
    return exports.ALLOWED_CONTENT_DIRS.includes(relativePath.split(path.sep)[0]);
}
function isAllowedExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.json' || ext === '.txt';
}
