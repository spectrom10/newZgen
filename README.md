# newZgen — Publishing foundation (Part 1)

**Real code, no fabricated news, no AI required for publishing.** A static Astro newsroom with editorial categories, reusable templates, and a content pipeline. Design tokens are preliminary; no backend/CMS is represented as operational.

## Run in VS Code

1. Install Node.js 20.19+ or 22+.
2. Open this folder in VS Code.
3. Run `npm install`.
4. Run `npm run dev` and open the local URL shown in your terminal.
5. For production, run `npm run build`; generated files are in `dist/`.

## Publish the first real article

Run `npm run article:new` and answer the prompts. This creates a **draft** Markdown file in `src/content/articles/`.

Open that file, add your article below the second `---`, link verified sources in `sources`, and finally change `status: draft` to `status: published`. Published articles with a future `publishedAt` date are withheld until a subsequent build; this isn't autonomous scheduling.

Optionally add a rights-cleared cover image in `public/images/`, with e.g.:

```yaml
cover: /images/my-cover.webp
coverAlt: "Descriptive alternative text for the image"
```

Each published article automatically gets a page at `/articles/<filename-without-md>`, appears in the Paper and its category, and is included in the sitemap. Every article **must** include a substantial `whatItMeansForYou` field. Articles are written and reviewed by humans; neither writing nor social content is generated with AI.

The project deliberately has **zero sample articles**. The empty newsroom state is genuine until you publish your own reporting.

## Where to change things

- `src/styles/global.css`: all brand color tokens, typography and design.
- `src/lib/categories.ts`: authoritative category list (keep existing slugs stable after publication).
- `src/content.config.ts`: article fields, input validation.
- `src/content/articles`: actual source articles.
- `src/pages/index.astro`: The Paper landing page.
- `src/pages/articles/[slug].astro`: all full articles, including the impact box.
- `src/pages/topics/[slug].astro`: automatically generated categories.
- `src/layouts/Base.astro`: wordmark, nav, SEO and footer.

## Deploy using the same workflow as ReCash

1. Create a GitHub repository, e.g. `newzgen`, and push the project.
2. In Cloudflare Pages, connect the repository. Build command: `npm run build`. Output directory: `dist`. Root directory: project root. Configure `PUBLIC_SITE_URL` to the actual HTTPS production origin (or update the default in astro.config.mjs).
3. Every new published article pushed to the main branch triggers a new deployment.

### What is deliberately not in Part 1

- No fabricated geographical map or topic-to-neighbourhood geography. The city experience needs a reliable Barcelona SVG boundary dataset; it's a later real component.
- No user accounts or editor login; no pretend auth.
- No newsletter subscriber capture without storage/privacy controls.
- No weekly magazine import or fake page flip; this needs an agreed source format and edition model.
- No one-click Instagram/LinkedIn API posting. Instead, a deterministic crop/caption pipeline can come later using your approved post templates; direct publishing depends on platform permissions.
- No backend yet. Article publishing is real, but currently done through Markdown and GitHub. A nontechnical admin UI will require a CMS and secure authorization in the next phase.

## Next architecture choices

- **Editor workflow:** authenticated CMS (managed or Git-based) instead of hand-rolling login from scratch.
- **Weekly edition:** original articles selected by editors, stored as edition metadata and rendered into a magazine-style reading experience; PDF uploads can be a separate explicit feature.
- **Barcelona map:** accurate, license-compatible geographic geometry in static SVG, with categories mapped independently through a configuration file.
- **Social posts:** deterministic templates/cropping and editable human-written captions. No AI content required.

## Quality checks

`npm run build` and `npm run check`. All pages are HTML generated at build time and do not require a server or database to serve.


## Design comparison — City vs Paper (Part 2)

- Open `/` to see the group comparison screen.
- Open `/preview/city` for the Barcelona-inspired **interactive map**.
- Open `/preview/paper` for the **dynamic newspaper**.
- They read the **same published articles** from `src/content/articles/`; there is no duplicated content or backend.
- The Barcelona map is a **stylized editorial interpretation** of Barcelona's grid and Avinguda Diagonal, not a geographically precise mapping/GIS source. The clickable topic placement is illustrative. It needs geographic validation before claiming exact district boundaries.
- Design preview placeholders exist only as CSS/illustration. No fictional articles were added.
- Once the group votes, edit `src/lib/site.ts`: set `homepageDesign` from `'chooser'` to `'city'` or `'paper'`. Preview routes remain working.
- Change global brand colors and fonts in `src/styles/global.css`. Concept-specific color variables live at the top of `src/styles/designs.css`.
- Replace wordmark after choosing a final logo: put SVG in `public/brand/newzgen.svg`, then set `brand.logoImage: '/brand/newzgen.svg'` in `src/lib/site.ts`.
- These designs are real pages, not screenshots. On the map, hover/focus reveals topic information; clicks open genuine category pages. Article previews show actual article titles only after publication.
- A future editor CMS is a separate development step and is **not** simulated here.

## Editorial workspace — Part 3 (local, functional)

This project now includes a **real local newsroom editor** intended for the initial single lead editor.
It edits the same Markdown content collection that powers the live Paper and City designs.
No third-party API, LLM, database, paid account, or server-side hosting is required for this local workflow.

### Start it

Open **two terminals** in VS Code from the project folder:

- Terminal 1: `npm run dev` — Astro site at `http://localhost:4321/`
- Terminal 2: `npm run editor` — local editor at `http://127.0.0.1:4177/`

Inside the editor you can create, edit, save drafts, publish/unpublish, categorize, mark featured,
add citations/sources, upload PNG/JPEG/WebP covers, add image alt text, and preview the text.
Draft articles never appear on the reader-facing site. There is no fabricated demo content.
Publishing saves the article file locally; **to publish on Cloudflare, commit and push the changes to GitHub**.
The browser preview is a safe, lightweight approximation for editing; the real published layout is Astro.

**Security boundary:** this editorial server binds to `127.0.0.1` and is NOT an authenticated internet-facing admin system.
Never expose port 4177 publicly, deploy `/editor` as a web service, or treat its localhost protection as authentication.
The `editor` directory is developer tooling, not part of Astro's static build output.
The future multi-editor version can use an authenticated CMS/database while retaining the current frontend and content fields.

**Editorial conventions:** Keep slugs stable; verify sources and image rights; proofread before publishing.
A new article requires a headline (8+), summary (20–240), author (2+), and personal impact (30+) even while in draft because the Astro schema validates all entries. Publishing also requires 120+ body characters and at least one cited source. The editor does **not** generate stories or captions using AI.
