# jsdoc-to-jsonschema

## Overview

This project provides a CLI tool that scans JavaScript source files (specifically, "step-type" classes) for parameter definitions and JSDoc annotations, and generates a JSON Schema representing the structure and validation rules for those step-types. This is useful for automating the creation of schemas for educational or workflow tasks, such as those used in grading rubrics or automated checkers.

## How It Works

- The tool recursively searches for `.js` files in `step-types` directories under a specified root.
- It expects each step-type to be defined as a class with a static `PARAMS` property, where each parameter can be annotated with JSDoc tags (e.g., `@type`, `@pattern`).
- The CLI parses these files, extracts parameter names and validation info, and outputs a JSON Schema file describing the structure and constraints of the tasks.

### Example Step-Type File

```
class PaymentStep {
  /** @static */
  static PARAMS = {
    /** 
     * @type {string}
     * @pattern ^[A-Z]{2}-\d{4}$
     */
    transactionId: {}
  }
} 
```

## Installation

1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd demeter
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Build the project:
   ```sh
   npm run build
   ```

## Usage

Run the CLI to generate a JSON schema from your step-type files:

```
node dist/cli.js --root <path-to-source> --output <output-schema.json>
```

- `--root <dir>`: Root directory to search for `step-types` (default: current directory)
- `--output <file>`: Output file for the generated schema (default: `schema.json`)

### Example

```
npm run build
node dist/cli.js --root /Users/eli/myeducator/ee-atlas/src/power-point --output ppt-schema.json
node dist/cli.js --root /Users/eli/myeducator/ee-atlas/src/word --output word-schema.json
```

You can also use the provided `run.sh` script to automate schema generation for multiple sources.

## Output

The output is a JSON Schema file describing the structure of tasks, rules, and steps, including parameter types and validation patterns extracted from your source code. Example output structure:

```
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "text": { "type": "string" },
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "id": { "type": "string" },
          "text": { "type": "string" },
          "points": { "type": "number" },
          // ...
        }
      }
    }
  }
}
```

## Development

- Source code is in the `src/` directory (TypeScript).
- Build with `npm run build` (outputs to `dist/`).
- TypeScript config: see `tsconfig.json`.

## Testing

- Tests are in the `test/` directory.
- Run all tests with:
  ```sh
  npm test
  ```
- Uses [Jest](https://jestjs.io/) and [ts-jest](https://kulshekhar.github.io/ts-jest/).

## License

MIT 