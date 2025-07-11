"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schema_generator_1 = require("../src/schema-generator");
describe('generateSchema', () => {
    it('generates correct JSON schema for PARAMS', () => {
        const parsed = [
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
        const schema = (0, schema_generator_1.generateSchema)(parsed);
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
