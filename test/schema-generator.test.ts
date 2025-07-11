import { generateSchema } from '../src/schema-generator';
import { ParsedClass } from '../src/parser';

describe('generateSchema', () => {
  it('generates correct JSON schema for PARAMS', () => {
    const parsed: ParsedClass[] = [
      {
        className: 'PaymentStep',
        params: [
          {
            name: 'transactionId',
            type: 'string',
            pattern: '^[A-Z]{2}-\\d{4}$',
            description: ''
          }
        ]
      }
    ];
    const schema = generateSchema(parsed);
    expect(schema).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        transactionId: {
          type: 'string',
          pattern: '^[A-Z]{2}-\\d{4}$',
          description: ''
        }
      }
    });
  });
}); 