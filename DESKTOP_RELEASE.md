# SummitOS and expanded starter catalogues

This release implements the computer-led UI phase and expands the three existing industries. It is an incremental overhaul of the existing game, not completion of the full 150-product, 20-industry brief.

## Working systems

- The permanent business dock, scene-wide workstation labels, journal sidebar and duplicate objective panel are removed. A compact HUD shows company, cash, day, settings/map and local save state.
- One interaction prompt selects a nearby station by distance, facing and room partition. Menus and computer windows hide prompts and disable world pointer input. The physical computer is accessible from the right side of the bedroom desk; the owned garage has its own computer.
- SummitOS has original mountain wallpaper, desktop icons, app search, taskbar and draggable windows with focus, minimise, restore, maximise and close. Escape exits the computer and restores the world camera. Save & Exit waits for a successful local write.
- Working apps: Design Studio, Product Catalogue, Supplier Market, SocialHub, Orders, Finances, Property, Online Store, fictional Email Inbox and Settings. Employees is intentionally absent until staffing has real gameplay.
- Product Catalogue supports search, category filters, cost/price/name sorting, persistent favourites, comparison, inventory, retail prices and estimated direct margins. Designs support named collections, seasonal release metadata and standard/premium finishing. Seasonal metadata does not yet change demand.
- Online Store changes its actual preview theme, opens/closes order intake and lists/unlists individual products. Existing orders can still be fulfilled after closing the store.
- Finances plots actual ledger cash balances. The fictional inbox reflects actual game orders and deliveries; it does not send email or provide authentication.
- Supplies are purchased on the computer, reserve capacity while inbound, take 18 simulation seconds to arrive, and must be unpacked at the front door. Supplier product batches take their product-specific manufacturing duration, then 8 seconds of transit. Receipt, inspection, labelling, printing, packing and shipping remain physical tasks. Receipts cannot be applied twice.
- Minimising an app preserves its draft and form state; hidden 3D previews stop rendering.
- Movement accelerates and turns smoothly; releasing movement stops translation. Slow-frame steps are capped to prevent long jumps. Existing camera collision, primary-button drag, wheel/pinch zoom, first-person mode, key rebinding, blur recovery and no-middle-button controls are retained. Opening the computer clears held movement and releases drag capture.
- Low, Medium, High and Ultra presets configure resolution, shadows, antialiasing, contact shadows and authored/procedural texture detail. Individual controls are available. Antialiasing requires a reload. Product previews render on demand. Low also uses simpler box geometry and Lambert materials. Keyboard keycaps share one instanced draw.

## 25 playable product types

| Industry             | Product types                                                                                                        | Production                                                                                                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Streetwear (8)       | Cotton tee; long-sleeve shirt; pullover hoodie; crewneck; jersey shorts; canvas tote; six-panel cap; rib-knit beanie | Tees consume cotton blanks and paid transfer ink. Other pieces use paid specialist sewing, knitting or embroidery batches, delivery receipt and inspection. Hoodie unlocks at reputation 3.                                                      |
| MTB (9)              | Frame protection; mudguard; grips; end plugs; number plate; tool strap; bottle; bottle cage; headset top cap         | Paid prototype approval, product-specific contracted manufacture, delivery receipt and incoming inspection. Top cap unlocks at reputation 5. Compatibility data describes fit; this is a manufacturing game, not real engineering certification. |
| Hair accessories (8) | Claw clip; comb; paddle brush; scrunchie; headband; pin set; hair towel; styling pouch                               | Paid finished accessory sourcing, delivery receipt, then one paper label and paid presentation per saleable item. No cosmetic formulation is simulated.                                                                                          |

Definitions include stable IDs, categories, materials, methods, costs, suggested prices, duration, quality, shipping size, compatibility and reputation unlocks. Shapes distinguish product families in the designer. Quality and shipping-size fields are descriptive in this release; postage remains the existing $5 flat rate. Premium finishing costs 25% more in materials and adds 8 seconds; margins and supplier quotes use the same calculation as payment.

## Saves and deployment

The original IndexedDB database and company/manual-slot records remain. New optional fields store deliveries, favourites, collections, finish, seasons and storefront settings. Legacy missing fields retain their original behavior. Loading a manual slot also resets the physical character/camera from that snapshot, including when the company ID stays the same. Original pending print jobs still complete. No Supabase, login backend or database replacement is added here. Unfinished email/D1 work remains separate on `feature/email-cloud-saves`.

Source remains compatible with the existing Vite/Cloudflare static build (`npm run build`, output `dist`). A Git push is not evidence that the Cloudflare deployment succeeded; check the connected deployment before claiming the live site updated.

## Remaining brief

The full 150 products and 20 industries, specialist safety-critical components/cosmetics approvals, staffing/wages/training/automation, supplier negotiation, returns, campaigns, deeper seasonal demand, retail/warehouses/HQ, furniture editing, rigged human models, authored neighbourhood/environment assets, NPC traffic/weather and expanded soundscape remain unfinished. Current authored asset attribution remains in ASSETS.md. Most world geometry is still procedural.

## Validation

`npm test`: 58 checks pass across 8 files, including complete supply-to-sale/save-validation loops for all 25 product types. Strict TypeScript and Vite production builds pass (large-chunk advisory remains). The broad production Chromium run passed 23/25 scenarios; after correcting the physical wardrobe test route and waiting for company activation, all four targeted save/wardrobe/company/garage reruns passed. All 25 distinct browser scenarios are verified across those runs. The final desktop window/draft check also passed on the release build and captured the release preview. Automated Chromium tests exercise synthetic mouse/trackpad events; they do not constitute physical MacBook, Windows hardware or Safari testing. WebKit availability is constrained by the environment's browser-download network policy.
