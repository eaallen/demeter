import ts from "typescript";
import path from "path";
const ROOT_DIR = "/Users/eli/myeducator/ee-atlas/src/";
const ROOT_FILE = ROOT_DIR + "power-point/grade-assignment/step-types/index.js";
const MAX_DEPTH = Infinity;

const visitedNodes = new Map();

export function run() {
    console.log("... running ...");

    // console.log(program.emit());


    handleNode(ROOT_FILE);

    console.log("visited nodes", visitedNodes.keys());
}

function buildProgram(path) {
    const compilerOptions = {
        allowJs: true,
        outDir: "/Users/eli/code/demeter/dist2",
    }
    const host = ts.createCompilerHost(compilerOptions);
    return ts.createProgram([path], compilerOptions, host)

}

/**
 * 
 * @param {string} path 
 * @param {number} depth 
 */
function handleNode(path, depth = 0) {
    console.log("welcome to ", path);
    if (visitedNodes.get(path)) {
        return;
    }
    visitedNodes.set(path, true);
    const sourceFile = buildProgram(path).getSourceFile(path);

    console.log("---.", sourceFile ? true : false);

    // for(const statement of sourceFile.statements){
    //     console.log("--------------------------------");
    //     console.log("statement------------------->", statement.name?.escapedText);
    //     console.log("--------------------------------");
    // }


    if (depth >= MAX_DEPTH) {
        return;
    }
    if (sourceFile?.imports) {
        sourceFile.imports
            .map(item=> importFullPath(sourceFile.fileName, item.text))
            .filter(Boolean)
            .forEach(item=> handleNode(item, depth + 1));
    }


}

/**
 * 
 * @param {string} sourceFilePath 
 * @param {string} importsPath 
 * 
 */
function importFullPath(sourceFilePath, importsPath) {
    if (importsPath.startsWith("./") || importsPath.startsWith("../") || importsPath.startsWith("@/")) {
        if (importsPath.startsWith("@/")) {
            return givePathFileExtension(ROOT_DIR + importsPath.substring(2));
        }
        return givePathFileExtension(path.resolve(path.dirname(sourceFilePath), importsPath));
    }else{
        return null
    }
}


/**
 * 
 * @param {string} path 
 * @returns {string}
 */
function givePathFileExtension(path) {
    // do nothing if path already has a file extension
    if (/\.[^/.]+$/g.test(path)) {
        return path;
    }
    if (isDir(path)) {
        return path + "/index.js";
    }
    return path + ".js";
}


import { lstatSync } from 'fs';
/**
 * @param {string} path - The path.
 * @returns {boolean} Whether path is a directory, otherwise always false.
 */
function isDir(path) {
    try {
        const stat = lstatSync(path);
        return stat.isDirectory();
    } catch (e) {
        // lstatSync throws an error if path doesn't exist
        return false;
    }
}




