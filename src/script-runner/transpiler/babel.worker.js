import * as babel from "@babel/core";

// we have to pull in all babel plugins and presets as browser imports and
// include them as direct references
import transformArrowFunctions from "@babel/plugin-transform-arrow-functions";
import transformBlockScoping from "@babel/plugin-transform-block-scoping";
import asyncToPromises from "babel-plugin-transform-async-to-promises";
// import presetEnv from "@babel/preset-env";

/**
 * Expensive transpilation function
 */
function justTranspile (event) {
  const rawCode = event.data;

  babel.transform(
    rawCode,
    {
      plugins: [
        transformArrowFunctions,
        transformBlockScoping,
        asyncToPromises
      ],
      presets: [
        // presetEnv,
      ],
      ast: true,
      generatorOpts: {
        sourceMaps: true
      }
    },
    (error, result) => {
      if (error) {
        self.postMessage({ error });
        return;
      }

      const rawAST = result.ast;
      const transpiledCode = result.code;
      const sourceMap = result.map;

      self.postMessage({ result: [rawAST, transpiledCode, sourceMap] });
    }
  );
}

// hook into message call
self.addEventListener("message", justTranspile);
