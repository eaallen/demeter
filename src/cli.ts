import { Command, OptionValues } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import { findStepTypeFiles, findStepTypesViaIndexFile } from './file-discovery';
import { parseStepFile, ParsedClass } from './parser';
import { generateSchema } from './schema-generator';

const program = new Command();
program
  .option('--root <dir>', 'Root directory to search', '.')
  .option('--output <file>', 'Output schema file', 'schema.json');

program.action(async (opts: OptionValues) => {
  const root = path.resolve(opts.root);
  console.log(`Searching for step-types in ${root}`);
  const output = path.resolve(opts.output);
  const indexedFiles = await findStepTypesViaIndexFile(root);
  console.log(`Found ${indexedFiles.length} step-types`);

  let allParsed: ParsedClass[] = [];
  for (const file of indexedFiles) {
    const parsed = await parseStepFile(file.path, file.stepName);
    allParsed = allParsed.concat(parsed);
  }
  const schema = generateSchema(allParsed);
  await fs.writeFile(output, JSON.stringify(schema, null, 2), 'utf8');
  console.log(`Schema written to ${output}`);
});

program.parseAsync(process.argv); 