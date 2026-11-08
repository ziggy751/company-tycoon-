# Streetwear Empire

A playable, offline-first 3D streetwear business simulator. This initial chapter implements the bedroom business loop, not the full city/factory roadmap.

## Develop

Requires Node.js 22.12+ (validated on Node 24.22.1).

```sh
npm ci
npm run dev
```

Open the address printed by Vite. No API keys, backend, downloaded art, or external runtime services are required. IndexedDB holds saves in the current browser and origin. Export saves before changing origins or clearing browser storage.

```sh
npm test                  # deterministic economy and save validation
npm run build             # strict TypeScript and production bundle
npm run preview           # serve production output
npm run test:browser      # full gameplay and mobile layout
```

Browser tests default to `/usr/bin/chromium`. Set `CHROMIUM_PATH` to another installed Chromium executable, or install Chromium through Playwright and update the path. Tests use software rendering for CI; this is not a representative performance benchmark.

## First sale

1. Start your story and create a brand.
2. Design: customise the 3D shirt, then save it as a product.
3. Produce: print a shirt. One blank and $4 ink are consumed; wait 12 simulation seconds.
4. SocialHub: publish a $5 promotional post while finished stock is available.
5. Orders: wait for a customer, then pack the order and ship for $5.
6. On delivery, receive payment. Buy more supplies and improve the workspace.

A product priced above the current audience's budget will not sell. Reprice in the Design catalogue. The default $39 works for the starting audience. A promotion can generate up to three orders if inventory remains available. Repeated posts have a 35-second cooldown.

WASD moves, Shift sprints, Space hops, dragging orbits, scrolling zooms, E uses a nearby station, Tab opens the phone, I opens inventory, B opens workspace, M shows the room guide, and Esc closes a panel or opens settings. Clickable station labels and the dock provide trackpad-friendly alternatives.

Autosave runs after transactions and every 10 simulation seconds. Three manual slots, JSON export/import, and save validation are available in Settings → Manage saves. Simulation does not advance while the page is hidden or while save/settings panels are open. No offline income is invented.

## Cloudflare Pages

Choose this repository, build command `npm run build`, output directory `dist`, Node 22 or 24. This is a static SPA with no server secrets or Workers required. All assets are bundled. Save data stays on the device; there is no cloud sync. No deployment has been performed by this implementation.

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

The latest increment adds a grounded home/neighbourhood, walkable entrance, usable door, day/night and interior lights, wardrobe samples, and independent companies. Use **My Companies** on the main menu to switch businesses. Opening the wardrobe requires a manufactured sample to wear your design; that piece moves out of saleable stock. Existing IndexedDB saves migrate without deleting the originals. See OVERHAUL_PROGRESS.md for exact scope and unfinished roadmap.
