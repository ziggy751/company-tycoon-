import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useGame } from "../game/store";
import {
  industryOf,
  productOf,
  supplierUnitCost,
  PRODUCTS,
  type ProductKind,
} from "../game/industries";
import { money } from "../game/catalog";
import type { Design, Action } from "../game/simulation";
import { capacity, occupied } from "../game/simulation";
import { ProductModel } from "../world/ProductModel";
export function IndustryDesigner({
  initialKind,
  active = true,
}: {
  initialKind?: ProductKind;
  active?: boolean;
}) {
  const g = useGame((s) => s.game)!;
  const industry = industryOf(g);
  const [d, setD] = useState<Omit<Design, "id" | "stock">>({
    kind: initialKind || industry.products[0],
    name: PRODUCTS[initialKind || industry.products[0]].name,
    color: industry.id === "mtb" ? "#506e73" : "#b28b72",
    ink: "#2e3f39",
    text: g.brand,
    fit: "Regular",
    graphic: "type",
    price: PRODUCTS[initialKind || industry.products[0]].price,
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
        <Canvas
          frameloop={active ? "demand" : "never"}
          camera={{ position: [0, 0.2, 3.6], fov: 42 }}
          dpr={1}
        >
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
        Collection
        <input
          maxLength={32}
          value={d.collection || ""}
          placeholder="e.g. Studio essentials"
          onChange={(e) => set({ collection: e.target.value })}
        />
      </label>
      <div className="two-col">
        <label>
          Release season
          <select
            value={d.season || "All year"}
            onChange={(e) =>
              set({ season: e.target.value as Design["season"] })
            }
          >
            {["All year", "Spring", "Summer", "Autumn", "Winter"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Finish
          <select
            value={d.finish || "standard"}
            onChange={(e) =>
              set({ finish: e.target.value as Design["finish"] })
            }
          >
            <option value="standard">Standard</option>
            <option value="premium">Premium · +25% material cost, +8s</option>
          </select>
        </label>
      </div>
      {industry.id === "streetwear" &&
        ["shirt", "longsleeve", "hoodie", "crewneck"].includes(
          d.kind || "shirt",
        ) && (
          <>
            <label>
              Fit
              <select
                value={d.fit}
                onChange={(e) => set({ fit: e.target.value as Design["fit"] })}
              >
                {["Regular", "Oversized", "Boxy"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Graphic
              <select
                value={d.graphic}
                onChange={(e) =>
                  set({ graphic: e.target.value as Design["graphic"] })
                }
              >
                <option value="type">Typography</option>
                <option value="orbit">Orbital mark</option>
                <option value="none">No graphic</option>
              </select>
            </label>
          </>
        )}
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
        {productOf(d).material}. Supplier unit cost {money(supplierUnitCost(d))}
        .{" "}
        {industry.id === "mtb"
          ? "A $15 prototype is required for each new design."
          : industry.id === "haircare"
            ? "Apply one paper label and $1.50 presentation per sourced item."
            : "Tees use your press; other clothing is professionally sewn, then received and inspected."}{" "}
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
