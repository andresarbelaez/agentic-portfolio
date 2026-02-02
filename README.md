# Andres Arbelaez | Designer & Creative Technologist

Portfolio site with a RAG-powered agent that answers recruiter questions from your resume and project data, cites your work, and points visitors to specific projects as evidence of product design and design engineering skills. **Local dev**: Ollama (self-hosted). **Production**: OpenAI (set `OPENAI_API_KEY` in Vercel).

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

## GitHub

The repo is initialized with an initial commit. To put it on GitHub:

1. On [github.com](https://github.com), click **New repository**.
2. Name it (e.g. `agentic-portfolio` or `andresma-portfolio`), leave it empty (no README, no .gitignore), and create.
3. In your project folder, add the remote and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and the repo name you chose.

After that, you can connect this repo to Vercel (if you deployed via CLI) in Vercel → Project → Settings → Git to get automatic deploys on push.

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

## Production AI (chat on andresma.com)

For the live site’s chat to work, use OpenAI (no Ollama on Vercel).

### 1. Get an OpenAI API key

1. Go to [platform.openai.com](https://platform.openai.com) and sign in (or create an account).
2. Click your profile (top right) → **API keys**, or go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
3. Click **Create new secret key**. Name it (e.g. “andresma portfolio”), leave permissions as default, then **Create secret key**.
4. Copy the key immediately (it starts with `sk-`). You won’t see it again. Store it somewhere safe.

### 2. Add the key in Vercel (for the live site)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) and open your portfolio project (e.g. `agentic_portfolio`).
2. Click **Settings** (top tab).
3. In the left sidebar, click **Environment Variables**.
4. Under **Key**, type: `OPENAI_API_KEY`.
5. Under **Value**, paste your OpenAI key (the `sk-...` string).
6. Choose **Production** (and **Preview** if you want chat on preview deploys too).
7. Click **Save**. Vercel will use this on the next deploy.

### 3. Add the key locally (for generating embeddings)

You need the key on your machine only to run `npm run ingest` and build `data/embeddings.json`. After that, you commit that file; Vercel doesn’t run ingest.

**Option A – one-time for this terminal session**

```bash
export OPENAI_API_KEY="sk-your-key-here"
npm run ingest
```

**Option B – use a `.env.local` file (not committed)**

In the project root, create `.env.local` with:

```
OPENAI_API_KEY=sk-your-key-here
```

Then run `npm run ingest`. Next.js and the ingest script will read it. (`.env.local` is in `.gitignore`, so the key stays off GitHub.)

### 4. Generate and commit embeddings

After setting `OPENAI_API_KEY` locally (Option A or B):

```bash
npm run ingest
git add data/embeddings.json
git commit -m "Add OpenAI embeddings for production"
git push
```

Vercel will redeploy with the new file. Chat on andresma.com will use OpenAI for both RAG and responses.

### Optional

- **Different chat model**: In Vercel Environment Variables, add `OPENAI_CHAT_MODEL` with value `gpt-4o` (or another [model id](https://platform.openai.com/docs/models)) to override the default `gpt-4o-mini`.
- **Local dev without a key**: If `OPENAI_API_KEY` is not set, the app uses Ollama for chat and embeddings locally.

## Plan

See the Cursor plan **Agentic Portfolio Website (No Paid LLM API)** for the full architecture, options A/B/C, and implementation order.
