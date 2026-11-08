# Initial economy

All internal amounts are integer cents. Edit `src/game/catalog.ts` for shared costs/timings/upgrades; demand rules currently live in `simulation.ts`.

| Item                                              |                Amount |
| ------------------------------------------------- | --------------------: |
| Founder cash contribution                         |                  $500 |
| Initial blanks / mailers                          |                 5 / 5 |
| Cotton blank                                      |                   $12 |
| Heat transfer ink                                 |            $4 per job |
| Mailer                                            |                    $2 |
| Postage                                           |          $5 per order |
| Default retail                                    |                   $39 |
| Complete replacement variable cost                |                   $23 |
| Contribution before promotion                     |                   $16 |
| Promotion                                         |                    $5 |
| Maximum orders per promotion with available stock |                     3 |
| Promotion cooldown                                |            35 seconds |
| Production / upgraded production                  |        12 / 7 seconds |
| Delivery                                          |             8 seconds |
| Storage / upgraded storage                        | 20 / 40 garment units |

Starting supplies are founder-provided and not expensed at game start. The first order therefore changes cash from $500 to $525: $4 ink, $5 promotion, $5 postage, $39 receipt. At replacement cost the same order contributes $11 after a single promotion. Three sales per promotion contribute $43. This distinction is shown in the cash-basis report.

One demand unit checks available stock every 10 simulation seconds. The starting audience accepts prices up to $49, increasing $0.80 per reputation point. Overpriced products wait rather than generating guaranteed sales. The simplified threshold is an initial model to replace with segmented probabilistic demand later. Posts earn small initial reach (65 views, 8 followers), not automatic virality.

Shelving costs $120 with no order prerequisite. The $180 press requires five delivered orders. The $240 product lighting kit requires ten. Achievement names are awarded once and do not give cash, avoiding repeated reward exploits. The garage target is $10,000 cumulative revenue and is a future phase, not a currently implemented property.

Before changing values, run `npm test` and the browser loop. Evaluate the first five shirts, cash needed to replace materials, worst-case unsold inventory, storage saturation and ability to pay shipping. Later wages, rent, returns and tax mechanics need explicit ledger categories and regression tests before they are activated.

## Multi-industry update

Product costs and industry-specific values are now in `src/game/industries.ts`.

| Product              | Supplier unit cost | Default retail | Additional preparation                                  |
| -------------------- | -----------------: | -------------: | ------------------------------------------------------- |
| Cotton T-shirt       |                $12 |            $39 | $4 transfer ink                                         |
| Frame-protection kit |              $4.50 |            $24 | $15 prototype per new design; timed incoming inspection |
| Trail mudguard       |              $7.50 |            $29 | $15 prototype per new design; timed incoming inspection |
| Acetate claw clip    |                 $6 |            $22 | $0.50 label + $1.50 ink/presentation                    |
| Pocket comb          |                 $4 |            $18 | $0.50 label + $1.50 ink/presentation                    |

Each fulfilled order also uses a $2 mailer and $5 postage. Promotions cost $5 and reach at most three initial buyers when stock/pricing permit. Starting materials are a founder contribution: clothing gets five blanks; hair gets five labels; MTB gets no fictional raw material stock because it contracts finished accessories. All get five mailers and $500 cash.

MTB prototype/inspection and hair labelling have real elapsed-time jobs. Contract deliveries take 25 seconds for protection kits, 35 for guards and 20 for accessories. Incoming stock is not saleable. Capacity includes jobs, incoming items, finished products and reserved orders; prototype jobs produce no inventory and occupy no stock units.

The optional tutorial grant is $100 exactly once, excluded from revenue and cash-result unlocks. See INDUSTRIES_RELEASE.md for the real garage thresholds and perks; it supersedes the former statement that garage progression was only a future target.
