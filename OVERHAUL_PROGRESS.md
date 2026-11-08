# Company Tycoon — current overhaul status

The first home/save increment is followed by the multi-industry update documented in **INDUSTRIES_RELEASE.md**. This is still not the complete original realism/world overhaul.

## Current playable scope

Three industries: Streetwear & Clothing, MTB Accessories, Hair & Styling Accessories. Each has its own actual production/sourcing steps, costs, products, starter equipment and progression data. All three share the existing legitimate order/packing/shipping/ledger loop and independent local company saves.

The optional per-company tutorial pays $100 once, with saved task progress and replay protection. A gated garage purchase opens a real separate workspace with greater capacity and larger sourced batches. Controls support primary drag, mouse/trackpad presets, configurable keys, camera damping and collision checks, with no middle-button requirement.

A verified CC0 authored chair and its embedded material maps are bundled locally for High quality; most other assets and the founder remain procedural. See ASSETS.md. No claim of full photorealism or realistic human animation is made.

## Preserved baseline

The original first increment is retained in history at `4071d92`; the pre-overhaul branch remains `backup/before-company-overhaul` at `d24fbcf`. Existing original save records remain in IndexedDB. Missing industry fields default to streetwear and original pending print jobs still work.

## Remaining work

The full furniture editor, rigged human/animation work, richer interiors, seven other playable industries, retail/NPC/employee systems and the complete long-term property ladder are unfinished. Industry cards for future work are explicitly disabled, not fake working industries.

See INDUSTRIES_RELEASE.md for exact implemented families, workflows, costs, milestones, fixes, test evidence and limitations. Email login/D1 is separate unfinished work on `feature/email-cloud-saves`; it is not part of the current gameplay delivery.
