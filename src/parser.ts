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

  function findVariableDeclarationInitializerObjectLiteral(identifierName: string): ts.ObjectLiteralExpression | undefined {
    let foundInitializer: ts.ObjectLiteralExpression | undefined;
    function walk(node: ts.Node) {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === identifierName) {
        if (node.initializer) {
          if (ts.isObjectLiteralExpression(node.initializer)) {
            foundInitializer = node.initializer;
            return; // stop searching deeper for this branch
          }
          if (ts.isIdentifier(node.initializer)) {
            const nested = findVariableDeclarationInitializerObjectLiteral(node.initializer.text);
            if (nested) {
              foundInitializer = nested;
              return;
            }
          }
        }
      }
      ts.forEachChild(node, walk);
    }
    walk(sourceFile);
    return foundInitializer;
  }

  function getClassStaticPropertyObjectLiteral(className: string, propertyName: string): ts.ObjectLiteralExpression | undefined {
    let target: ts.ObjectLiteralExpression | undefined;
    function walk(node: ts.Node) {
      if (ts.isClassDeclaration(node) && node.name?.text === className) {
        for (const member of node.members) {
          if (
            ts.isPropertyDeclaration(member) &&
            member.modifiers?.some(m => ts.isModifier(m) && m.kind === ts.SyntaxKind.StaticKeyword) &&
            member.name.getText() === propertyName &&
            member.initializer &&
            ts.isObjectLiteralExpression(member.initializer)
          ) {
            target = member.initializer;
            return;
          }
        }
      }
      ts.forEachChild(node, walk);
    }
    walk(sourceFile);
    return target;
  }

  function resolveObjectLiteralFromExpression(expr: ts.Expression): ts.ObjectLiteralExpression | undefined {
    if (ts.isObjectLiteralExpression(expr)) return expr;
    if (ts.isIdentifier(expr)) {
      return findVariableDeclarationInitializerObjectLiteral(expr.text);
    }
    if (ts.isPropertyAccessExpression(expr)) {
      const right = expr.name.text;
      const left = expr.expression;
      if (ts.isIdentifier(left)) {
        const className = left.text;
        console.log("className", className);
        const importedModules = getImportedModules(sourceFile);
        const importedDeclarations = getImportDeclarations(sourceFile);
        console.log("importedModules", importedModules);
        return getClassStaticPropertyObjectLiteral(className, right);
      }
    }
    return undefined;
  }

  function flattenObjectProperties(objectLiteral: ts.ObjectLiteralExpression): ts.ObjectLiteralElementLike[] {
    const flattened: ts.ObjectLiteralElementLike[] = [];
    for (const prop of objectLiteral.properties) {
      if (ts.isSpreadAssignment(prop)) {
        console.warn("prop is spread", prop.getText());
        
        const resolved = resolveObjectLiteralFromExpression(prop.expression);
        if (resolved) {
          flattened.push(...flattenObjectProperties(resolved));
        }
        // If unresolved, skip for simplicity
        continue;
      }
      flattened.push(prop);
    }
    return flattened;
  }

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
          const flattenedProps = flattenObjectProperties(member.initializer);
          for (const prop of flattenedProps) {
            console.log("prop is spread", ts.isSpreadAssignment(prop));
            console.log("prop is is objkect literls expression", ts.isObjectLiteralExpression(prop));
            console.log("prop is isIdentifier", ts.isIdentifier(prop));
            console.log("prop is isPropertyAccessExpression", ts.isPropertyAccessExpression(prop));
            console.log("prop text", prop.getText() ?? "UNKNOWN");
            console.log("prop source", prop?.getSourceFile()?.fileName);
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


function propIsACommonParamsDict(prop: ts.ObjectLiteralElementLike) {
  return ts.isSpreadAssignment(prop) && prop.expression.getText() === "COMMON_PARAMS";
}

function getImportDeclarations(sourceFile: ts.SourceFile): ts.ImportDeclaration[] {
  return sourceFile.statements.filter(ts.isImportDeclaration) as ts.ImportDeclaration[];
}

function getImportedModules(sourceFile: ts.SourceFile): string[] {
  return getImportDeclarations(sourceFile).map(
    d => (d.moduleSpecifier as ts.StringLiteral).text
  );
}

function getDeclFileForExpression(
  expr: ts.Expression,
  checker: ts.TypeChecker
): string | undefined {
  // Normalize to the identifier being referenced
  let target: ts.Node = expr;
  if (ts.isCallExpression(expr) || ts.isNewExpression(expr)) target = expr.expression;
  if (ts.isPropertyAccessExpression(target)) target = target.name; // the right-most identifier
  // For element access, the symbol is often on the expression, not the argument
  if (ts.isElementAccessExpression(target)) target = target.expression;

  // Try direct symbol; fall back to type symbol
  let symbol =
    checker.getSymbolAtLocation(target) ??
    checker.getTypeAtLocation(target).getSymbol();
  if (!symbol) return;

  // Follow import/re-export chains
  if (symbol.flags & ts.SymbolFlags.Alias) {
    const aliased = checker.getAliasedSymbol(symbol);
    if (aliased) symbol = aliased;
  }

  const decl = symbol.valueDeclaration ?? symbol.declarations?.[0];
  return decl?.getSourceFile().fileName;
}

