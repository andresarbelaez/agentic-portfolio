/**
 * Load data/embeddings.json, embed query via OpenAI or Ollama, return top-k chunks by cosine similarity.
 * Used by app/api/chat/route.ts.
 * When OPENAI_API_KEY is set, uses OpenAI text-embedding-3-small; otherwise Ollama nomic-embed-text.
 */
import * as fs from "fs/promises";
import * as path from "path";

const useOpenAI = Boolean(process.env.OPENAI_API_KEY);
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_EMBED_MODEL = "nomic-embed-text";
const OPENAI_EMBED_MODEL = "text-embedding-3-small";
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

async function embedQueryOllama(query: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input: query }),
  });
  if (!res.ok) throw new Error(`Ollama embed failed: ${res.status}`);
  const j = (await res.json()) as { embeddings: number[][] };
  return j.embeddings[0];
}

async function embedQueryOpenAI(query: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: OPENAI_EMBED_MODEL, input: query }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI embed failed: ${res.status} ${t}`);
  }
  const j = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return j.data[0].embedding;
}

async function embedQuery(query: string): Promise<number[]> {
  return useOpenAI ? embedQueryOpenAI(query) : embedQueryOllama(query);
}

export async function findRelevantChunks(
  query: string,
  topK: number = DEFAULT_TOP_K,
  /** When set, chunks with these projectIds are always included (for AI queries so AI projects are in context). */
  forceIncludeProjectIds?: string[]
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
  const top = withScore.slice(0, topK).map((x) => x.chunk);
  const topIds = new Set(top.map((c) => c.id));

  if (forceIncludeProjectIds?.length) {
    const forceSet = new Set(forceIncludeProjectIds);
    for (const c of chunks) {
      if (c.projectId && forceSet.has(c.projectId) && !topIds.has(c.id)) {
        top.push(c);
        topIds.add(c.id);
      }
    }
  }
  return top;
}
