# Portfolio Presentation Desktop App — Planning Document

A music-player metaphor for presenting two case studies in a memorable, design-engineer-appropriate way. Each project is an **album**; each **track** is one of the dimensions the recruiter asked for: **Product/UX thinking**, **Design contributions**, **Engineering contributions**, and **Strategy & impact**. The UI mimics **old iTunes** (e.g. iTunes 4–7, early 2000s), similar to how the AiOL chat mimics classic AIM — a period-accurate, nostalgic skin that fits the Windows XP desktop.

**Context:** "Desktop app" here means an app that **lives within the andresma.com Windows XP desktop environment** — i.e. a new window on the same XP desktop that already has the AiOL chat, Notepad (project folders), and other icons. It is not a separate native application; it is part of the existing Next.js portfolio and opens like Notepad or the AIM window.

---

## 1. Overview

### Purpose
- Present two case studies in a fun, recognizable format that **directly maps to the recruiter’s ask:** Product/UX thinking, design and engineering contributions, and strategy and impact.
- Showcase **Confidant** (Album 1) and **Meta Ads Lift Design System** (Album 2).
- Keep clarity high: the track list explicitly names the four dimensions, so nothing is left implied.

### Core Paradigm
- **Project = Album.** Two albums in the library: Confidant, Meta Lift.
- **Track = Dimension of the story.** Each album has the same four “tracks”:
  1. **Product & UX thinking** — Problem, insight, approach.
  2. **Design contributions** — What you designed (systems, components, flows).
  3. **Engineering contributions** — What you built (architecture, stack, implementation).
  4. **Strategy & impact** — Rollout, adoption, outcomes, metrics.
- **Select a track** → detail panel shows **About** (narrative) + **Work** (mockups, screenshots, demos).

### Why Music / Old iTunes
- **Universal:** Everyone has used a music player; no sports or domain knowledge required.
- **Aligned with you:** Fits your music/creator background (Logic Pro, producer, etc.).
- **Memorable:** Nostalgic iTunes look is distinctive and consistent with the existing XP/AiOL aesthetic.
- **Recruiter-friendly:** Track titles spell out exactly what you’re covering (Product thinking, Design, Engineering, Impact).

---

## 2. UI Concept: Old iTunes Style

### Reference
- **Era:** iTunes 4–7 (early–mid 2000s): source list on the left, main content (album art + track list), now playing / inspector for details.
- **Approach:** Same as AiOL — capture the *feel* and layout of the original (brushed metal or grey chrome, green play accent, typography, spacing) without needing pixel-perfect asset rip; implement in CSS/React so it runs in the browser as an XP window.
- **Reference screenshots** (saved in this repo for UI replication):
  - `docs/presentation-app/references/itunes-windows-full-playback-sidebar.png` — Full iTunes window on Windows XP: playback controls, track info, left sidebar (Library, Store, Playlists), main area (album art + track list), right Genius sidebar, bottom status bar.
  - `docs/presentation-app/references/itunes-music-library-album-list.png` — Music library view: brushed metal bars, light grey sidebar (Library, Playlists), main white content with album blocks (art + tracks), column headers (#, Title, Artist, Time, Genre, Rating).
  - `docs/presentation-app/references/itunes-source-pane-and-content.png` — Source list (Library, Music Store, etc.) with blue selection; large content pane with banners and “New Releases”; footer controls and progress bar.

### Layout (Three Areas)

| Area | Purpose | iTunes analogue |
|------|--------|------------------|
| **Left sidebar (source list)** | Choose project (album). | Library / Music source list. Show “Library” or “Portfolio” with two entries: “Confidant” and “Meta Lift Design System.” Click to “load” that album. |
| **Main content** | Album art + track list. | Album art at top or left of main area; track list below or beside it with columns (e.g. #, Track name, “Duration” or just names). Four rows: Product & UX thinking, Design contributions, Engineering contributions, Strategy & impact. |
| **Detail panel (right sidebar)** | “Now playing” / inspector for the selected track. | When a track is selected, show two tabs: **About** (liner notes — the narrative for that dimension) and **Work** (artwork — mockups, screenshots, links, optional video). *Decided: right sidebar for more room for mockups.* |

### Visual Style
- **Shell:** Brushed metal or soft grey chrome, rounded corners, familiar iTunes-style buttons (play/pause could mean “expand” or be decorative; back/forward for album switch if desired).
- **Typography:** System fonts or period-appropriate equivalents (e.g. Lucida Grande–style for headings, clean sans for track list).
- **Real work:** In the **Work** tab, show portfolio assets at full fidelity (no treatment) so design and impact read clearly.

### Interaction
- Click an album in the source list → main area shows that album’s art and four tracks.
- Click a track → detail panel updates with About + Work for that track.
- Optional: “Play” or double-click could auto-expand the detail panel or cycle through tracks for a presentation mode.

---

## 3. Project 1: Confidant (Album 1)

### Album
- **Title:** Confidant — A Privacy-First AI Mental Health Assistant (or short: “Confidant”).
- **Subtitle / tagline:** e.g. “A privacy-first desktop AI that runs entirely on-device.”

### Track 1 — Product & UX thinking
- **About:** Problem (cloud AI breaks trust), insight (trust must be designed in), approach (fully local, transparent, user-owned). Making local AI feel trustworthy; designing for slower inference; mental model clarity.
- **Work:** Problem/solution sketch, trust or mental-model diagram, or key UX screens that show your thinking.

### Track 2 — Design contributions
- **About:** Design system (tokens, components, structure); consistency and scalability; desktop-native patterns.
- **Work:** Design system screens (tokens, components), Figma or static mockups, before/after if relevant.

### Track 3 — Engineering contributions
- **About:** Stack (React, TypeScript, Tauri, Rust); local LLM integration; ChromaDB; end-to-end implementation.
- **Work:** Architecture diagram, code snippets or repo link, desktop app screenshots, streaming/UX implementation.

### Track 4 — Strategy & impact
- **About:** What the project demonstrates: viable local-first AI model, production desktop app, integrated design system and architecture. Positioning: product design + systems architecture + implementation.
- **Work:** Outcome summary, metrics if any, or a short demo video/GIF of Confidant in use.

---

## 4. Project 2: Meta Lift Design System (Album 2)

### Album
- **Title:** Design System for Meta Ads’ Lift (or “Meta Lift Design System”).
- **Subtitle:** e.g. “Scaling consistency across a complex enterprise advertising platform.”

### Track 1 — Product & UX thinking
- **About:** Context (Lift, Meta Ads, enterprise scale); problem (fragmentation, up to 10 UI patterns, confusion); insight (product had scaled faster than its design foundation). Your role framing the problem and approach.
- **Work:** Context or problem slide, audit scope, or a single “before” frame.

### Track 2 — Design contributions
- **About:** Lift Results Design System: scalable component library, shared patterns, tokens, documentation. Modular, documented, code-ready. Before/after, component examples.
- **Work:** Component library screens, tokens, patterns, before/after comparisons.

### Track 3 — Engineering contributions
- **About:** Partnership with engineering; code alignment; documentation; handoff and implementation support. What you owned vs. collaborated on.
- **Work:** Docs, code-ready components, or handoff artifacts.

### Track 4 — Strategy & impact
- **About:** Adoption strategy (partnered with eng, documented usage, supported rollout). Impact: 90% compliance before org target, 13/16 improvements shipped, UX quality gains, reduced inconsistency. Scalable foundation for Lift’s growth.
- **Work:** Metrics summary, adoption or rollout visual, or link to live design system if applicable.

---

## 5. Content & Data Model — Data Contract

### Data source (decided)
- **One JSON file per project (album).** Files live under `content/presentation/`, e.g. `confidant.json`, `meta-lift.json`.
- The app loads all `content/presentation/*.json` (or a fixed list of album ids) to build the source list and album views.

### Presentation album schema (per-file)

Each file in `content/presentation/{albumId}.json` is a single object with this shape:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **id** | string | yes | Stable album id used in routing/state (e.g. `confidant`, `meta-lift`). Should match filename without `.json`. |
| **title** | string | yes | Display name (e.g. “Confidant”, “Design System for Meta Ads' Lift”). |
| **subtitle** | string | no | Tagline (e.g. “A privacy-first desktop AI that runs entirely on-device.”). |
| **albumArtUrl** | string | no | Image URL for album art. Omit or leave empty for placeholder. |
| **tracks** | array | yes | Exactly 4 items, in this order: Product & UX thinking, Design contributions, Engineering contributions, Strategy & impact. |

### Presentation track schema (each element of `tracks`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **id** | string | yes | Stable track id (e.g. `product-ux`, `design`, `engineering`, `strategy-impact`). |
| **title** | string | yes | Display name (e.g. “Product & UX thinking”). |
| **about** | string | yes | Narrative for the About tab. Plain text or markdown (app may render markdown). |
| **work** | array | yes | List of assets to show in the Work tab. Can be empty. |

### Work asset schema (each element of `work`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **type** | string | yes | One of: `image`, `video`, `link`. |
| **url** | string | yes | URL or path. Use the same paths as in [content/projects.json](content/projects.json) where the asset already exists (e.g. `/projects/lift_results_demo.mp4`). For links, use full URL. |
| **caption** | string | no | Optional caption below or beside the asset. |

### Mapping work assets to existing project media

- **Confidant** and **Meta Lift** already have `images` and `videos` in [content/projects.json](content/projects.json) (e.g. Meta Lift: `videos: ["/projects/lift_results_demo.mp4"]`; Confidant: currently empty arrays).
- In each presentation JSON, populate **work** for the relevant tracks with entries whose **url** matches those same paths (or add new assets as you create them). No duplication of media files — the presentation app just references the same URLs the rest of the site uses.
- If a project has no `images`/`videos` yet, use placeholder URLs in Phase 1 and replace with real paths when adding media to the project or to the presentation.

### Where the app lives (implementation)

- **Within the Windows XP desktop at andresma.com:** A new window (like AiOL or Notepad) opened from a desktop icon. Implemented as a new window component (e.g. `PresentationWindow` or `iTunesStylePresentationWindow`) with the same XP title bar, drag, and minimize/close patterns as `NotepadWindow` and `AIMChatWindow`. Data loaded by fetching or importing `content/presentation/*.json`.

---

## 6. Scope & Phases

### Phase 1 — Shell
- New XP window component (title bar, drag, min/close) that renders the three-area layout: source list (left), main (album art + track list), detail panel (right sidebar).
- Static data: two albums, four tracks each, placeholder copy and one placeholder “Work” asset per track.
- Tabs in detail panel: About, Work. Selecting a track updates the panel.

### Phase 2 — Content
- Full copy for all four tracks for Confidant and for Meta Lift (About + Work asset list).
- Integrate real images and links into Work tabs (Confidant UI, design system, architecture, metrics).

### Phase 3 — Polish
- Old iTunes visual treatment (brushed metal / grey chrome, typography, green accent, spacing).
- Desktop icon on the XP desktop to open the app; label (e.g. “Portfolio” or “Presentation”).
- Optional: presentation mode (e.g. keyboard shortcut to expand detail panel, or “play” to step through tracks).

### Phase 4 (Optional)
- Embedded video or live demo in a Work tab.
- Full-screen “Now playing” view for presenting a single track.

---

## 7. Success Criteria

- Recruiter can see that you’re explicitly addressing **Product/UX thinking**, **Design contributions**, **Engineering contributions**, and **Strategy & impact** for both projects (track list makes this obvious).
- Mockups and demos are one click away (select track → Work tab).
- Presentation feels cohesive and intentional; the music metaphor and iTunes skin are memorable but don’t obscure the content.
- You can run through both case studies in ~20 minutes using only this app (plus your spoken narrative).

---

## 8. Decisions & Open Items

### Resolved
- **Data source:** One JSON file per project; files in `content/presentation/{albumId}.json`.
- **Detail panel placement:** Right sidebar.
- **Album art:** Placeholder for now; can add custom or project screenshot later.

### Still open
- **Desktop icon:** Label and icon (e.g. iTunes-style music note or generic “Portfolio” icon) for the XP desktop — to decide in Phase 3.

---

*Document version: 2.1 — Data contract (one JSON per project, schema, work-asset mapping); decisions recorded.*
