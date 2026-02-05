/**
 * Ingest content/resume.md and content/projects.json into a local embedding store.
 * When OPENAI_API_KEY is set: uses OpenAI text-embedding-3-small, writes to data/embeddings.json.
 * Otherwise: uses Ollama nomic-embed-text (requires Ollama running: ollama pull nomic-embed-text).
 *
 * Run: npm run ingest
 * For production: set OPENAI_API_KEY, run ingest, commit data/embeddings.json.
 */
import * as fs from "fs/promises";
import * as path from "path";

const useOpenAI = Boolean(process.env.OPENAI_API_KEY);
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_EMBED_MODEL = "nomic-embed-text";
const OPENAI_EMBED_MODEL = "text-embedding-3-small";
const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const DATA_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(DATA_DIR, "embeddings.json");

type Chunk = {
  id: string;
  content: string;
  embedding: number[];
  source: "resume" | "project";
  projectId?: string;
};

function genId(): string {
  return `chunk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function embedOllama(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_EMBED_MODEL,
      input: texts.length === 1 ? texts[0] : texts,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ollama embed failed: ${res.status} ${t}`);
  }
  const j = (await res.json()) as { embeddings: number[][] };
  return j.embeddings;
}

async function embedOpenAI(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: OPENAI_EMBED_MODEL, input: texts }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI embed failed: ${res.status} ${t}`);
  }
  const j = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return j.data.map((d) => d.embedding);
}

async function embed(texts: string[]): Promise<number[][]> {
  return useOpenAI ? embedOpenAI(texts) : embedOllama(texts);
}

function chunkResume(md: string): string[] {
  const sections = md.split(/\n(?=## )/).filter((s) => s.trim());
  const chunks: string[] = [];
  for (const sec of sections) {
    const trimmed = sec.trim();
    if (trimmed.length < 10) continue;
    chunks.push(trimmed);
  }
  return chunks.length ? chunks : [md.trim()].filter(Boolean);
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  console.log(`Using ${useOpenAI ? "OpenAI " + OPENAI_EMBED_MODEL : "Ollama " + OLLAMA_EMBED_MODEL} for embeddings.`);

  const chunks: Chunk[] = [];
  const BATCH = useOpenAI ? 100 : 5;

  // Resume
  const resumePath = path.join(CONTENT_DIR, "resume.md");
  const resumeRaw = await fs.readFile(resumePath, "utf-8");
  const resumeChunks = chunkResume(resumeRaw);
  for (let i = 0; i < resumeChunks.length; i += BATCH) {
    const batch = resumeChunks.slice(i, i + BATCH);
    const embeddings = await embed(batch);
    for (let j = 0; j < batch.length; j++) {
      chunks.push({
        id: genId(),
        content: batch[j],
        embedding: embeddings[j],
        source: "resume",
      });
    }
  }

  // Projects
  const projectsPath = path.join(CONTENT_DIR, "projects.json");
  const projectsRaw = await fs.readFile(projectsPath, "utf-8");
  type ProjectInput = {
    title: string;
    slug: string;
    url: string;
    skills: string[];
    summary: string;
    context?: string;
    "the solution"?: string;
    evidence?: string;
    topics?: string[];
  };
  const { projects } = JSON.parse(projectsRaw) as { projects: ProjectInput[] };
  for (const p of projects) {
    const solution = p["the solution"];
    const topics = p.topics ?? [];
    const isAiRelated = topics.some((t) => t.toUpperCase() === "AI");
    const content = [
      isAiRelated ? "AI project. Artificial intelligence, machine learning, LLM, RAG. Andrés's AI experience." : "",
      `Project: ${p.title}`,
      `URL: ${p.url}`,
      `Summary: ${p.summary}`,
      p.context ? `Context: ${p.context}` : "",
      `Skills: ${(p.skills || []).join(", ")}`,
      solution ? `Solution: ${solution}` : "",
      p.evidence ? `Evidence: ${p.evidence}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const [emb] = await embed([content]);
    chunks.push({
      id: genId(),
      content,
      embedding: emb,
      source: "project",
      projectId: p.slug,
    });
  }

  await fs.writeFile(
    OUT_FILE,
    JSON.stringify({ chunks }, null, 2),
    "utf-8"
  );
  console.log(`Wrote ${chunks.length} chunks to ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
