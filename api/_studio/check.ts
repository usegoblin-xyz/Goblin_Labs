// Automatic checks for a generated template, then compilation to the
// CommonJS module the preview sandbox runs.
//
// These checks are about quality (on-brand, deterministic, renderable), not
// security: generated code only ever runs inside the opaque-origin sandbox
// iframe (public/sandbox.html), which is the actual security boundary.
import ts from "typescript";
import { MOTION_EXPORTS } from "./context.js";
import { SFX_NAMES, isSfx } from "../../src/library/sfx-names.js";

export type Problem = string;

const MODULES: Record<string, Set<string> | "motion"> = {
  remotion: new Set(["AbsoluteFill", "Sequence", "Series", "useCurrentFrame", "useVideoConfig", "interpolate", "interpolateColors", "Easing", "random"]),
  react: new Set(["Fragment", "useMemo"]),
  "../../kit": new Set(["list", "TemplateProps"]),
  "../../motion": "motion",
};

// Globals and members a template has no reason to touch. Most break
// determinism (time, randomness, async) or reach outside the frame.
const BANNED_GLOBALS = new Set([
  "Date", "performance", "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "eval", "Function",
  "window", "document", "globalThis", "self", "top", "parent", "frames", "opener", "localStorage",
  "sessionStorage", "indexedDB", "caches", "navigator", "location", "history", "setTimeout",
  "setInterval", "requestAnimationFrame", "queueMicrotask", "require", "process", "Worker",
  "SharedWorker", "importScripts", "postMessage", "Image", "Audio",
]);
const BANNED_MEMBERS = new Set(["constructor", "__proto__", "prototype", "__defineGetter__", "__lookupGetter__"]);
const BANNED_HOOKS = new Set(["useState", "useEffect", "useLayoutEffect", "useRef", "useReducer", "useCallback", "useContext"]);
const COLOUR_RE = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/i;
// Neutral shadows are fine on any kit: rgba(0,0,0,a) only.
const SHADOW_RE = /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*[\d.]+\s*\)/gi;
const COLOUR_NAMES = new Set([
  "white", "black", "red", "green", "blue", "yellow", "orange", "purple", "pink", "gray", "grey",
  "cyan", "magenta", "teal", "navy", "gold", "silver", "brown", "lime", "indigo", "violet",
]);
const FONT_PROPS = new Set(["fontFamily", "font"]);
const MAX_CODE = 60_000;
const MAX_SFX = 30;
const RENDER_LIMITS: [RegExp, string][] = [
  [/\bzIndex\b/, "uses zIndex, which the MP4 export ignores; order elements back to front instead."],
  [/\bbackdropFilter\b/, "uses backdropFilter, which the MP4 export can't draw."],
  [/perspective\(|rotate[XY]\(|rotate3d\(|transformStyle/, "uses a 3D transform (perspective, rotateX/rotateY), which the MP4 export can't draw; use 2D transforms."],
  [/radial-gradient|conic-gradient|repeating-linear-gradient/, "uses a radial, conic or repeating gradient, which the MP4 export can't draw; use linear-gradient, or an SVG <radialGradient> fill inside <svg>."],
  [/\b(?:filter|clipPath|mask|maskImage|WebkitMaskImage)\s*:\s*[`"'][^`"']*url\(#/, "points a CSS filter, clip-path or mask at an SVG element with url(#…), which the MP4 export can't draw; use CSS clip-path shapes or filter functions. (SVG gradient fills inside an <svg> are fine.)"],
];

export function checkTemplate(code: string): Problem[] {
  const problems: Problem[] = [];
  const add = (node: ts.Node | null, msg: string) => {
    if (problems.length >= 20) return;
    if (!node) return void problems.push(msg);
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    problems.push(`line ${line + 1}: ${msg}`);
  };
  if (code.length > MAX_CODE) return [`The file is ${code.length} characters; keep it under ${MAX_CODE}.`];

  const sf = ts.createSourceFile("Template.tsx", code, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
  const syntax = (sf as unknown as { parseDiagnostics?: ts.Diagnostic[] }).parseDiagnostics ?? [];
  for (const d of syntax.slice(0, 5)) {
    const pos = d.start != null ? sf.getLineAndCharacterOfPosition(d.start).line + 1 : 0;
    problems.push(`line ${pos}: syntax error: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
  }
  if (syntax.length) return problems;

  // Names the file declares itself, so a local `top` or `frames` isn't
  // mistaken for the browser global of the same name.
  const declared = new Set<string>();
  const collect = (n: ts.Node) => {
    if ((ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n) || ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n)) && n.name && ts.isIdentifier(n.name)) declared.add(n.name.text);
    if (ts.isImportSpecifier(n)) declared.add(n.name.text);
    ts.forEachChild(n, collect);
  };
  collect(sf);

  let hasDefault = false;
  let sfxCount = 0;
  const called = new Set<string>();

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      const from = (node.moduleSpecifier as ts.StringLiteral).text;
      const allowed = MODULES[from];
      if (!allowed) add(node, `imports "${from}", which isn't available. Use only remotion, react, ../../kit and ../../motion.`);
      else {
        const names: string[] = [];
        const clause = node.importClause;
        if (clause?.name) add(node, `uses a default import from "${from}"; use named imports.`);
        const nb = clause?.namedBindings;
        if (nb && ts.isNamespaceImport(nb)) add(node, `uses "import * as" from "${from}"; import names individually.`);
        if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) names.push((el.propertyName ?? el.name).text);
        for (const n of names) {
          const ok = allowed === "motion" ? MOTION_EXPORTS.has(n) : allowed.has(n);
          if (!ok) add(node, `imports "${n}" from "${from}", which isn't exported there or isn't allowed.`);
        }
      }
    } else if (ts.isExportAssignment(node) || (ts.isFunctionDeclaration(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword))) {
      hasDefault = true;
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) add(node, "uses dynamic import().");
      if (ts.isIdentifier(node.expression)) {
        called.add(node.expression.text);
        if (BANNED_HOOKS.has(node.expression.text)) add(node, `uses ${node.expression.text}; templates must be pure functions of time with no state or effects.`);
      }
    } else if (ts.isPropertyAccessExpression(node)) {
      const obj = node.expression.getText(sf);
      const prop = node.name.text;
      if (obj === "Math" && prop === "random") add(node, "uses Math.random; use hash(...) from ../../motion for deterministic randomness.");
      if (BANNED_MEMBERS.has(prop)) add(node, `accesses .${prop}.`);
    } else if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression) && BANNED_MEMBERS.has(node.argumentExpression.text)) {
      add(node, `accesses ["${node.argumentExpression.text}"].`);
    } else if (ts.isIdentifier(node) && BANNED_GLOBALS.has(node.text) && !declared.has(node.text) && isGlobalRef(node)) {
      add(node, `uses ${node.text}, which templates can't use.`);
    } else if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(sf) === "Sfx") {
      sfxCount++;
      const attrs = new Map<string, ts.JsxAttribute>();
      for (const a of node.attributes.properties) if (ts.isJsxAttribute(a)) attrs.set(a.name.getText(sf), a);
      const nameAttr = attrs.get("name")?.initializer;
      const name = nameAttr && ts.isStringLiteral(nameAttr) ? nameAttr.text : null;
      if (name === null) add(node, `<Sfx> needs name="…" written as a plain string, one of: ${SFX_NAMES.join(", ")}.`);
      else if (!isSfx(name)) add(node, `<Sfx name="${name}"> isn't in the sound library. Use one of: ${SFX_NAMES.join(", ")}.`);
      if (!attrs.has("at")) add(node, "<Sfx> needs at={seconds}.");
      for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
        const el = ts.isJsxElement(p) ? p.openingElement : null;
        if (el && /^(Sequence|Series\.Sequence|Series)$/.test(el.tagName.getText(sf))) {
          add(node, "<Sfx> is inside a Sequence, which shifts its timing. Put every <Sfx> at the top level of the returned tree.");
          break;
        }
      }
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sf);
      if (name === "dangerouslySetInnerHTML") add(node, "uses dangerouslySetInnerHTML.");
      if (/^on[A-Z]/.test(name)) add(node, `sets the event handler ${name}; templates aren't interactive.`);
      if (name === "src" || name === "href" || name === "xlinkHref") add(node, `sets ${name}; templates can't load images or links.`);
      if (FONT_PROPS.has(name) && node.initializer && ts.isStringLiteral(node.initializer)) add(node, `hard-codes a font (${name}="${node.initializer.text}"); use fontOf(b), MONO or SERIF.`);
    } else if (ts.isPropertyAssignment(node) && FONT_PROPS.has(propName(node.name)) && isStringy(node.initializer)) {
      add(node, `hard-codes a font in ${propName(node.name)}; use fontOf(b), MONO or SERIF.`);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const text = node.text;
      const inImport = ts.isImportDeclaration(node.parent);
      if (!inImport && COLOUR_RE.test(text.replace(SHADOW_RE, ""))) add(node, `hard-codes a colour ("${text.slice(0, 40)}"); use palette(b) colours with alpha() or mix().`);
      if (!inImport && COLOUR_NAMES.has(text.trim().toLowerCase()) && looksLikeColourSlot(node)) add(node, `uses the colour name "${text}"; use palette(b) colours.`);
      if (/url\s*\(|https?:\/\//i.test(text) && !inImport) add(node, "references a URL; templates can't load external assets.");
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (!hasDefault) add(null, "has no default export; export the component with `export default function`.");
  // Things the MP4 renderer can't draw (see the guide's "Rendering to MP4").
  for (const [re, msg] of RENDER_LIMITS) if (re.test(code)) add(null, msg);
  if (sfxCount > MAX_SFX) add(null, `uses ${sfxCount} sound effects; keep it to ${MAX_SFX} or fewer.`);
  if (!called.has("palette")) add(null, "never calls palette(b); every colour must come from the brand kit.");
  if (!called.has("nameOf")) add(null, "never calls nameOf(b); the video has to end on the brand name.");
  if (!called.has("useT") && !called.has("useCurrentFrame")) add(null, "never reads the time (useT() or useCurrentFrame()), so nothing can animate.");
  return problems;

  function isGlobalRef(id: ts.Identifier) {
    const p = id.parent;
    if (ts.isPropertyAccessExpression(p) && p.name === id) return false; // x.window
    if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isMethodDeclaration(p)) && p.name === id) return false; // { window: 1 }
    if (ts.isJsxAttribute(p)) return false;
    if (ts.isTypeReferenceNode(p) || ts.isQualifiedName(p)) return false;
    if ((ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isBindingElement(p) || ts.isFunctionDeclaration(p)) && p.name === id) return false;
    return true;
  }
}

function propName(n: ts.PropertyName) {
  return ts.isIdentifier(n) || ts.isStringLiteral(n) ? n.text : "";
}
function isStringy(e: ts.Expression) {
  return ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) || ts.isTemplateExpression(e);
}
// A bare word like "white" is only a problem where a colour goes.
function looksLikeColourSlot(node: ts.Node) {
  const p = node.parent;
  const slot = /^(color|background|backgroundColor|fill|stroke|borderColor|outlineColor|stopColor|floodColor|caretColor|textDecorationColor)$/;
  if (ts.isPropertyAssignment(p)) return slot.test(propName(p.name));
  if (ts.isJsxAttribute(p)) return slot.test(p.name.getText());
  return false;
}

// TSX → CommonJS for the sandbox. `require` there resolves the four allowed
// modules to the copies bundled into the sandbox page.
export function compileTemplate(code: string): string {
  const out = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      isolatedModules: true,
    },
    fileName: "Template.tsx",
  });
  return out.outputText;
}
