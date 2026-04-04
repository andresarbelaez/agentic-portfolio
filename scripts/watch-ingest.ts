/**
 * Watches content sources and re-runs `npm run ingest` after edits (debounced).
 * Keeps data/embeddings.json aligned with resume + projects without manual steps.
 *
 * Run: npm run ingest:watch
 * (Uses OPENAI_API_KEY from the environment or from .env.local via the ingest script.)
 */
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const WATCH_FILES = [path.join(CONTENT_DIR, "resume.md"), path.join(CONTENT_DIR, "projects.json")];

const DEBOUNCE_MS = 1500;
let timer: ReturnType<typeof setTimeout> | null = null;
let running = false;
let pending = false;

function runIngest(): void {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  pending = false;
  console.log("\n[ingest:watch] Running npm run ingest…\n");
  const child = spawn("npm", ["run", "ingest"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  child.on("exit", (code) => {
    running = false;
    if (code !== 0) {
      console.error(`[ingest:watch] ingest exited with code ${code}`);
    } else {
      console.log("[ingest:watch] Embeddings updated (data/embeddings.json). Commit when ready.\n");
    }
    if (pending) {
      schedule();
    }
  });
}

function schedule(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    runIngest();
  }, DEBOUNCE_MS);
}

for (const file of WATCH_FILES) {
  if (!fs.existsSync(file)) {
    console.warn(`[ingest:watch] Missing (skipping watch): ${path.relative(ROOT, file)}`);
    continue;
  }
  fs.watch(file, { persistent: true }, () => {
    console.log(`[ingest:watch] Change detected: ${path.relative(ROOT, file)}`);
    schedule();
  });
}

console.log("[ingest:watch] Watching:");
for (const f of WATCH_FILES) {
  if (fs.existsSync(f)) console.log(`  - ${path.relative(ROOT, f)}`);
}
console.log(`[ingest:watch] Debounce ${DEBOUNCE_MS}ms. Press Ctrl+C to stop.\n`);
