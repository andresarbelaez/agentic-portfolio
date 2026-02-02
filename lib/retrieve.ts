/**
 * Load data/embeddings.json, embed query via Ollama, return top-k chunks by cosine similarity.
 * Used by app/api/chat/route.ts.
 */
import * as fs from "fs/promises";
import * as path from "path";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const EMBED_MODEL = "nomic-embed-text";
const DEFAULT_TOP_K = 6;

export type StoredChunk = {
  id: string;
  content: string;
  embedding: number[];
  source: "resume" | "project";
  projectId?: string;
};

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const den = Math.sqrt(na) * Math.sqrt(nb);
  return den === 0 ? 0 : dot / den;
}

async function embedQuery(query: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: query }),
  });
  if (!res.ok) throw new Error(`Ollama embed failed: ${res.status}`);
  const j = (await res.json()) as { embeddings: number[][] };
  return j.embeddings[0];
}

export async function findRelevantChunks(
  query: string,
  topK: number = DEFAULT_TOP_K
): Promise<StoredChunk[]> {
  const dataPath = path.join(process.cwd(), "data", "embeddings.json");
  let raw: string;
  try {
    raw = await fs.readFile(dataPath, "utf-8");
  } catch {
    return [];
  }
  const { chunks } = JSON.parse(raw) as { chunks: StoredChunk[] };
  if (!chunks?.length) return [];

  const queryEmbedding = await embedQuery(query);
  const withScore = chunks.map((c) => ({
    chunk: c,
    score: cosineSimilarity(c.embedding, queryEmbedding),
  }));
  withScore.sort((a, b) => b.score - a.score);
  return withScore.slice(0, topK).map((x) => x.chunk);
}
