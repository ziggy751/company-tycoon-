import { useState } from "react";
import { useGame } from "../game/store";
import {
  industryOf,
  productOf,
  supplierUnitCost,
  directUnitCost,
  PRODUCTS,
  METHOD_LABELS,
  type ProductKind,
} from "../game/industries";
import { capacity, occupied } from "../game/simulation";
import { money } from "../game/catalog";

export function SupplierApp() {
  const g = useGame((s) => s.game)!,
    dispatch = useGame((s) => s.dispatch),
    industry = industryOf(g);
  return (
    <>
      <div className="app-intro">
        <small>SUPPLIER MARKET</small>
        <h2>Good products start here.</h2>
        <p>
          {industry.supplier} · tracked deliveries · inspect at your workspace
        </p>
      </div>
      <div className="cost-note">
        <span>Reserved storage, including inbound goods</span>
        <b>
          {occupied(g)} / {capacity(g)}
        </b>
      </div>
      {[
        {
          item: "packaging" as const,
          name: "Protective mailers",
          cost: 200,
          count: g.packaging,
        },
        ...(industry.id === "streetwear"
          ? [
              {
                item: "blanks" as const,
                name: "Cotton T-shirt blanks",
                cost: 1200,
                count: g.blanks,
              },
            ]
          : []),
        ...(industry.id === "haircare"
          ? [
              {
                item: "labels" as const,
                name: "Paper brand labels",
                cost: 50,
                count: g.labels || 0,
              },
            ]
          : []),
      ].map((p) => (
        <article className="supply" key={p.item}>
          <div className="row">
            <strong>{p.name}</strong>
            <span>{p.count} on hand</span>
          </div>
          <p>{money(p.cost)} per unit · arrival in 18 seconds</p>
          <button
            className="secondary"
            onClick={() =>
              dispatch({ type: "order-supplies", item: p.item, quantity: 1 })
            }
          >
            Order 1
          </button>{" "}
          <button
            className="primary"
            onClick={() =>
              dispatch({ type: "order-supplies", item: p.item, quantity: 5 })
            }
          >
            Order 5 · {money(p.cost * 5)}
          </button>
        </article>
      ))}
      {g.designs
        .filter((d) => productOf(d).method !== "transfer")
        .map((d) => (
          <article className="supply" key={d.id}>
            <strong>{d.name}</strong>
            <p>
              {productOf(d).material} · {money(supplierUnitCost(d))} / piece
            </p>
            <button
              className="primary"
              disabled={
                !!g.jobs.length ||
                (industry.id === "mtb" && !d.prototypeApproved)
              }
              onClick={() => dispatch({ type: "contract", id: d.id })}
            >
              Contract {g.property === "garage" ? 6 : 3} pieces ·{" "}
              {money(supplierUnitCost(d) * (g.property === "garage" ? 6 : 3))}
            </button>
            <small>
              {industry.id === "mtb" && !d.prototypeApproved
                ? "Make and approve a prototype at your physical bench first."
                : `Manufacturing ${productOf(d).seconds + (d.finish === "premium" ? 8 : 0)}s, then 8s transit. Receive at the front door.`}
            </small>
          </article>
        ))}
      <h3>DELIVERY TRACKING</h3>
      <Deliveries receiving={false} />
    </>
  );
}
function Deliveries({ receiving }: { receiving: boolean }) {
  const g = useGame((s) => s.game)!;
  return (
    <>
      {!g.deliveries?.length && (
        <p className="muted">
          No deliveries in transit. Order supplies on the computer.
        </p>
      )}
      {g.deliveries?.map((d) => (
        <article className="order" key={d.id}>
          <strong>
            {d.quantity} ×{" "}
            {d.item === "batch"
              ? g.designs.find((p) => p.id === d.designId)?.name
              : d.item}
          </strong>
          <p>
            {d.arrives > g.time
              ? `In transit · ${d.arrives - g.time}s`
              : "Delivered · waiting to be unpacked"}
          </p>
          {receiving && (
            <button
              className="primary"
              disabled={d.arrives > g.time}
              onClick={() =>
                useGame.getState().dispatch({ type: "receive", id: d.id })
              }
            >
              Unpack delivery
            </button>
          )}
        </article>
      ))}
    </>
  );
}
export function ReceivingPanel() {
  return (
    <>
      <p>
        Unpack deliveries here to move reserved goods into your stock. Supplier
        batches still need inspection or labelling.
      </p>
      <Deliveries receiving />
    </>
  );
}
export function CatalogueApp({
  design,
}: {
  design: (kind: ProductKind) => void;
}) {
  const g = useGame((s) => s.game)!,
    industry = industryOf(g);
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState("name"),
    [fav, setFav] = useState(false),
    [category, setCategory] = useState("all"),
    [compare, setCompare] = useState<ProductKind[]>([]);
  const kinds = industry.products
    .filter(
      (k) =>
        (!fav || g.favourites?.includes(k)) &&
        (category === "all" || PRODUCTS[k].category === category) &&
        (PRODUCTS[k].name + PRODUCTS[k].material)
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "cost"
        ? PRODUCTS[a].unitCost - PRODUCTS[b].unitCost
        : sort === "price"
          ? PRODUCTS[a].price - PRODUCTS[b].price
          : PRODUCTS[a].name.localeCompare(PRODUCTS[b].name),
    );
  return (
    <>
      <div className="app-intro">
        <small>{industry.name}</small>
        <h2>Your next collection.</h2>
        <p>
          {industry.products.length} product types with material-specific costs
          and workflows.
        </p>
      </div>
      <div className="catalogue-tools">
        <input
          aria-label="Search products"
          placeholder="Search products or materials"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All categories</option>
          {[...new Set(industry.products.map((k) => PRODUCTS[k].category))].map(
            (c) => (
              <option key={c}>{c}</option>
            ),
          )}
        </select>
        <select
          aria-label="Sort products"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="name">Name</option>
          <option value="cost">Production cost</option>
          <option value="price">Suggested price</option>
        </select>
        <label className="check-label">
          <input
            type="checkbox"
            checked={fav}
            onChange={(e) => setFav(e.target.checked)}
          />{" "}
          Favourites
        </label>
      </div>
      {!!compare.length && (
        <div className="comparison">
          <h3>COMPARE PRODUCTS</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit cost</th>
                <th>Time</th>
                <th>Workflow</th>
                <th>Retail</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((k) => (
                <tr key={k}>
                  <td>{PRODUCTS[k].name}</td>
                  <td>{money(PRODUCTS[k].unitCost)}</td>
                  <td>{PRODUCTS[k].seconds}s</td>
                  <td>{METHOD_LABELS[PRODUCTS[k].method]}</td>
                  <td>{money(PRODUCTS[k].price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="catalogue-grid">
        {kinds.map((k) => {
          const p = PRODUCTS[k];
          return (
            <article key={k} className="catalogue-card">
              <div className="product-symbol">{p.symbol}</div>
              <small>
                {p.category} · quality {p.quality}/5
              </small>
              <h3>{p.name}</h3>
              <p>{p.material}</p>
              <dl>
                <dt>Manufacturing</dt>
                <dd>
                  {METHOD_LABELS[p.method]} · {p.seconds}s
                </dd>
                <dt>Unit cost / retail</dt>
                <dd>
                  {money(p.unitCost)} / {money(p.price)}
                </dd>
                <dt>Compatibility</dt>
                <dd>{p.compatibility}</dd>
              </dl>
              <div className="row">
                <button
                  className="primary"
                  disabled={g.reputation < p.unlockReputation}
                  onClick={() => design(k)}
                >
                  {g.reputation < p.unlockReputation
                    ? `Reputation ${p.unlockReputation}`
                    : "Design"}
                </button>
                <button
                  className="secondary"
                  aria-label={`Favourite ${p.name}`}
                  aria-pressed={g.favourites?.includes(k) || false}
                  onClick={() =>
                    useGame.getState().dispatch({ type: "favourite", kind: k })
                  }
                >
                  ☆
                </button>
                <label className="check-label">
                  <input
                    type="checkbox"
                    aria-label={`Compare ${p.name}`}
                    checked={compare.includes(k)}
                    onChange={() =>
                      setCompare(
                        compare.includes(k)
                          ? compare.filter((x) => x !== k)
                          : [...compare.slice(-2), k],
                      )
                    }
                  />
                  Compare
                </label>
              </div>
            </article>
          );
        })}
      </div>
      {!kinds.length && <p>No matching products.</p>}
      <h3>YOUR INVENTORY & PRICES</h3>
      {g.designs.map((d) => (
        <div className="row" key={d.id}>
          <div className="grow">
            <strong>{d.name}</strong>
            <small>
              {d.stock} ready · direct margin{" "}
              {money(d.price - directUnitCost(d))} before setup costs
            </small>
          </div>
          <label>
            Retail $
            <input
              className="price-input"
              type="number"
              aria-label={`Price for ${d.name}`}
              defaultValue={d.price / 100}
              onBlur={(e) =>
                useGame.getState().dispatch({
                  type: "price",
                  id: d.id,
                  price: Math.round(+e.target.value * 100),
                })
              }
            />
          </label>
        </div>
      ))}
    </>
  );
}
export function OnlineStoreApp() {
  const g = useGame((s) => s.game)!;
  return (
    <>
      <div className={`store-preview ${g.storeTheme || "midnight"}`}>
        <small>INDEPENDENT STOREFRONT</small>
        <h2>{g.brand}</h2>
        <p>{g.slogan}</p>
        <div>
          {g.designs
            .filter((d) => !g.listed || g.listed.includes(d.id))
            .map((d) => (
              <span key={d.id}>
                {d.name} · {money(d.price)}
              </span>
            ))}
        </div>
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          checked={g.storeOpen !== false}
          onChange={(e) =>
            useGame.getState().dispatch({
              type: "store",
              enabled: e.target.checked,
              theme: g.storeTheme || "midnight",
            })
          }
        />
        Store accepting orders
      </label>
      <label>
        Store theme
        <select
          value={g.storeTheme || "midnight"}
          onChange={(e) =>
            useGame.getState().dispatch({
              type: "store",
              enabled: g.storeOpen !== false,
              theme: e.target.value as "midnight" | "paper" | "violet",
            })
          }
        >
          <option value="midnight">Midnight</option>
          <option value="paper">Paper</option>
          <option value="violet">Violet</option>
        </select>
      </label>
      <h3>PRODUCT LISTINGS</h3>
      {!g.designs.length && <p>Save a design to create your first listing.</p>}
      {g.designs.map((d) => (
        <label className="row" key={d.id}>
          <span>
            {d.name} · {d.stock} ready
          </span>
          <input
            type="checkbox"
            aria-label={`List ${d.name}`}
            checked={!g.listed || g.listed.includes(d.id)}
            onChange={() =>
              useGame.getState().dispatch({ type: "listing", id: d.id })
            }
          />
        </label>
      ))}
      <p className="muted">
        Only listed products with finished stock can receive orders. Closing the
        store pauses new orders; existing orders continue.
      </p>
    </>
  );
}
export function InboxApp() {
  const g = useGame((s) => s.game)!;
  return (
    <>
      <div className="app-intro">
        <small>FICTIONAL BUSINESS INBOX</small>
        <h2>Your company, connected.</h2>
      </div>
      <article className="order">
        <small>SUMMIT BUSINESS SERVICES</small>
        <h3>Welcome, {g.brand}.</h3>
        <p>
          Design on the computer, manufacture at your bench and dispatch from
          your packing station. This inbox contains game messages only.
        </p>
      </article>
      {g.deliveries?.map((d) => (
        <article className="order" key={d.id}>
          <small>{industryOf(g).supplier}</small>
          <h3>Delivery #{d.id}</h3>
          <p>
            {d.quantity} units ·{" "}
            {d.arrives > g.time
              ? "in transit"
              : "ready to receive at your front door"}
            .
          </p>
        </article>
      ))}
      {[...g.orders]
        .reverse()
        .slice(0, 20)
        .map((o) => (
          <article className="order" key={o.id}>
            <small>
              {o.customer} · order #{o.id}
            </small>
            <h3>
              {o.status === "delivered"
                ? "Your order arrived. Thank you!"
                : "Order update"}
            </h3>
            <p>
              {g.designs.find((d) => d.id === o.designId)?.name} · {o.status} ·{" "}
              {money(o.price)}
            </p>
          </article>
        ))}
    </>
  );
}
