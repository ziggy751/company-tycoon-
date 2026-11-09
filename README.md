# Company Tycoon

An offline-first 3D company simulator with three starter industries, 25 product types, physical workstations, a fictional computer desktop and earned garage expansion. The full city/factory roadmap remains in progress.

## Develop

Requires Node.js 22.12+ (validated on Node 24.22.1).

```sh
npm ci
npm run dev
```

Open the address printed by Vite. No API keys, backend or external runtime services are required to play; shipped art is bundled locally. IndexedDB holds saves in the current browser and origin. Export saves before changing origins or clearing browser storage.

```sh
npm test                  # deterministic economy and save validation
npm run build             # strict TypeScript and production bundle
npm run preview           # serve production output
npm run test:browser      # full gameplay and mobile layout
```

Browser tests default to `/usr/bin/chromium`. Set `CHROMIUM_PATH` to another installed Chromium executable, or install Chromium through Playwright and update the path. Tests use software rendering for CI; this is not a representative performance benchmark.

## First sale

1. Select Create Company, choose Streetwear & Clothing, and create a brand.
2. Walk to the back-left desk (approach its right side), press E or click the nearby prompt, then open Design Studio on SummitOS. Save a cotton tee design.
3. Escape exits the computer. Walk to the back-right manufacturing bench and print the tee. One blank and $4 ink are consumed; wait 12 simulation seconds.
4. Return to the computer and open SocialHub. Publish a $5 promotional post while finished stock is available.
5. Use the front-right packing station. Wait for a customer, consume a mailer to pack the order, then ship for $5.
6. On delivery, receive payment. Order supplies in Supplier Market, receive the timed delivery at the front door, and plan upgrades in Property.

A product priced above the current audience's budget will not sell. Reprice in Design Studio or Product Catalogue on the computer. The default $39 works for the starting audience. A promotion can generate up to three orders if inventory remains available. Repeated posts have a 35-second cooldown.

WASD moves, Shift sprints, Space hops, dragging orbits, scrolling zooms, and E uses a nearby object. Tab, I and B open SocialHub, Supplier Market and Property respectively when near a computer. Within the computer, Tab retains normal keyboard focus behavior. M opens the neighbourhood map; Escape exits the computer, closes a panel or opens settings. Every interaction has a nearby clickable prompt. The permanent business dock has been removed. Key bindings and mouse/trackpad sensitivity are configurable.

Autosave runs after transactions and every 10 simulation seconds. Three manual slots, JSON export/import, and save validation are available in Settings → Manage saves. Simulation does not advance while the page is hidden or while save/settings panels are open. No offline income is invented.

## Cloudflare Pages / Workers static assets

Choose this repository, build command `npm run build`, output directory `dist`, Node 22 or 24. This is a static SPA; this gameplay release does not add a server or require server secrets. All assets are bundled. Save data stays on the device; there is no cloud sync. Git-connected Cloudflare projects can build updates automatically. Live deployment verification is blocked by this environment's network proxy (403 on the Workers URL).

## Structure

- `src/game/catalog.ts`: balancing and upgrade definitions
- `src/game/simulation.ts`: pure economic commands and clock
- `src/game/store.ts`: Zustand runtime and serialised autosave queue
- `src/game/save.ts`: IndexedDB slots and import validation
- `src/world/`: procedural bedroom, character, camera and garment
- `src/ui/`: functioning business screens
- `tests/`: browser gameplay

See GAME_PROGRESS.md, GAME_DESIGN.md and BALANCING.md for scope and extension points. Procedural models are original temporary assets, not final realistic art. Dependency licences remain with their authors.

## Company Tycoon update

Earlier increments added a grounded home/neighbourhood, walkable entrance, usable door, day/night and interior lights, wardrobe samples, and independent companies. Use **My Companies** on the main menu to switch businesses. Opening the wardrobe requires a manufactured sample to wear your design; that piece moves out of saleable stock. Existing IndexedDB saves migrate without deleting the originals. See OVERHAUL_PROGRESS.md for exact scope and unfinished roadmap.

## Three playable industries

Use **Create Company** and choose Streetwear, MTB Accessories or Hair & Styling Accessories. MTB uses paid prototyping, specialist manufacturing batches and incoming inspection. Hair accessories use supplier sourcing and label application. Both have actual accessory previews, separate stock states and distinct equipment. They do not use the clothing heat press. Each company has its own local autosave and backups.

The optional tutorial awards a single $100 grant after eleven real tasks. A gated garage purchase expands the world workspace, storage and sourced batch size. M opens the neighbourhood map. Settings includes control rebinding, mouse/trackpad and sensitivity controls. Primary click/drag and scroll cover all camera interactions.

See DESKTOP_RELEASE.md and OVERHAUL_PROGRESS.md for the current completion report, INDUSTRIES_RELEASE.md for the earlier release, BALANCING.md for costs, and ASSETS.md for the locally bundled CC0 chair. To run production browser tests, build first and use `TEST_PRODUCTION=1 npm run test:browser`. Firefox/WebKit browser binaries must be installed separately where network policy and OS support permit; the supplied default config uses system Chromium.

## SummitOS and catalogue expansion

The physical computer opens draggable, minimisable business apps. Drafts survive minimising, Show Desktop exposes other apps, and Escape restores the world camera. Manufacturing, inspection, labelling, deliveries and dispatch have physical stations. Supplier batches must be received before preparation and sale.

The catalogue contains 8 streetwear types, 9 MTB accessories and 8 hair accessories, with product-specific costs/times, shaped previews, collection/season metadata, premium finishing, favourites and comparison. Tees use the press; other apparel uses specialist textile production plus inspection. Only the original tee family is currently wearable; the broader character clothing system is unfinished.

Email login/D1 remains separate unfinished work on `feature/email-cloud-saves`. Main uses the existing independent local saves and preserves the original database and export/import format.
