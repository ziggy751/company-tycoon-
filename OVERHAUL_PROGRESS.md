# Company Tycoon — current overhaul status

The latest increment adds the opt-in hands-on cotton tee and fulfilment workflow, documented in **HANDS_ON_RELEASE.md**. The computer interface and 25-product starter catalogue are documented in **DESKTOP_RELEASE.md**. Earlier home/save and multi-industry work is documented in **INDUSTRIES_RELEASE.md**. The full realism/world brief remains in progress.

## Current playable scope

Hands-on clothing now supports supplier comparison, physical box carrying/unpacking, blank handling, transfer placement and press operation, inspection, reserved customer-product handling, packaging/labels/inserts and physical courier collection. Held items and workstation stages are saved. First-person and third-person carrying, optional sound effects and a learned streamlined workflow are included. Other industries retain their existing specialised processes.

The permanent business dock has been replaced by a physical computer and SummitOS app windows. Supplies and contracted batches now travel through tracked deliveries and physical receipt. Catalogue browsing, favourites/comparison, collections, premium finishing, a configurable online storefront and ledger cash-flow chart are working.

Three industries: Streetwear & Clothing, MTB Accessories, Hair & Styling Accessories. Each has its own actual production/sourcing steps, costs, products, starter equipment and progression data. All three share the existing legitimate order/packing/shipping/ledger loop and independent local company saves.

The optional per-company tutorial pays $100 once, with saved task progress and replay protection. A gated garage purchase opens a real separate workspace with greater capacity and larger sourced batches. Controls support primary drag, mouse/trackpad presets, configurable keys, camera damping and collision checks, with no middle-button requirement.

A verified CC0 authored chair and its embedded material maps are bundled locally for High quality; most other assets and the founder remain procedural. See ASSETS.md. No claim of full photorealism or realistic human animation is made.

## Preserved baseline

The original first increment is retained in history at `4071d92`; the pre-overhaul branch remains `backup/before-company-overhaul` at `d24fbcf`. Existing original save records remain in IndexedDB. Missing industry fields default to streetwear and original pending print jobs still work.

## Remaining work

The full furniture editor, rigged human/animation work, richer interiors, the remaining industries toward the requested total of 20, retail/NPC/employee systems and the complete long-term property ladder are unfinished. Industry cards for future work are explicitly disabled, not fake working industries.

See DESKTOP_RELEASE.md for the current 25 implemented product types and workflows; INDUSTRIES_RELEASE.md records the previous release. The 150-product target remains unfinished. See these files for costs, milestones, fixes, test evidence and limitations. Email login/D1 is separate unfinished work on `feature/email-cloud-saves`; it is not part of the current gameplay delivery.

## Current phase status

- Phase 1 core: physical computers, ten working apps, window management, minimal HUD, contextual prompts and input isolation are implemented. Staffing remains a Phase 5 system; no decorative Employees app is presented as functional.
- Phase 2 partial: 25 types across the original three industries, real recipe costs and processing, meaningful contracted vs physical workflows, browsing/comparison, collections and premium finishing. Collections/seasons are saved metadata; seasonal demand and the full 150 types are unfinished.
- Phase 3: no additional playable industries in this increment.
- Phase 4 partial: detailed procedural computer hardware and rendering presets/optimisation; full authored environments and a rigged human are unfinished.
- Phase 5: existing earned garage progression is preserved; staffing, automation and the wider property ladder are unfinished.
- Phase 6 partial: expanded unit/browser regression coverage, input, receipt and save fixes. Physical MacBook/Windows hardware and Safari have not been tested.

## Bugs fixed in this increment

Scene-wide labels and duplicate objectives no longer leak into menus. Business tools cannot be opened from across the world. Pointer capture and held movement clear when entering the computer. Camera restoration is immediate on exit. Minimising apps preserves drafts. Pending deliveries reserve storage and cannot be received twice. Premium material quotes and charges agree. Manual slot loads reset physical position even for the same company. Stale movement is blocked across company/property activation. A new garage desk has navigation collision. Empty expense totals display zero correctly.

## Validation status

The latest production TypeScript/Vite build and all 62 Vitest checks pass. The complete production Chromium suite passed all 26 scenarios. A final targeted run also passed both first-person mouse/trackpad checks and the expanded manufacturing scenario, including first-person box carrying, reload while carrying, printing, inspection, packaging, dispatch and payment after reload. The first-person carrying screenshot was visually inspected.

Gameplay tests use Low under the software renderer, with a separate High-quality authored-asset render test. Physical MacBook/Windows hardware and Safari have not been tested. No hardware FPS claim is made. The main JS bundle is approximately 1.37 MB / 391 KB gzip; Vite's existing large-chunk advisory remains.

The hands-on loop validates save ownership at every transition, including picked boxes, staged press work and reserved parcels. Tests reject duplicate/early receipts, duplicate collection/shipping, wrong-order placement and corrupted ownership. Supplier grade, minimum order, timing, actual costs and tutorial-grant accounting are covered. See HANDS_ON_RELEASE.md for the route and remaining stages.
