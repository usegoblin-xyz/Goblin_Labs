// Builds the cached part of the generation prompt from the real library
// sources, so the guide Claude follows can never drift from the code it has
// to compile against. Files are shipped with the function via
// vercel.json → functions["api/studio-generate.ts"].includeFiles.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { GUIDE } from "./guide.js";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

// Three hand-built templates that follow every rule in the guide, chosen to
// cover a vertical layout, a product story and a data story.
export const EXAMPLES = [
  { file: "src/library/templates/lib/PortraitReel.tsx", note: "9:16, 1080x1920, 9.5 s, fields: words (comma list), role" },
  { file: "src/library/templates/lib/FeatureTeaser.tsx", note: "16:9, 1920x1080, 13 s, fields: shipped (comma list), next, teaser, date" },
  { file: "src/library/templates/lib/StatsReel.tsx", note: "16:9, 1920x1080, 10.5 s, fields: stat, statLabel, bars, share, tagline" },
];

function exportsOf(file: string): Set<string> {
  const sf = ts.createSourceFile(file, read(file), ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
  const names = new Set<string>();
  sf.forEachChild((n) => {
    const exported = (n as ts.HasModifiers).modifiers?.some?.((m: ts.ModifierLike) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (ts.isExportDeclaration(n) && n.exportClause && ts.isNamedExports(n.exportClause)) n.exportClause.elements.forEach((e) => names.add(e.name.text));
    if (!exported) return;
    if ((ts.isFunctionDeclaration(n) || ts.isTypeAliasDeclaration(n)) && n.name) names.add(n.name.text);
    if (ts.isVariableStatement(n)) n.declarationList.declarations.forEach((d) => ts.isIdentifier(d.name) && names.add(d.name.text));
  });
  return names;
}

export const MOTION_EXPORTS = exportsOf("src/library/motion.tsx");

// The examples ship with soundtracks; generated templates have none, so the
// copies Claude sees drop the Track element and import.
export function exampleSource(file: string) {
  return read(file)
    .replace(/^\s*<Track [^>]*\/>\s*\n/gm, "")
    .replace(/\bTrack, /, "")
    .replace(/, Track\b/, "")
    .replace(/, audio \}/, " }");
}

let cached: string | null = null;
export function systemPrompt(): string {
  if (cached) return cached;
  const parts = [
    GUIDE,
    "# The brand kit type (src/library/brand.ts, excerpt)",
    "```ts\n" + read("src/library/brand.ts").split("// ---- color helpers")[0].split("export const PRESETS")[0].trim() + "\n```",
    "# ../../kit (src/library/kit.ts)",
    "```ts\n" + read("src/library/kit.ts").trim() + "\n```",
    "# ../../motion (src/library/motion.tsx), the helpers you build with",
    "```tsx\n" + read("src/library/motion.tsx").trim() + "\n```",
    "# Example templates from the library",
    ...EXAMPLES.map((e) => `## ${path.basename(e.file)} (${e.note})\n\`\`\`tsx\n${exampleSource(e.file).trim()}\n\`\`\``),
  ];
  cached = parts.join("\n\n");
  return cached;
}
