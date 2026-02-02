# Andres Arbelaez | Designer & Creative Technologist

Portfolio site with a RAG-powered agent that answers recruiter questions from your resume and project data, cites your work, and points visitors to specific projects as evidence of product design and design engineering skills. **No paid external LLM API**—uses Ollama (self-hosted) or free-tier APIs (Groq, Hugging Face).

## Project layout

```
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── content/                # Source for RAG ingest
│   ├── resume.md           # Your career narrative (replace with your content)
│   ├── projects.json       # Projects with title, slug, url, skills, summary, evidence
│   └── project-schema.json # JSON schema for projects
├── lib/                    # Shared logic
│   └── vector-schema.ts    # Types for embedding chunks (id, content, embedding, source, projectId)
├── types/
│   └── project.ts          # Project type used by content and agent
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

## Schema

- **Content**: `content/resume.md` (Markdown) and `content/projects.json` (array of projects). Each project has `title`, `slug`, `url`, `skills`, `summary`, optional `evidence`, optional `featured`.
- **Vector store**: Chunks have `id`, `content`, `embedding`, optional `source` ("resume" | "project"), optional `projectId`. See `lib/vector-schema.ts`.

## Next steps (from the plan)

1. **Fill content**: Replace `content/resume.md` with your resume/career narrative; edit `content/projects.json` with your projects (use `content/project-schema.json` as reference).
2. **Ingest pipeline**: Add a script or API route that reads `content/`, chunks text, calls Ollama embed API (`nomic-embed-text`), and writes to a vector store (ChromaDB file-based or pgvector).
3. **RAG chat route**: Add `app/api/chat/route.ts` that embeds the user message via Ollama, runs similarity search, then calls Ollama chat API (or Vercel AI SDK Ollama provider) with system prompt + retrieved context; stream the reply.
4. **Portfolio UI**: Build Home (hero, featured projects, “Ask the agent” entry), Projects (grid + filters by product design / design engineering), About, and Chat (embedded or `/chat`).
5. **Hosting**: Deploy to Railway, Render, or Fly (Ollama runs on the same host or a separate service). Not Vercel if using self-hosted Ollama.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll need Ollama running (and models pulled) before the ingest and chat routes work.

## Deploy to Vercel

1. **Log in** (one-time):  
   ```bash
   npx vercel login
   ```  
   Follow the prompt to authenticate in your browser.

2. **Deploy**:  
   From the project root:  
   ```bash
   npx vercel
   ```  
   First run will ask to link to a Vercel project; accept defaults. Use `npx vercel --prod` when you’re ready to deploy to production.

3. **Custom domain (andresma.com)**: In the [Vercel dashboard](https://vercel.com/dashboard) → your project → **Settings** → **Domains**, add `andresma.com` and `www.andresma.com`. Then in Namecheap → **Manage** → **Advanced DNS**, either switch to Vercel’s nameservers or add the A/CNAME records Vercel shows.

## Plan

See the Cursor plan **Agentic Portfolio Website (No Paid LLM API)** for the full architecture, options A/B/C, and implementation order.
