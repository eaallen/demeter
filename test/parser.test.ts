import path from 'path';
import { parseStepFile } from '../src/parser';

describe('parseStepFile', () => {
  it('extracts type and pattern from JSDoc', async () => {
    const file = path.join(__dirname, 'fixtures', 'valid-step.js');
    const parsed = await parseStepFile(file);
    expect(parsed.length).toBe(1);
    const params = parsed[0].params;
    expect(params.length).toBe(1);
    expect(params[0].name).toBe('transactionId');
    expect(params[0].type).toBe('string');
    expect(params[0].pattern).toBe('^[A-Z]{2}-\\d{4}$');
  });
}); 