import mock from 'mock-fs';
import path from 'path';
import { findStepTypeFiles } from '../src/file-discovery';

describe('findStepTypeFiles', () => {
  afterEach(() => mock.restore());

  it('finds .js files in step-types directories', async () => {
    const root = '/root';
    mock({
      '/root/step-types/foo/valid-step.js': 'class Foo {}',
      '/root/other/bar.js': 'class Bar {}',
    });
    const files = await findStepTypeFiles(root);
    expect(files.map(f => path.basename(f))).toContain('valid-step.js');
    expect(files.map(f => path.basename(f))).not.toContain('bar.js');
  });
}); 