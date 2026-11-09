# Hands-on clothing — first complete workflow

This increment adds an opt-in, saved hands-on cotton tee workflow to the existing game. It preserves all three industries, original saves, starter stock, company separation, earned garage progression and the existing streamlined recipes. It does not implement staffed warehouses, factories or new hands-on MTB/hair activities.

## Playing the workflow

1. Save a cotton tee design in the computer's Design Studio. In Supplier Market choose Common Thread, Threadline Wholesale or Cotton Collective. Prices, material grades, minimum quantities and delivery times differ and change the actual invoice/delivery.
2. At the clothing manufacturing bench, choose **Start hands-on clothing**. This enables the material/inspection shelf and contextual world actions. **Station options** opens the detailed controls for the nearby station.
3. Order materials, wait for the delivery outside the home, then use E or tap the nearby prompt to pick up the box. Carry it to the material shelf. Open it there to transfer its contents into stock. The box disappears only when its contents are transferred.
4. Pick a blank from the shelf. Carry it to the press, choose a saved tee and lay it down. Centre the transfer using the simple slider, then lower the press. Twelve simulation seconds and centred placement give the best technique result. Ink is charged once; premium finishing retains its extra material charge.
5. Wait for the cycle, collect the actual printed shirt, carry it to the inspection shelf, inspect it and put it in finished stock. It cannot be advertised/sold while still on the press or in the player's hands. Material grade and technique affect the recorded print grade; imperfect work remains saleable rather than destroying starter materials.
6. Promote finished stock on the computer. Customer orders reserve real units through the existing demand system. At the shelf collect the product reserved for an order, then carry it to the packing table.
7. Place the product, add one protective mailer, attach its customer label, optionally buy one $0.50 branded insert, seal the parcel and pick it up. Labels show the fictional customer and order ID. A mismatched order ID is rejected without losing the item.
8. Carry the parcel to the front-door collection area (or garage dispatch point). Pay postage once. The existing delivery clock credits the agreed order price once, including after save/reload.

Direct E/tap actions cover the physical steps. No precision dragging or middle mouse button is required. Carrying uses the existing founder with a carrying pose. The press lid, staged shirt, shelf stock, labelled parcels and collection objects reflect simulation state. Optional short synthesised workshop effects use the existing volume control; they are off by default.

After the first inspected print, existing timed repeat printing is available when hands/press are clear. **Use streamlined workflow** returns to the original loop when no item is held or staged. Other clothing families retain their specialist sourcing/inspection recipes; the new hand-printing line accepts cotton tees only.

## Accounting and saves

A company owns one carried object, one staged press unit and one packing-table item. The last printed placement/grade is retained on its product template, so the representative stock and packing preview uses that placement. Branded-insert choices remain on the customer order after the parcel leaves the table. Taking a blank removes it from material stock; staging/carrying it still occupies capacity. Supplier deliveries retain reserved capacity until unpacked. Printed stock is added only after inspection and shelf placement. A customer product is already reserved by its order; picking it does not subtract another unit.

Carried delivery IDs, press stage/end time/alignment/grade, packing stage, parcel ownership, material grade and learned workflow state are optional version-one save fields. Every transition autosaves through the existing serialized queue. Imports validate these references and stages. Original pending jobs and old companies with no workshop fields remain valid. A picked box cannot also be received through the legacy shortcut, and physical orders cannot be shipped through the old button.

Supplier quality currently uses a weighted grade for the company's blank inventory, not individually tracked fabric lots. Rendered shelf stacks are bounded for performance. The models remain procedural; cloth simulation, a rigged pickup animation set and a full authored asset replacement are unfinished. Quality is recorded for inspection, not a new price/review market system.

## Remaining stages

Industry-specific assembly/finishing interactions, staff hiring, warehouses, factory machinery/maintenance, earned staff automation, richer stock organisation, additional sound categories and detailed human animations remain future work. No staff or factory menu is presented as a finished system.

## Validation

Unit coverage includes the entire physical loop with save validation at every step; duplicate/early receipt, collection and shipping rejection; wrong-order rejection; one-time material and packaging consumption; supplier cost/minimum/time/grade effects; and supplier rebates coinciding with the tutorial grant. The production browser scenario walks the real route, prints, inspects, packs, dispatches, reloads and verifies payment. All 62 unit checks and all 26 production Chromium scenarios passed. Three final targeted browser checks also passed, covering both first-person input presets and the expanded workflow with first-person carrying and a reload while carrying a box. The production build passes with the existing bundle-size advisory. Tests use synthetic input; physical MacBook/Windows and Safari testing remain outstanding. See OVERHAUL_PROGRESS.md for current scope.
