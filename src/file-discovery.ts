import * as globModule from 'glob';
import * as fs from 'fs/promises';

/**
 * Recursively finds all .js files in step-types directories under the given root.
 */
export async function findStepTypeFiles(rootDir: string): Promise<string[]> {
  return globModule.glob('**/step-types/**/*.js', { cwd: rootDir, absolute: true });
}

export async function findStepTypesViaIndexFile(rootDir: string): Promise<{path: string, stepName: string}[]> {
  const files = await findStepTypeFiles(rootDir);
  const indexFile = files.find(file => file.endsWith('index.js'));
  if (!indexFile) {
    throw new Error('No index.js file found in step-types directory');
  }
  const indexFileContent = await fs.readFile(indexFile, 'utf8');
  
  const foundFiles: {path: string, stepName: string}[] = [];
  for(const path of files) {
    const fileName = fileNameFromPath(path);
    indexFileContent.split('\n').forEach(line => {
      if(line.includes(fileName)) {
        foundFiles.push({path, stepName: extractStepName(line)});
      }
    });
  }
  return foundFiles;
}


function fileNameFromPath(path: string): string {
  return removeExtension(path.split('/').pop() || '');
}

function removeExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

// "export {default as text_font} from './text_font'\r"

function extractStepName(line: string): string {
  const regex = /export\s*\{[^}]*\bas\s+(\w+)\b[^}]*\}\s+from/;
  const match = line.match(regex);
  if(!match) {
    throw new Error(`Failed to extract step name from line: ${line}`);
  }
  return match[1];
}

