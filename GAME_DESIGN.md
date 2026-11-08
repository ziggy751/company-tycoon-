# Game design and architecture

## Vision

Grow an independent label through real product margins and fulfilment, from bedroom to global company. Start with tangible work and reward the first five delivered shirts. Expansion must preserve the working loop before adding complexity.

## The bedroom loop

Design → manufacture → advertise → accept order → package → ship → receive payment → reinvest.

The starting endowment is $500, five cotton blanks, and five mailers. Designing has no cost. Manufacturing consumes stock and paid ink. Advertising buys finite discovery demand, not guaranteed money. Orders reserve existing inventory. Packing consumes a mailer; shipping costs postage. Delivery recognises the agreed order price once. A price edit cannot change existing orders.

Normal speed advances one simulation second per real second; fast-forward advances three. The displayed business day is deliberately compressed to 240 simulation seconds. No background or offline progress occurs. Pause, settings, save journal and hidden-tab state stop advancement.

## Ownership of state

Pure `act` and `tick` functions own economic transitions and never depend on frame rate or animation callbacks. Commands clone input state and reject invalid actions atomically. Integer cents avoid floating-point accounting drift. IDs are monotonic within a save. Each order has a one-way state machine; only `shipping → delivered` credits revenue.

Zustand coordinates player actions, notifications, graphics settings and serialised IndexedDB writes. Rendering consumes state; the press does not create items itself. Saved jobs and shipments retain simulation deadlines. Reloading requires the remaining simulation time rather than issuing duplicate rewards.

## Data and extensibility

Product designs are records rather than hardcoded UI options. Costs, timings, upgrades and milestones live in `catalog.ts`. Add new products with typed manufacturing recipes before adding matching art/UI. Add employees with clock-driven wage entries and task assignment, then render their actions. Add store sales by moving inventory into location records and requiring sufficient local stock.

Future property milestones: garage at $10k revenue, commercial unit at $50k, retail at $150k, regional at $500k, national at $2m, premium at $10m, international at $30m, global at $100m, then legend. These are design targets, not implemented unlocks beyond bedroom equipment. Require positive operating results and capacity alongside revenue when these phases are built.

## Presentation and assets

Warm cotton, muted sage, timber and steel. A cutaway bedroom gives a readable third-person view on a trackpad. Compact cream/green UI uses a journal motif. Garments are extruded silhouettes with locally generated CanvasTexture print art. There are no runtime asset/CDN calls or unlicensed external assets.

## Save contract

Version 1 saves include all implemented company, economic, time, design, world, job and order data. Settings are localStorage preferences independent of the campaign. Load validates structure, relationships and the balance-to-ledger reconciliation. Future schema changes must add explicit migrations and round-trip tests. Browser backups must remain local unless the user separately authorises future cloud storage.
