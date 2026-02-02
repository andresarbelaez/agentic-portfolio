import { findRelevantChunks } from "@/lib/retrieve";
import { streamText, convertToModelMessages, generateId } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import * as fs from "fs/promises";
import * as path from "path";

export const maxDuration = 30;

const ollamaBase = process.env.OLLAMA_URL ?? "http://localhost:11434";
const ollama = createOllama({
  baseURL: ollamaBase.replace(/\/?$/, "") + "/api",
});

const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "llama3.2";

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: Array<{ role?: string; content?: unknown; parts?: Array<{ type?: string; text?: string }> }> };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const query = lastUserText(messages).trim();

    const baseSystem = await loadSystemPrompt();
    let context = "";
    if (query) {
      const chunks = await findRelevantChunks(query, 6);
      context = chunks.length ? chunks.map((c) => c.content).join("\n\n---\n\n") : "";
    }
    const groundingRule =
      "Factual claims (roles, dates, projects, companies, skills, tools, technologies, technical requirements) must come only from the Context below. Do not invent or infer facts. Never use placeholders like [date] or [company]—use the exact dates and names from the Context (e.g. 2019–2021, Meta). **CRITICAL: Do not confuse skills with roles.** If the Context mentions 'design engineering' as a skill, that does NOT mean Andrés held a 'Design Engineer' role. Only mention roles that are explicitly stated in the Context (e.g., 'Product Designer', 'Software Engineering Intern'). Never infer roles from skills, project descriptions, or job responsibilities. **Never assume or invent tools, technologies, or technical requirements** (e.g., Figma, Webflow, React, specific frameworks, design tools, or development tools) unless they are explicitly mentioned in the Context. If the Context does not mention what tools or technologies were used, say you don't have that information rather than assuming common tools. Keep responses concise and avoid redundancy. If the Context does not contain the answer, say you don't have that information.";
    const system = context
      ? `${baseSystem}\n\n## Context (use only this to answer)\n\n${groundingRule}\n\n${context}`
      : baseSystem;

    const modelMessages = await convertToModelMessages(messages as Parameters<typeof convertToModelMessages>[0]);

    const result = streamText({
      model: ollama(CHAT_MODEL),
      system,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalMessages: messages as any,
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
