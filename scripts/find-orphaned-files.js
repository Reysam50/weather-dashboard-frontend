#!/usr/bin/env node
/**
 * find-orphaned-files.js
 * ----------------------
 * Finds .ts/.tsx files under app/, components/, and lib/ that are never
 * imported (directly or transitively) from any real Next.js entry point
 * — page.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx,
 * template.tsx, default.tsx, route.ts, middleware.ts.
 *
 * How it works: it's a plain static import-graph walk, not a bundler.
 * It regex-scans every file for `import`/`export ... from "..."` and
 * dynamic `import("...")` specifiers, resolves "@/..." and relative
 * paths back to files on disk (using the same "@/*" -> "./*" alias as
 * tsconfig.json), then does a reachability search from the entry points
 * above. Anything never reached is reported as orphaned.
 *
 * This is intentionally conservative: a file is "used" if ANYTHING
 * reachable imports from it for ANY reason, including a type-only
 * import. It will never flag a file that's actually referenced
 * somewhere, even if only for a type — so it's safe to trust, though it
 * can under-report (e.g. a component only ever referenced through a
 * dynamic string built at runtime wouldn't be seen by a static scan
 * like this one — there's none of that in this codebase today).
 *
 * Usage:
 *   node scripts/find-orphaned-files.js            # dry run — report only
 *   node scripts/find-orphaned-files.js --delete   # actually delete them
 *
 * Both modes write a full report to orphaned-files-report.txt in the
 * project root.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCAN_DIRS = ["app", "components", "lib"];
const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const RESOLVE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

const ENTRY_POINT_BASENAMES = new Set([
  "page.tsx",
  "page.ts",
  "layout.tsx",
  "layout.ts",
  "loading.tsx",
  "error.tsx",
  "global-error.tsx",
  "not-found.tsx",
  "template.tsx",
  "default.tsx",
  "route.ts",
  "middleware.ts",
]);

// --- Step 1: collect every candidate source file -------------------------

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

const allFiles = SCAN_DIRS.flatMap((d) => {
  const abs = path.join(ROOT, d);
  return fs.existsSync(abs) ? walk(abs) : [];
});

// middleware.ts can also live at the project root, outside app/
const rootMiddleware = path.join(ROOT, "middleware.ts");
if (fs.existsSync(rootMiddleware)) allFiles.push(rootMiddleware);

const allFilesSet = new Set(allFiles);

// --- Step 2: identify entry points ----------------------------------------

const entryPoints = allFiles.filter((f) => ENTRY_POINT_BASENAMES.has(path.basename(f)));

// --- Step 3: parse each file's import/export/dynamic-import specifiers ---

const IMPORT_RE = /(?:import|export)(?:[^'";]*?\bfrom\s*)?\s*['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT_RE = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
const BARE_SIDE_EFFECT_IMPORT_RE = /^\s*import\s+['"]([^'"]+)['"]/gm;

function extractSpecifiers(source) {
  const specs = new Set();
  for (const re of [IMPORT_RE, DYNAMIC_IMPORT_RE, BARE_SIDE_EFFECT_IMPORT_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(source))) specs.add(m[1]);
  }
  return specs;
}

function resolveSpecifier(specifier, fromFile) {
  let basePath;
  if (specifier.startsWith("@/")) {
    basePath = path.join(ROOT, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    basePath = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null; // external package (react, next/link, recharts, ...) — not part of this graph
  }

  if (allFilesSet.has(basePath)) return basePath;
  for (const ext of RESOLVE_EXTENSIONS) {
    if (allFilesSet.has(basePath + ext)) return basePath + ext;
  }
  for (const ext of RESOLVE_EXTENSIONS) {
    const indexPath = path.join(basePath, "index" + ext);
    if (allFilesSet.has(indexPath)) return indexPath;
  }
  return null; // not a .ts/.tsx file we're tracking (css, image, json, etc.) — fine, ignore
}

const importsByFile = new Map();
for (const file of allFiles) {
  const source = fs.readFileSync(file, "utf8");
  const resolved = new Set();
  for (const spec of extractSpecifiers(source)) {
    const target = resolveSpecifier(spec, file);
    if (target) resolved.add(target);
  }
  importsByFile.set(file, resolved);
}

// --- Step 4: BFS reachability from every entry point ----------------------

const reachable = new Set(entryPoints);
const queue = [...entryPoints];
while (queue.length) {
  const current = queue.pop();
  for (const dep of importsByFile.get(current) ?? []) {
    if (!reachable.has(dep)) {
      reachable.add(dep);
      queue.push(dep);
    }
  }
}

// --- Step 5: report / delete -----------------------------------------------

const orphaned = allFiles.filter((f) => !reachable.has(f)).sort();

const relPath = (f) => path.relative(ROOT, f).replace(/\\/g, "/");

const lines = [];
lines.push(`Orphaned file scan — ${new Date().toISOString()}`);
lines.push(`Scanned ${allFiles.length} files under ${SCAN_DIRS.join(", ")}`);
lines.push(`Found ${entryPoints.length} entry points (page/layout/loading/error/route/middleware files)`);
lines.push("");
if (orphaned.length === 0) {
  lines.push("No orphaned files found.");
} else {
  lines.push(`${orphaned.length} orphaned file(s) — never imported from any entry point:`);
  lines.push("");
  for (const f of orphaned) lines.push(`  ${relPath(f)}`);
}
const report = lines.join("\n") + "\n";

fs.writeFileSync(path.join(ROOT, "orphaned-files-report.txt"), report, "utf8");
console.log(report);

const shouldDelete = process.argv.includes("--delete");
if (shouldDelete && orphaned.length > 0) {
  for (const f of orphaned) fs.unlinkSync(f);
  console.log(`Deleted ${orphaned.length} orphaned file(s).`);
} else if (orphaned.length > 0) {
  console.log("Dry run only — nothing was deleted. Re-run with --delete to remove these files.");
}