"use strict";
/**
 * RuntimeContentLoader - loads runtime content from materials directories.
 * Reads from looptrain/materials/runtime/ and looptrain/materials/looptrain/.
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
exports.RuntimeContentLoader = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const errors_1 = require("../shared/errors");
const ContentPathPolicy_1 = require("./ContentPathPolicy");
class RuntimeContentLoader {
    constructor(runtimeBase, legacyBase) {
        const repoRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');
        this.runtimeBase = runtimeBase || path.join(repoRoot, 'looptrain', 'materials', 'runtime');
        this.legacyBase = legacyBase || path.join(repoRoot, 'looptrain', 'materials', 'looptrain');
    }
    loadRuntimeJSON(relativePath) {
        this.enforceContentPolicy(relativePath);
        return this.loadJSON(path.join(this.runtimeBase, relativePath));
    }
    loadLegacyJSON(relativePath) {
        this.enforceContentPolicy(relativePath);
        return this.loadJSON(path.join(this.legacyBase, relativePath));
    }
    runtimeFileExists(relativePath) {
        this.enforceContentPolicy(relativePath);
        return fs.existsSync(path.join(this.runtimeBase, relativePath));
    }
    loadRuntimeText(relativePath) {
        this.enforceContentPolicy(relativePath);
        return fs.readFileSync(path.join(this.runtimeBase, relativePath), 'utf-8');
    }
    enforceContentPolicy(relativePath) {
        if (!(0, ContentPathPolicy_1.validateContentPath)(relativePath, this.runtimeBase)) {
            throw new errors_1.ValidationError(`Content path rejected: ${relativePath}`);
        }
        if (!(0, ContentPathPolicy_1.isAllowedExtension)(relativePath)) {
            throw new errors_1.ValidationError(`File extension not allowed: ${relativePath}`);
        }
    }
    loadJSON(fullPath) {
        if (!fs.existsSync(fullPath))
            throw new Error(`Content file not found: ${fullPath}`);
        return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    }
}
exports.RuntimeContentLoader = RuntimeContentLoader;
