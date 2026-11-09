> Historical first multi-industry release. The current 25-product catalogue, computer UI and physical delivery changes are documented in [DESKTOP_RELEASE.md](DESKTOP_RELEASE.md).

# Company Tycoon — multi-industry delivery report

## Delivered systems

This update extends the existing Company Tycoon code and preserves the original Streetwear Empire save format. It implements three playable starter businesses, not all ten requested industries.

| Industry                   | Implemented product families                          | Actual workflow                                                                                                                                                                                                           |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Streetwear & Clothing      | Cotton T-shirts in regular, oversized and boxy cuts   | Buy cotton blanks; consume a blank and paid transfer ink; wait for the heat press; advertise; pack; ship; receive payment on delivery.                                                                                    |
| MTB Accessories            | Frame-protection decal kits; flexible trail mudguards | Design the actual accessory; pay for prototype materials and setup; wait for prototype approval; commission a paid batch of three; wait for the specialist supplier; inspect the incoming batch; only then sell and ship. |
| Hair & Styling Accessories | Acetate claw clips; pocket styling combs              | Design accessory colours and a label; order a paid supplier batch; receive unlabelled stock; consume a paper label and ink/presentation cost per piece; only completed labelled pieces enter saleable inventory.          |

MTB and hair products do not use T-shirt blanks or heat presses. Their previews and starter equipment have distinct geometry. Shared accounting, marketing, order reservation, packaging and delivery remain shared infrastructure. A single company has one active production/sourcing job in this starter implementation.

The main menu now offers Create Company → industry selection → company identity. The other seven industries are visibly labelled **not playable yet**, rather than fake choices: technology accessories, skateboards, automotive accessories, home decor/furniture, sports equipment, bags/travel, and stationery/creative products.

## Independent companies and compatibility

Each company stores its industry, designs, materials, sourced stock, approvals, jobs, cash, orders, ledger, achievements, tutorial progress, property and wardrobe in its own existing IndexedDB company record. Switching companies does not reuse another company's inventory or money. The old `saves` records are not deleted.

New fields are optional in version-one gameplay saves. An old save without an industry is treated as streetwear. Existing pending shirt jobs without a job kind still complete as shirt production. New fields are validated during import, including material balances, product/industry compatibility, job quantities and tutorial grants. Original clothing and wardrobe functionality remains available for clothing companies.

## Tutorial

Every new company receives an optional welcome prompt. Eleven tasks cover movement, computer use, product creation/pricing, supplies, completed production, promotion, an order, packing, delivery and finances. The production guidance names the selected industry's actual workflow.

Completion adds exactly one $100 **grant**, not sales revenue. Reward state and task evidence persist. Skipping preserves progress; Settings can resume or replay. Replaying a rewarded tutorial cannot pay another grant, and duplicated grant records are rejected by save validation. Duplicating a company preserves its reward history rather than resetting eligibility.

## Real progression beyond the bedroom

A garage is a purchasable, separate world location with a larger workbench, equipment, dispatch table and shelving. Purchasing moves the founder into that workspace. It persists after reload.

Eligibility combines all of: industry-specific revenue and order milestones, $500 net cash result (revenue minus all recorded cash expenses, excluding grants), reputation 15, owned storage shelving, and sufficient purchase cash. Streetwear requires $10,000 revenue / 50 deliveries / $1,800 purchase cash; MTB $8,000 / 40 / $1,500; hair accessories $6,000 / 60 / $1,200. These are starting balancing values, not a finished full-game economy.

The garage raises storage to 60 pieces and outsourced/sourced batch size from three to six. The equipment upgrade changes real processing durations: heat transfer 12→7 seconds, MTB prototype/inspection 12→6 and 10→5 seconds, hair labelling 6→3 seconds. Product photography improves reach; shelving improves capacity. A clickable neighbourhood map shows the founder and owned/available home/garage locations and places a world waypoint without teleporting or granting properties.

Commercial units, employees, retail stores, factories, headquarters and international stages remain unfinished. No claim is made that the full 14-stage progression is complete.

## Assets and graphics

A locally bundled CC0 Sheen Chair by Wayfair/Eric Chadwick is used in High quality. It has authored meshes, fabric/wood/metal materials, normal maps, ambient occlusion, and sheen; it is not a noise-texture substitute. Low quality retains a lightweight chair. The exact source, licence, file size and checksum are in ASSETS.md.

Accessory models, prototype fixture, label applicator and garage are original procedural development assets. Existing ground/wall textures and most furniture remain procedural. The founder still has no realistic humanoid rig, face/fingers, sitting/typing clips or animation blending. The imported chair is a graphics improvement; it is not being represented as a completed sitting mechanic or a complete realism overhaul.

A tree formerly overlapping the garage location was moved. Collision regions cover the garage envelope, benches/shelves, original chair and parked car. The scene renders on demand when idle, while movement, camera damping and active equipment request frames. Hardware performance has not been certified. Save success is now tied to completion of the newest queued IndexedDB write, and imports preserve the current session if persistence fails.

## Controls and interaction fixes

- Separate orbit, zoom and movement sensitivity plus camera damping and mouse/trackpad presets.
- Configurable movement, sprint, jump, interaction, phone, inventory, workspace and map keys; duplicate/reserved bindings are rejected and preferences persist.
- Primary-button drag, ordinary wheel and pinch-style wheel zoom. No gameplay requires a middle mouse button; right drag is optional.
- Panel scroll is isolated from the world canvas. Menus block world input; text fields do not move the founder. Escape closes panels even from text inputs.
- Nearest-station keyboard selection rather than choosing the first station in a list. Garage station prompts show unlock information until owned.
- Camera ray checks against furniture/buildings; pointer cancellation and focus-loss cleanup release held controls. First-person drag look is available without pointer lock.
- Original explicit Save & return to menu remains and checks local save success.

## Test evidence and limits

The final test results are reported in the delivery message and recorded below after validation. Automated input events approximate trackpad/mouse behaviour; they are not tests on physical MacBook or Windows hardware.

Firefox and WebKit installation attempts reached their official Playwright download URLs but were blocked with HTTP 403 `Domain forbidden` for `cdn.playwright.dev` and `playwright.download.prss.microsoft.com`. Neither browser is reported as tested. Chromium software rendering is available.

## Work still missing

The seven other playable industries; a fully rigged realistic human and animation pipeline; a large detailed furniture catalogue and placement/move/rotate/undo editor; complete interiors/bathroom; full PBR asset replacement; employee AI and wages; retail customers; rent/maintenance/returns/taxes; factories, research, competition, vehicles and international endgame. Current city map is the starter neighbourhood, not a complete streamed city.

Email authentication and D1 were explicitly set aside by the latest request. Their unfinished code is preserved separately on `feature/email-cloud-saves`, not merged into this gameplay update and not claimed live or complete.

## Final verification record

- `npm run build`: passed strict TypeScript and Vite production build. Main JS is approximately 377 KB gzip; Vite still reports a large-chunk warning. The authored chair is a separate 4.13 MB local asset, loaded in High quality.
- `npm test`: **31 tests passed** in six files. Includes all five families, original economy/wardrobe rules, input validation, camera-wall intersection, per-company reward replay, garage eligibility, legacy snapshots, and a deferred-write test proving that “Saved” waits for the newest queued snapshot.
- Chromium: **20 distinct scenarios passed across production-build runs and affected-case reruns**, rather than one single final full-suite invocation. Coverage includes authored asset loading; mouse/trackpad primary drag, wheel/pinch, scrolling, key rebinding and preference reload; text/menu/focus isolation; main-menu settings without creating a company; all original sale/save/export/import/migration/wardrobe/deletion flows; all three industry sale loops; three-industry switching; tutorial reward/reload; real garage purchase/batching/reload; two additional desktop widths; and a quota-failure import regression.
- The initial broad run found timing and save-status problems in the outdoor movement check. They were fixed and the affected cases rerun. A manual save now immediately says “Saving…” and cannot report success while a newer queued snapshot is pending. Failed imports persist neither a replacement campaign nor a success claim; the current company is saved before a validated import is applied.
- Fixed timed sleeps in movement/tutorial tests to wait for actual observable progress, keeping collision and reward assertions intact.
- Firefox and WebKit: unrun because official download hosts were explicitly denied by the environment's network policy (HTTP 403). Physical MacBook trackpad, Windows PC and Safari hardware validation were not performed.
- Existing local save records were retained; no reset/delete migration was introduced. Production D1/auth deployment is outside this update, following the latest request. No live Cloudflare success is asserted without an observed deployment result.
