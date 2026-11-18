# newZgen Part 4 — website design update

## Install
1. Back up your existing project.
2. From the patch ZIP copy its `src` directory into your `newzgen` folder, **merging** directories and replacing the matching files. No article files are included.
3. In VS Code run `npm run dev` (or restart it if running).
4. Open `http://localhost:4321/preview/city` and `http://localhost:4321/preview/paper`.
5. The paper now has its **own** integrated masthead and navigation rather than the shared main website shell.

## Change brand settings
- `src/styles/designs.css`: variables in `PART 4` section for city/paper colors.
- `src/styles/global.css`: base font stacks and shared colors.
- `src/lib/site.ts`: choose `homepageDesign: 'city'` or `'paper'` after your vote.
- `src/lib/categories.ts`: category labels and descriptions.

## Geographic accuracy
The map is explicitly a **schematic editorial representation** of Barcelona (not district-boundary GIS data); do not present its category zones as actual administrative boundaries.

## Editorial privacy
The local editor remains private to your own computer. Do **not** deploy the `editor/` directory as a public web service. Deploy only Astro's `dist` output.
