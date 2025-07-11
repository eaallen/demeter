"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const parser_1 = require("../src/parser");
describe('parseStepFile', () => {
    it('extracts type and pattern from JSDoc', async () => {
        const file = path_1.default.join(__dirname, 'fixtures', 'valid-step.js');
        const parsed = await (0, parser_1.parseStepFile)(file);
        expect(parsed.length).toBe(1);
        const params = parsed[0].params;
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('transactionId');
        expect(params[0].type).toBe('string');
        expect(params[0].pattern).toBe('^[A-Z]{2}-\\d{4}$');
    });
});
