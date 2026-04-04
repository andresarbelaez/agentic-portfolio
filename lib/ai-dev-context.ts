/**
 * Detect AI / LLM / agentic-coding tooling on a project for RAG ingest text and chat retrieval boosts.
 */
import type { Project } from "@/types/project";

const TOOL_CHECKS: Array<{ re: RegExp; label: string }> = [
  { re: /\bcursor\b/i, label: "Cursor" },
  { re: /claude code/i, label: "Claude Code" },
  { re: /\bgithub copilot\b/i, label: "GitHub Copilot" },
  { re: /\bcopilot\b/i, label: "Copilot" },
  { re: /\bchatgpt\b/i, label: "ChatGPT" },
  { re: /\bopenai api\b/i, label: "OpenAI API" },
  { re: /\bollama\b/i, label: "Ollama" },
  { re: /\bllama\.cpp\b/i, label: "llama.cpp" },
  { re: /\bvercel ai sdk\b/i, label: "Vercel AI SDK" },
];

function toolStrings(p: Pick<Project, "Tools Used" | "Tech Stack">): string[] {
  return [...(p["Tools Used"] ?? []), ...(p["Tech Stack"] ?? [])];
}

/** Distinct labels for AI-assisted dev tools present on the project. */
export function collectAiAssistedDevToolLabels(
  p: Pick<Project, "Tools Used" | "Tech Stack">
): string[] {
  const found = new Set<string>();
  for (const s of toolStrings(p)) {
    for (const { re, label } of TOOL_CHECKS) {
      if (re.test(s)) found.add(label);
    }
  }
  return [...found];
}

/** True if this project should be force-included for broad “AI experience” style questions. */
export function projectMatchesAiExperienceRetrieval(p: Project): boolean {
  if (p.topics?.some((t) => t.toUpperCase() === "AI")) return true;
  if (collectAiAssistedDevToolLabels(p).length > 0) return true;
  const skillBlob = (p.skills ?? []).join(" ").toLowerCase();
  if (/\brag\b|\bllm\b|machine learning|artificial intelligence|\bai integration\b/i.test(skillBlob)) return true;
  return false;
}

/** Extra ingest sentence so embeddings align with “AI experience” and tool-specific queries. */
export function aiAssistedDevIngestSentence(
  p: Pick<Project, "Tools Used" | "Tech Stack">
): string | undefined {
  const labels = collectAiAssistedDevToolLabels(p);
  if (labels.length === 0) return undefined;
  return `AI-assisted software engineering: used ${labels.join(", ")} (and related workflows) for building and shipping software with model-assisted / agentic development. Relevant for questions about AI tooling experience, Cursor, Claude Code, or similar.`;
}
