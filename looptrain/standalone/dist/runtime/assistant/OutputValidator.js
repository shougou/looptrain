"use strict";
/**
 * OutputValidator - validates all assistant output before UI rendering.
 * Law 7: Output is untrusted until validated.
 * Spec reference: Sections 13.2-13.3
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = validateSchema;
exports.validateActions = validateActions;
exports.validateClues = validateClues;
exports.validateTone = validateTone;
exports.validateAll = validateAll;
function validateSchema(response) {
    const errors = [];
    if (!response.mode)
        errors.push('Missing mode');
    if (typeof response.visibleText !== 'string')
        errors.push('visibleText must be string');
    if (!Array.isArray(response.actionRefs))
        errors.push('actionRefs must be array');
    if (!Array.isArray(response.clueRefs))
        errors.push('clueRefs must be array');
    if (!Array.isArray(response.beliefRefs))
        errors.push('beliefRefs must be array');
    if (response.stateEffects.length !== 0)
        errors.push('stateEffects must be empty');
    return { valid: errors.length === 0, errors };
}
function validateActions(response, view) {
    const errors = [];
    for (const actionId of response.actionRefs) {
        if (!view.scene.availableActionIds.includes(actionId)) {
            errors.push(`Action ref not in view: ${actionId}`);
        }
    }
    return { valid: errors.length === 0, errors };
}
function validateClues(response, view) {
    const errors = [];
    for (const clueId of response.clueRefs) {
        if (!view.knowledge.confirmedClueIds.includes(clueId)) {
            errors.push(`Clue ref not confirmed: ${clueId}`);
        }
    }
    return { valid: errors.length === 0, errors };
}
function validateTone(response) {
    const errors = [];
    const text = response.visibleText;
    const forbidden = [
        { pattern: /你必须/, label: 'command tone: 你必须' },
        { pattern: /唯一正确/, label: 'absolute claim: 唯一正确' },
        { pattern: /正确答案是/, label: 'absolute claim: 正确答案是' },
        { pattern: /系统提示/, label: 'meta reference: 系统提示' },
        { pattern: /任务已自动完成/, label: 'auto-completion: 任务已自动完成' },
        { pattern: /真凶就是/, label: 'spoiler: 真凶就是' },
        { pattern: /直接去抓/, label: 'command: 直接去抓' },
    ];
    for (const { pattern, label } of forbidden) {
        if (pattern.test(text))
            errors.push(`Forbidden tone: ${label}`);
    }
    return { valid: errors.length === 0, errors };
}
function validateAll(response, view) {
    const allErrors = [];
    for (const result of [validateSchema(response), validateActions(response, view), validateClues(response, view), validateTone(response)]) {
        allErrors.push(...result.errors);
    }
    return { valid: allErrors.length === 0, errors: allErrors };
}
