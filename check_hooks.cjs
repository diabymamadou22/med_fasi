const ts = require("typescript");
const fs = require("fs");
const path = require("path");

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      if (item !== "node_modules" && item !== "dist") files.push(...walk(full));
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

const hookNames = [
  "useState", "useEffect", "useContext", "useReducer", "useCallback",
  "useMemo", "useRef", "useImperativeHandle", "useLayoutEffect",
  "useDebugValue", "useId", "useTransition", "useDeferredValue"
];

let allHookCalls = [];

for (const file of walk("./src")) {
  const code = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);

  function check(node, parentStack) {
    if (ts.isCallExpression(node)) {
      let name = "";
      if (ts.isIdentifier(node.expression)) name = node.expression.text;
      else if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.name)) name = node.expression.name.text;

      if (hookNames.includes(name) || (name.startsWith("use") && name.length > 3 && name[3] === name[3].toUpperCase())) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        allHookCalls.push({ file, line: line + 1, col: character + 1, hook: name, parents: parentStack.slice() });
      }
    }
    const isScope = ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node);
    let nextStack = parentStack;
    if (isScope) {
      let fnName = "<anonymous>";
      if (ts.isFunctionDeclaration(node) && node.name) fnName = node.name.text;
      else if (node.parent && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) fnName = node.parent.name.text;
      else if (node.parent && ts.isPropertyAssignment(node.parent) && ts.isIdentifier(node.parent.name)) fnName = node.parent.name.text;
      nextStack = [...parentStack, { kind: ts.SyntaxKind[node.kind], name: fnName }];
    }
    ts.forEachChild(node, child => check(child, nextStack));
  }

  check(sourceFile, []);
}

console.log("Total hook calls:", allHookCalls.length);
let suspicious = [];
for (const call of allHookCalls) {
  if (call.parents.length === 0) {
    suspicious.push({ ...call, reason: "Top-level hook call!" });
  } else {
    // Check top enclosing function
    const enclosing = call.parents[call.parents.length - 1];
    // If parents > 1: check if nested inside a non-component, e.g. inside an event handler, callback, etc.
    if (call.parents.length > 1) {
      suspicious.push({ ...call, reason: "Nested function: " + call.parents.map(p => p.name).join(" -> ") });
    } else {
      // Parents length is 1: check if the function name looks like a component or hook
      const isComp = (enclosing.name[0] === enclosing.name[0].toUpperCase() && enclosing.name[0] !== "<");
      const isHook = enclosing.name.startsWith("use");
      if (!isComp && !isHook) {
        suspicious.push({ ...call, reason: "Non-component function: " + enclosing.name });
      }
    }
  }
}
console.log("Suspicious hook calls:", suspicious.length);
for (const s of suspicious) {
  console.log(`${s.file}:${s.line} [${s.hook}] -> ${s.reason}`);
}
