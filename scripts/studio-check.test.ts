// Checks the template checks: `npx tsx scripts/studio-check.test.ts scripts/studio-fixtures/*.tsx`.
// With no arguments it runs them over the whole hand-built library to show
// how strict they are relative to the house style.
import fs from "node:fs";
import path from "node:path";
import { checkTemplate, compileTemplate } from "../api/_studio/check.ts";

const files = process.argv.slice(2);
if (files.length) {
  for (const f of files) {
    const code = fs.readFileSync(f, "utf8");
    const problems = checkTemplate(code);
    console.log(`${path.basename(f)}: ${problems.length ? problems.length + " problem(s)" : "ok"}`);
    for (const p of problems) console.log("   - " + p);
    if (!problems.length) console.log("   compiled bytes:", compileTemplate(code).length);
  }
} else {
  const dir = "src/library/templates/lib";
  const tally = new Map<string, number>();
  let clean = 0;
  const all = fs.readdirSync(dir).filter((f) => f.endsWith(".tsx"));
  for (const f of all) {
    const problems = checkTemplate(fs.readFileSync(path.join(dir, f), "utf8"));
    if (!problems.length) clean++;
    for (const p of problems) {
      const k = p.replace(/^line \d+: /, "").replace(/\(.*?\)|".*?"/g, "…").slice(0, 70);
      tally.set(k, (tally.get(k) ?? 0) + 1);
    }
  }
  console.log(`${clean}/${all.length} library templates pass as-is`);
  for (const [k, n] of [...tally].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(String(n).padStart(4), k);
}
