import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useGame } from "../game/store";
import {
  industryOf,
  productOf,
  PRODUCTS,
  type ProductKind,
} from "../game/industries";
import { money } from "../game/catalog";
import type { Design, Action } from "../game/simulation";
import { capacity, occupied } from "../game/simulation";
import { ProductModel } from "../world/ProductModel";
export function IndustryDesigner() {
  const g = useGame((s) => s.game)!;
  const industry = industryOf(g);
  const [d, setD] = useState<Omit<Design, "id" | "stock">>({
    kind: industry.products[0],
    name: PRODUCTS[industry.products[0]].name,
    color: industry.id === "mtb" ? "#506e73" : "#b28b72",
    ink: "#2e3f39",
    text: g.brand,
    fit: "Regular",
    graphic: "type",
    price: PRODUCTS[industry.products[0]].price,
  });
  const [saved, setSaved] = useState(false);
  const set = (value: Partial<typeof d>) => {
    setD({ ...d, ...value });
    setSaved(false);
  };
  return (
    <>
      <div className="garment-preview">
        <span className="preview-label">ACTUAL PRODUCT / DRAG TO ROTATE</span>
        <Canvas camera={{ position: [0, 0.2, 3.6], fov: 42 }} dpr={1}>
          <color attach="background" args={["#deded3"]} />
          <ambientLight intensity={1.8} />
          <directionalLight position={[3, 4, 5]} intensity={3} />
          <Suspense fallback={null}>
            <ProductModel design={d} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableDamping
            minDistance={2}
            maxDistance={5}
            mouseButtons={{ LEFT: 0, RIGHT: 0 }}
          />
        </Canvas>
      </div>
      <label>
        Product family
        <select
          value={d.kind}
          onChange={(e) => {
            const kind = e.target.value as ProductKind;
            set({
              kind,
              name: PRODUCTS[kind].name,
              price: PRODUCTS[kind].price,
            });
          }}
        >
          {industry.products.map((kind) => (
            <option key={kind} value={kind}>
              {PRODUCTS[kind].name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Product name
        <input
          maxLength={40}
          value={d.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </label>
      <div className="two-col">
        <label>
          Product colour
          <input
            type="color"
            value={d.color}
            onChange={(e) => set({ color: e.target.value })}
          />
        </label>
        <label>
          Label ink
          <input
            type="color"
            value={d.ink}
            onChange={(e) => set({ ink: e.target.value })}
          />
        </label>
      </div>
      <label>
        Brand / label text
        <input
          maxLength={24}
          value={d.text}
          onChange={(e) => set({ text: e.target.value })}
        />
      </label>
      <label>
        Retail price ($)
        <input
          type="number"
          min="1"
          max="500"
          value={d.price / 100}
          onChange={(e) =>
            set({ price: Math.round(Number(e.target.value) * 100) })
          }
        />
      </label>
      <p className="muted">
        {productOf(d).material}. Supplier unit cost{" "}
        {money(productOf(d).unitCost)}.{" "}
        {industry.id === "mtb"
          ? "A $15 prototype is required for each new design."
          : "Apply one paper label and $1.50 presentation per sourced item."}{" "}
        Packaging and shipping cost $7 per order.
      </p>
      <button
        className="primary full"
        onClick={() => {
          if (useGame.getState().dispatch({ type: "design", design: d }))
            setSaved(true);
        }}
      >
        {saved ? "Product saved" : "Save product design"}
      </button>
      <h3>YOUR PRODUCTS</h3>
      {g.designs.map((p) => (
        <div className="row" key={p.id}>
          <div>
            <strong>{p.name}</strong>
            <small>
              {p.stock} ready · {p.rawStock || 0} awaiting preparation
            </small>
          </div>
          <input
            className="price-input"
            type="number"
            aria-label={`Price for ${p.name}`}
            defaultValue={p.price / 100}
            onBlur={(e) =>
              useGame.getState().dispatch({
                type: "price",
                id: p.id,
                price: Math.round(Number(e.target.value) * 100),
              })
            }
          />
        </div>
      ))}
    </>
  );
}
export function IndustryProduction() {
  const g = useGame((s) => s.game)!,
    industry = industryOf(g),
    job = g.jobs[0],
    dispatch = useGame((s) => s.dispatch);
  const button = (
    type: "prototype" | "contract" | "inspect" | "label",
    id: string,
    text: string,
    disabled = false,
  ) => (
    <button
      className="secondary full"
      disabled={!!job || disabled}
      onClick={() => dispatch({ type, id })}
    >
      {text}
    </button>
  );
  return (
    <>
      <div className="feature-card">
        <span className="eyebrow">{industry.equipment.toUpperCase()}</span>
        <h2>
          {industry.id === "mtb"
            ? "Test. Source. Inspect."
            : "Source. Brand. Prepare."}
        </h2>
        <p>{industry.workflow}</p>
        <div className="machine-status">
          <i />
          {job
            ? `${job.kind} · ${job.end - g.time}s remaining`
            : "Workstation ready"}
        </div>
      </div>
      <p className="muted">
        {industry.id === "mtb"
          ? "Prototypes consume paid setup materials. Your specialist supplier makes the batch; incoming pieces cannot be sold until you inspect them."
          : "Source finished combs and clips from a specialist manufacturer. Your home workstation applies labels; it does not formulate cosmetics."}
      </p>
      {g.designs.length === 0 && (
        <button
          className="primary full"
          onClick={() => useGame.getState().open("design")}
        >
          Create a product first
        </button>
      )}
      {g.designs.map((d) => (
        <article className="upgrade" key={d.id}>
          <strong>{d.name}</strong>
          <p>
            {d.stock} finished · {d.rawStock || 0}{" "}
            {industry.id === "mtb" ? "uninspected" : "unlabelled"}
          </p>
          {industry.id === "mtb" &&
            !d.prototypeApproved &&
            button("prototype", d.id, "Make & approve prototype · $15")}
          {(industry.id === "haircare" || d.prototypeApproved) &&
            button(
              "contract",
              d.id,
              `${industry.id === "mtb" ? "Contract" : "Source"} ${g.property === "garage" ? 6 : 3} pieces · ${money(productOf(d).unitCost * (g.property === "garage" ? 6 : 3))}`,
            )}
          {industry.id === "mtb" &&
            button("inspect", d.id, "Inspect incoming batch", !d.rawStock)}
          {industry.id === "haircare" &&
            button(
              "label",
              d.id,
              "Label one accessory · $1.50",
              !d.rawStock || !g.labels,
            )}
        </article>
      ))}
      <div className="cost-note">
        <span>{industry.supplier}</span>
        <b>
          {occupied(g)}/{capacity(g)} stored
        </b>
      </div>
      <button
        className="text-button"
        onClick={() => useGame.getState().open("inventory")}
      >
        Packaging & supplies →
      </button>
    </>
  );
}
export function IndustryInventory() {
  const g = useGame((s) => s.game)!,
    i = industryOf(g),
    dispatch = useGame((s) => s.dispatch);
  return (
    <>
      <div className="feature-card">
        <span className="eyebrow">{i.supplier}</span>
        <h2>A reliable supply chain.</h2>
        <p>
          Order product-specific batches from Production. Supplies below are
          purchased separately.
        </p>
      </div>
      <h3>FULFILMENT SUPPLIES</h3>
      {[
        {
          item: "packaging" as const,
          name: "Protective mailers",
          count: g.packaging,
          cost: 200,
        },
        ...(i.id === "haircare"
          ? [
              {
                item: "labels" as const,
                name: "Paper product labels",
                count: g.labels || 0,
                cost: 50,
              },
            ]
          : []),
      ].map((p) => (
        <article className="supply" key={p.item}>
          <div className="row">
            <strong>{p.name}</strong>
            <b>{p.count} on hand</b>
          </div>
          <button
            className="primary full"
            onClick={() => dispatch({ type: "buy", item: p.item, quantity: 5 })}
          >
            Buy 5 · {money(p.cost * 5)}
          </button>
        </article>
      ))}
      <h3>
        ALL PRODUCT STOCK{" "}
        <span>
          {occupied(g)}/{capacity(g)}
        </span>
      </h3>
      {g.designs.map((d) => (
        <div className="row" key={d.id}>
          <strong>{d.name}</strong>
          <span>
            {d.rawStock || 0} incoming · {d.stock} ready
          </span>
        </div>
      ))}
    </>
  );
}
