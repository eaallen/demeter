"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mock_fs_1 = __importDefault(require("mock-fs"));
const path_1 = __importDefault(require("path"));
const file_discovery_1 = require("../src/file-discovery");
describe('findStepTypeFiles', () => {
    afterEach(() => mock_fs_1.default.restore());
    it('finds .js files in step-types directories', async () => {
        const root = '/root';
        (0, mock_fs_1.default)({
            '/root/step-types/foo/valid-step.js': 'class Foo {}',
            '/root/other/bar.js': 'class Bar {}',
        });
        const files = await (0, file_discovery_1.findStepTypeFiles)(root);
        expect(files.map(f => path_1.default.basename(f))).toContain('valid-step.js');
        expect(files.map(f => path_1.default.basename(f))).not.toContain('bar.js');
    });
});
