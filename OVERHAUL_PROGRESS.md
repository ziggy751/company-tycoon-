# Company Tycoon overhaul — first increment

This is an extension of the existing Streetwear Empire chapter, not a replacement game. Baseline is retained on `backup/before-company-overhaul` at d24fbcf.

## Implemented in this increment

- Main title becomes Company Tycoon. The currently playable industry remains streetwear; other industries are not presented as working.
- Bedroom connected to a home living/kitchen area and entrance, placed on continuous terrain with foundation, adjacent houses, pavement, road markings, streetlights, trees and a parked vehicle.
- Walkable door aperture connects bedroom to living space and outdoors. Side walls, rear wall, furniture and neighbouring houses block movement. Camera follows movement while retaining orbit controls. Roof appears when outside to keep the home readable from within. This is a cutaway rendering convention.
- A real door opens/closes by click or nearby E interaction. Saved interior-light switch and day/night lighting. The wardrobe in the living area opens sample selection.
- Shared original texture/bump maps for timber, cotton, plaster, concrete, grass, asphalt and brick. Texture generation is seeded; assets do not depend on a CDN. No externally licensed art is used.
- A manufactured shirt can be moved from saleable stock into an owned wardrobe sample. Its actual saved colour, text, graphic and cut render on the founder. Re-equipping never consumes another piece or creates stock. Outfit, wardrobe, door, lights and player position persist per company.
- My Companies lists independent businesses, balances, revenues, followers, playtime and last save. Supports Play, Rename, Duplicate, Export and confirmed Delete.
- Separate autosave and manual slots per company. IndexedDB database upgrades from v1 to v2 with companies/meta stores; original `saves` records remain intact for recovery. Migration is transactional/idempotent. Gameplay payload stays backward compatible with v1 through optional additive home/wardrobe fields.
- Save-and-return now pauses and checks save success before leaving. Failed writes no longer appear successful to this workflow.

## Explicitly unfinished

The requested full overhaul is a multi-phase roadmap. This increment does **not** implement:

- Rigged realistic human assets, fingers/faces, animation blending, typing/sitting or final-quality furniture models. Existing founder remains procedural; clothing display is a working sample preview, not a skinned cloth simulation.
- Bathroom, full detailed interiors, real glass transmission, normal/roughness texture sets from scanned assets, weather or sophisticated indirect lighting. Current detailed models/materials are still procedural development assets.
- Ten playable industries, unique industrial manufacturing, employee AI, retail shoppers, factories or property progression. Only the original clothing business is playable.
- Full furniture editor, undo/redo, navigation waypoints, supplier travel, cosmetic formulation, bicycle assembly, vehicles that can be driven, or an interactive city economy.
- The new optional tutorial with a one-time $100 bonus. Existing guided objectives still function and no reward is falsely granted.
- Ultra/Custom graphics settings or hardware-specific performance certification.

## Next priorities

1. Validate navigation on physical trackpads and add camera/building occlusion handling.
2. Import a locally bundled, licensed and rigged humanoid; use garment skinning and animation state transitions.
3. Implement tutorial task evidence and single-claim ledger reward with migration tests.
4. Add stationery as the next complete industry with paper/cutting inventory and distinct machine workflow, then MTB accessories and hair accessories. Do not reuse a heat press under different labels.
5. Add bathroom and richer building models, then furniture placement backed by navigation collision data.
6. Introduce multi-factor progression, property rent, staffing and measured hardware budgets.

Save storage remains tied to the browser origin. Moving from `.pages.dev` to `.workers.dev` does not automatically transfer IndexedDB: export from the old address and import at the new one. No deployment or live URL verification is implied by a local build.

## Validation

- Production build and strict TypeScript checks passed; the existing large Three.js bundle warning remains (~344 KB gzip for the main JS bundle).
- 17 unit checks passed: original economy/save tests, owned-sample accounting, saved home controls, solid walls, door apertures and substepped movement.
- Seven browser scenarios passed across the production-build runs: original sale/upgrade/reload loop, mobile layout, manual slots/export/import, repeated independent-company switching, original autosave migration, wardrobe/home-control persistence with an actual walk outdoors, and cancelled/confirmed company deletion.
- A low-frame-rate movement failure discovered during testing was corrected using elapsed-time motion with collision substeps. Low quality now disables contact shadows as well as dynamic shadows.
- Tests used Chromium software rendering. No Safari/MacBook hardware performance claim or live Cloudflare deployment verification has been made.
