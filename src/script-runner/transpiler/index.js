import * as acorn from "acorn";
import * as babel from "@babel/core";

import ASTLocationMap from "./ast-location-map";
import SourceMapMap from "./source-map-map";
import TranspilationMap from "./transpilation-map";

/**
 * Internal helper to dump AST nodes into an array
 */
function _traverseAST (ast, nodes) {
  if (Array.isArray(ast)) {
    ast.forEach(n => _traverseAST(n, nodes));
    return nodes;
  }
  if (!ast || !ast.type) {
    return nodes;
  }
  nodes.push(ast);
  Object.keys(ast).forEach(key => _traverseAST(ast[key], nodes));
  return nodes;
}

/**
 * Transpiles raw (ES6) source code down to ES5 and extracts an AST and mapping
 * @param rawCode - raw ES6 code
 * @returns - [the transpiled code, the raw code's AST, and a position mapping]
 */
export default async function transpileScript(rawCode) {

  // transpile the (possibly ES6) code down to ES5
  let rawAST, transpiledCode, sourceMap;
  await new Promise((resolve, reject) => {
    babel.transform(
      rawCode,
      {
        plugins: [],
        presets: [/* "@babel/preset-env" // has browser issue */],
        ast: true,
        generatorOpts: {
          sourceMaps: true
        }
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        rawAST = result.ast;
        transpiledCode = result.code;
        sourceMap = result.map;
        resolve();
      }
    )
  });

  // map the raw source map into something more usable
  const sourceMapMap = new SourceMapMap(sourceMap);

  // get the AST for the transpiled code
  const transpiledAST = acorn.parse(transpiledCode, { locations: true });

  // flatten the ASTs into arrays for easier access
  const rawASTNodes = _traverseAST(rawAST, []);
  const transpiledASTNodes = _traverseAST(transpiledAST, []);

  // map the transpiled code onto the source code
  const rawASTLocationMap = new ASTLocationMap();
  const transpiledToSourceTokenMap = new TranspilationMap();
  rawASTNodes.forEach(node => rawASTLocationMap.addASTNode(node));
  transpiledASTNodes.forEach(node => {
    const rawASTLoc = sourceMapMap.getSourceLocation(node.loc.start);
    const matchedSourceNode = rawASTLocationMap.getMatchingNode(
      node,
      rawASTLoc.line,
      rawASTLoc.column
    );
    transpiledToSourceTokenMap.addToken(
      matchedSourceNode.start,
      matchedSourceNode.end,
      node.start,
      node.end
    );
  });

  return [transpiledCode, rawAST, transpiledToSourceTokenMap];
}
