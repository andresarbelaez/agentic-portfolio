import { findRelevantChunks } from "@/lib/retrieve";
import { getProjects } from "@/lib/projects";
import { projectMatchesAiExperienceRetrieval } from "@/lib/ai-dev-context";
import { streamText, convertToModelMessages, generateId } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider-v2";
import * as fs from "fs/promises";
import * as path from "path";

export const maxDuration = 30;

const useOpenAI = Boolean(process.env.OPENAI_API_KEY);
const openai = createOpenAI();

const ollamaBase = process.env.OLLAMA_URL ?? "http://localhost:11434";
const ollama = createOllama({
  baseURL: ollamaBase.replace(/\/?$/, "") + "/api",
});

const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "llama3.2";

async function loadSystemPrompt(): Promise<string> {
  const p = path.join(process.cwd(), "content", "agent-system-prompt.md");
  try {
    const raw = await fs.readFile(p, "utf-8");
    return raw.replace(/^<!--[\s\S]*?-->/, "").trim();
  } catch {
    return "You represent the portfolio owner. Use only the provided context to answer. If you have no relevant context, say so. Keep answers clear and recruiter-friendly.";
  }
}

function lastUserText(messages: Array<{ role?: string; content?: unknown; parts?: Array<{ type?: string; text?: string }> }>): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "";
  if (typeof lastUser.content === "string") return lastUser.content;
  if (Array.isArray(lastUser.content)) {
    return (lastUser.content as Array<{ type?: string; text?: string }>)
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("");
  }
  if (Array.isArray(lastUser.parts)) {
    return lastUser.parts.map((p) => (p.type === "text" ? p.text ?? "" : "")).join("");
  }
  return "";
}

function normalizePart(p: { type?: string; text?: string }): { type: string; text?: string } {
  const t = typeof p.type === "string" && p.type.length > 0 ? p.type : "text";
  return { type: t, text: p.text };
}

/** AI SDK v6 `convertToModelMessages` requires `parts` with required `type`; older payloads may omit it. */
function normalizeUiMessagesForSdk(
  messages: Array<{ role?: string; content?: unknown; parts?: Array<{ type?: string; text?: string }> }>
): Array<{ role?: string; content?: unknown; parts: Array<{ type: string; text?: string }> }> {
  return messages.map((m) => {
    if (m.parts && Array.isArray(m.parts) && m.parts.length > 0) {
      return { ...m, parts: m.parts.map(normalizePart) };
    }
    const role = m.role;
    let text = "";
    if (typeof m.content === "string") text = m.content;
    else if (Array.isArray(m.content)) {
      text = (m.content as Array<{ type?: string; text?: string }>)
        .map((p) => (p.type === "text" ? (p.text ?? "") : ""))
        .join("");
    }
    if ((role === "user" || role === "assistant" || role === "system") && text) {
      return { ...m, parts: [{ type: "text", text }] };
    }
    if (Array.isArray(m.parts)) {
      return { ...m, parts: m.parts.map(normalizePart) };
    }
    return { ...m, parts: [] };
  });
}

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production" && !process.env.OPENAI_API_KEY) {
      console.error("[chat route] OPENAI_API_KEY is not set in production");
      return new Response(
        JSON.stringify({
          error:
            "OpenAI API key is not configured. Add OPENAI_API_KEY in Vercel → Project → Settings → Environment Variables for Production, then redeploy.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as { messages?: Array<{ role?: string; content?: unknown; parts?: Array<{ type?: string; text?: string }> }> };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const query = lastUserText(messages).trim();

    const baseSystem = await loadSystemPrompt();

    let context = "";
    if (query) {
      try {
        const projects = await getProjects();
        const aiProjectSlugs = projects.filter((p) => projectMatchesAiExperienceRetrieval(p)).map((p) => p.slug);
        const isAiQuery =
          /\bAI\b|artificial intelligence|AI project|AI experience|AI work|cursor|claude code|copilot|chatgpt|LLM|RAG|agentic/i.test(
            query
          );
        const forceIncludeSlugs = isAiQuery && aiProjectSlugs.length > 0 ? aiProjectSlugs : undefined;
        const chunks = await findRelevantChunks(query, 10, forceIncludeSlugs);
        context = chunks.length ? chunks.map((c) => c.content).join("\n\n---\n\n") : "";
      } catch (retrieveErr) {
        const msg = retrieveErr instanceof Error ? retrieveErr.message : String(retrieveErr);
        console.error("[chat route] RAG retrieve/embed failed; continuing without context:", msg);
      }
    }
    const groundingRule =
      "Factual claims (roles, dates, projects, companies, skills, tools, technologies, technical requirements) must come only from the Context below. Do not invent or infer facts. Never use placeholders like [date] or [company]—use the exact dates and names from the Context (e.g. 2019–2021, Meta). **CRITICAL: Do not confuse skills with roles.** If the Context mentions 'design engineering' as a skill, that does NOT mean Andrés held a 'Design Engineer' role. Only mention roles that are explicitly stated in the Context (e.g., 'Product Designer', 'Software Engineering Intern'). Never infer roles from skills, project descriptions, or job responsibilities. **Never assume or invent tools, technologies, or technical requirements** (e.g., Figma, Webflow, React, specific frameworks, design tools, or development tools) unless they are explicitly mentioned in the Context. If the Context does not mention what tools or technologies were used, say you don't have that information rather than assuming common tools. Keep responses concise and avoid redundancy. If the Context does not contain the answer, say you don't have that information.";
    const system = `${baseSystem}${context ? `\n\n## Context (use only this to answer)\n\n${groundingRule}\n\n${context}` : ""}`;

    const normalizedMessages = normalizeUiMessagesForSdk(messages);
    const modelMessages = await convertToModelMessages(
      normalizedMessages as Parameters<typeof convertToModelMessages>[0]
    );

    const result = streamText({
      model: useOpenAI ? openai(OPENAI_CHAT_MODEL) : ollama(OLLAMA_CHAT_MODEL),
      system,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalMessages: normalizedMessages as any,
      generateMessageId: () => generateId(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[chat route error]", message, stack);
    return new Response(
      JSON.stringify({ error: message, stack: process.env.NODE_ENV === "development" ? stack : undefined }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
