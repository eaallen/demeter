import { JSONSchema7Definition, JSONSchema7Object } from 'json-schema';
import { ParsedClass } from './parser';

function toSnakeCase(str: string): string {
    return str.replace(/(([a-z])(?=[A-Z][a-zA-Z])|([A-Z])(?=[A-Z][a-z]))/g, '$1_').toLowerCase()

}

export function generateSchema(parsed: ParsedClass[]): object {
    // We'll set up the highlevel, basic properties first
    const rootProperties = {
        title: { type: "string", description: "The title of the task or item." },
        text: { type: "string", description: "A description or instruction for the task." },
        tasks: {
            type: "array",
            description: "An array of tasks or items to be checked when the student submits their work.",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", description: "The name of the task or item." },
                    id: { type: "string", description: "A unique identifier for the task or rule." },
                    text: { type: "string", description: "A description or instruction for the task." },
                    points: { type: "number", description: "The number of points assigned to the task or rule." },
                    rules: {
                        type: "array",
                        description: "An array of rules that apply to the task or item.",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string", description: "The name of the rule." },
                                id: { type: "string", description: "A unique identifier for the rule." },
                                points: { type: "number", description: "Points for this rule." },
                                steps: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        required: ["function"],
                                        allOf: [] as JSONSchema7Object[], // maybe this should be here?
                                        properties: {
                                            function: { enum: Array.from(new Set(parsed.map(p => toSnakeCase(p.stepName)))), description: "The function to execute for this step." },
                                            // params: {
                                            //     type: "object",
                                            //     description: `Parameters for the function. This is pulled from our code base as of ${new Date().toISOString()}`,
                                            //     allOf: [] as JSONSchema7Object[]
                                            // }
                                        },
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };



    const stepsSchema = rootProperties.tasks.items.properties.rules.items.properties.steps.items
    for (const cls of parsed) {
        stepsSchema.allOf.push({
            if: {
                properties: {
                    function: { const: cls.stepName }
                },
                required: ["function"],
            },
            then: {
                properties: {
                    get params() {
                        if (!cls.params.length) {
                            return {}
                        }
                        return {
                            // propertyNames: {
                            //     enum: cls.params.map(p => p.name)
                            // }

                            // additionalProperties: false,
                            properties:
                                cls.params.reduce((acc, param) => {
                                    let typeContainer: { type?: string, pattern?: string } = {}
                                    if(param.type && ['string', 'number', 'boolean'].includes(param.type)) {
                                        typeContainer.type = param.type;
                                    }
                                    if(param.pattern) {
                                        typeContainer.pattern = param.pattern;
                                    }
                                    
                                    return {
                                        ...acc,
                                        [param.name]: {
                                            // type: 'string',
                                            ...typeContainer,
                                            description: param.description || 'Description not specified in source code',
                                            // ...(param.pattern ? { pattern: param.pattern } : {})
                                        }
                                    }
                                }, {})
                        }
                    }
                }
            } as JSONSchema7Object,
        })

    }
    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: rootProperties
    };
} 