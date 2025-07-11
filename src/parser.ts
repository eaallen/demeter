import ts from 'typescript';
import fs from 'fs/promises';

export interface ParamDoc {
  name: string;
  type?: string;
  pattern?: string;
  description?: string;
}

export interface ParsedClass {
  stepName: string;
  params: ParamDoc[];
}

function extractJSDoc(node: ts.Node): { type?: string; pattern?: string; description?: string } {
  const jsDoc = (node as any).jsDoc?.[0];
  if (!jsDoc) return {};
  let type: string | undefined = undefined;
  let pattern: string | undefined = undefined;
  let description = '';
  if (jsDoc.tags) {
    for (const tag of jsDoc.tags) {
      if (tag.tagName.text === 'type') {
        // For @type, use tag.typeExpression if available
        if (tag.typeExpression && tag.typeExpression.type) {
          type = tag.typeExpression.type.getText();
        } else if (tag.comment) {
          type = tag.comment;
        }
      }
      if (tag.tagName.text === 'pattern') {
        pattern = tag.comment || '';
      }
      if (tag.tagName.text === 'description') {
        description = tag.comment || '';
      }
    }
  }
  if (jsDoc.comment && !description) description = jsDoc.comment;
  return { type, pattern, description };
}

export async function parseStepFile(filePath: string, stepName: string): Promise<ParsedClass[]> {
  const content = await fs.readFile(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const result: ParsedClass[] = [];

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && node.name) {
      let params: ParamDoc[] = [];
      for (const member of node.members) {
        if (
          ts.isPropertyDeclaration(member) &&
          member.modifiers?.some(m => ts.isModifier(m) && m.kind === ts.SyntaxKind.StaticKeyword) &&
          member.name.getText() === 'PARAMS' &&
          member.initializer &&
          ts.isObjectLiteralExpression(member.initializer)
        ) {
          for (const prop of member.initializer.properties) {
            console.log("prop text", prop?.name?.getText() ?? "UNKNOWN");
            console.log("prop source", prop?.getSourceFile()?.fileName);
            console.log("prop kind", prop?.kind);
            console.log("prop parent", prop?.parent?.getText());
            // console.log("prop start", prop?.);
            if (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) {
              const name = prop.name.getText().replace(/['"]/g, '');
              const jsdoc = extractJSDoc(prop);
              params.push({ name, ...jsdoc });
            }
          }
        }
      }
      if (params.length) result.push({ params, stepName });
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return result.length ? result : [{params: [], stepName}];
} 