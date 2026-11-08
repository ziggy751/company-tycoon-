# Latest state

See **INDUSTRIES_RELEASE.md** for the current three-industry implementation, product families, tutorial reward, actual garage progression, control fixes, assets and test evidence. The notes below document the earlier bedroom increment and are retained as development history.

# Development progress

Current phase: **Phase 1 — playable bedroom vertical slice**.

## Implemented

- Main menu, new brand creation (name, slogan, aesthetic, accent and founder skin tone), Continue, save journal, settings and credits.
- Procedural 3D cutaway bedroom: desk/laptop, bed, heat press, packing table, garment rack, window, lamp, rug and installable shelving.
- Controllable founder, WASD/sprint/hop, bounded room movement with furniture collision regions, orbit/zoom third-person view and station interaction by proximity or click.
- Rotatable 3D garment with three actual silhouette shapes, fabric/print colours, typography and orbital graphic. Named products and price edits.
- Real blank inventory, one timed heat press job, consumption of blank and ink; animation follows job state. Finished items appear after completion.
- Fictional SocialHub promotion, followers, posts, likes/views, cooldown and finite demand. Customer identities and price-dependent online orders.
- Stock reservation, manual packing and shipping, postage expense and payment only on delivery. No passive income.
- Supplier purchases, storage capacity, integer-cent financial ledger and cash-basis reports.
- Functional upgrades: shelving doubles capacity and appears in the room; press reduces production duration; lighting increases marketing reach. Order-based unlocks and seven earned achievement conditions.
- Guided objectives through first sale and five shirts, skippable tutorial, room guide, notifications, pause and 3× speed.
- IndexedDB autosave, three manual slots, load, export/import, version checks and economic save validation. Serialised save writes avoid stale snapshots overwriting newer ones.
- Graphics quality, orbit sensitivity/invert, first-person preview, UI volume and persistent settings. Quiet synthesised UI clicks after user interaction.
- Automated economy tests and browser gameplay tests; exact results are reported in the delivery message.

## Partial / deliberate limits

- Art is original procedural placeholder geometry. Materials, room scale, lighting and shadows are coherent but not AAA photorealism. No downloaded textures, rigged characters or fabric simulation.
- First-person mode is a fixed-forward preview; free-look is the third-person orbit camera. Collision is a simple 2D furniture boundary model, not Rapier. Jump is visual, not platform physics.
- Aesthetic is recorded as brand identity; demographic targeting is not yet simulated. Founder customisation is skin tone only. Logo creation, image imports, garment layers, back/sleeve graphics and fabric selection are not implemented.
- Phone currently opens the functioning SocialHub application. Other tools use workstation screens. There is no fake phone-app grid.
- Workspace customisation supports wall paint and installed shelving, not a general placement editor.
- Customers are deterministic simulated online buyers, not embodied retail NPCs. Demand is intentionally simple and budget-limited. No promises of a sophisticated algorithm or virality.
- Finance is cash basis, not accrual accounting. Own labour is unpaid. Initial supplies are founder contributions. No wages, rent, returns or taxes yet.
- Garage milestone is visible as a future target, not a purchasable property. All gameplay currently stays in the bedroom.
- Graphics expose only implemented controls; no fake Ultra, VSync, motion blur or FPS-cap toggles.
- Saves are schema v1; unknown future versions are rejected. No migrations are necessary yet. Import checks catch malformed balances and references but are not an anti-cheat system.

## Remaining phases

2. Expanded garments, image/logo workflow, actual fabrics, garage, part-time staff and reviews.
3. Industrial units, multiple machines, production queues, wages, maintenance and factory placement.
4. Retail stores with embodied browsing NPCs, displays and cashiers.
5. Influencers, competition, trends, events and campaigns.
6. Compact city, supplier/depot travel and vehicles.
7. Company management, multiple properties and distribution.
8. International markets, acquisitions and endgame.

## Known limitations and next priorities

- Fixed world coordinates and simple collisions need a navigation/collision system before larger maps.
- No Safari hardware test or measured MacBook frame-time benchmark yet. Chromium software rendering validates functionality only.
- Three.js currently makes the initial bundle substantial; lazy loading/asset compression should accompany the next art pass.
- Saves are local to the browser/origin, with no account backup. Failed writes surface a message; export regularly.
- Ledger/order history is retained for the small chapter. Add archive/aggregation for long campaigns.
- Bankruptcy recovery, order cancellations, explicit tutorial material restocking steps and richer product demand are next gameplay priorities.
- No cloud deployment or GitHub push has been performed.

## Validation of this implementation

- `npm test`: 13 tests passed, including a complete five-order campaign and pending-transaction save round trips.
- `npm run build`: strict TypeScript and Vite production build passed. Vite reports a large initial Three.js bundle (~1.2 MB uncompressed, ~340 KB gzip); code splitting remains a performance follow-up.
- `npm run test:browser`: 3 Chromium tests passed. Full first-sale/upgrade/refresh flow, 390px mobile layout, manual slots, export/import and corrupt-file rejection were exercised. The main gameplay run captured no uncaught browser errors.
- Browser tests used system Chromium with software WebGL, not Safari or a physical MacBook.

## Company Tycoon overhaul

See OVERHAUL_PROGRESS.md for the latest changes and remaining requirements. The new multi-company registry supersedes the former single-autosave limitation. Assets remain procedural, and streetwear remains the sole playable industry.

The current release includes three actual business loops, five product families, optional one-time tutorial grants, earned garage ownership, shared map waypoints, authored CC0 chair art, and controls/save-status fixes. See INDUSTRIES_RELEASE.md for the verification record and explicit remaining scope. No realistic humanoid rig or full furniture editor has been delivered.
