import { Wardrobe } from "./Wardrobe";
import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import {
  ArrowUpRight,
  Check,
  Package,
  Plus,
  ShoppingBag,
  Truck,
  Play,
  Send,
  Download,
  Upload,
  Save,
  Volume2,
} from "lucide-react";
import { useGame } from "../game/store";
import { Garment } from "../world/Garment";
import { ECONOMY as E, FITS, money, UPGRADES } from "../game/catalog";
import {
  completed,
  revenue,
  expenses,
  capacity,
  occupied,
  type Design,
} from "../game/simulation";
import { loadGame, listSaves, validateSave } from "../game/save";
export const PANEL_TITLES: Record<string, [string, string]> = {
  wardrobe: ["YOUR OWN LABEL", "Wardrobe & home"],
  design: ["01 / CREATIVE", "Design studio"],
  production: ["02 / MAKE", "Production"],
  social: ["03 / CONNECT", "SocialHub"],
  orders: ["04 / FULFIL", "Online orders"],
  inventory: ["YOUR SUPPLY CHAIN", "Materials & inventory"],
  finances: ["THE NUMBERS", "Business account"],
  upgrades: ["INVEST IN YOURSELF", "Workspace"],
  settings: ["MAKE YOURSELF AT HOME", "Settings"],
  saves: ["LOCAL TO THIS BROWSER", "Save journal"],
};
export function DesignPanel() {
  const g = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const [d, setD] = useState<Omit<Design, "id" | "stock">>({
    name: "Studio tee 01",
    color: "#e6e1ce",
    ink: "#283d32",
    text: g.brand,
    fit: "Oversized",
    graphic: "orbit",
    price: 3900,
  });
  const [saved, setSaved] = useState(false);
  const update = (v: Partial<typeof d>) => {
    setD({ ...d, ...v });
    setSaved(false);
  };
  return (
    <>
      <div className="garment-preview">
        <span className="preview-label">LIVE SAMPLE / DRAG TO ROTATE</span>
        <Canvas camera={{ position: [0, 0.2, 3.4], fov: 42 }} dpr={[1, 1.5]}>
          <color attach="background" args={["#deded3"]} />
          <ambientLight intensity={2} />
          <directionalLight position={[3, 5, 4]} intensity={3} />
          <Suspense fallback={null}>
            <Garment design={d} />
          </Suspense>
          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.25}
            scale={5}
            blur={2}
            far={3}
          />
          <OrbitControls enablePan={false} minDistance={2} maxDistance={5} />
        </Canvas>
        <span className="preview-caption">100% cotton · heat transfer</span>
      </div>
      <div className="fields">
        <label>
          Product name
          <input
            maxLength={40}
            value={d.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </label>
        <div className="two-col">
          <label>
            Silhouette
            <select
              value={d.fit}
              onChange={(e) => update({ fit: e.target.value as Design["fit"] })}
            >
              {FITS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label>
            Retail price ($)
            <input
              type="number"
              min="1"
              max="500"
              step="1"
              value={d.price / 100}
              onChange={(e) =>
                update({ price: Math.round(Number(e.target.value) * 100) })
              }
            />
          </label>
        </div>
        <div className="two-col">
          <label>
            Fabric colour
            <input
              aria-label="Fabric colour"
              type="color"
              value={d.color}
              onChange={(e) => update({ color: e.target.value })}
            />
          </label>
          <label>
            Print colour
            <input
              aria-label="Print colour"
              type="color"
              value={d.ink}
              onChange={(e) => update({ ink: e.target.value })}
            />
          </label>
        </div>
        <label>
          Graphic style
          <select
            value={d.graphic}
            onChange={(e) =>
              update({ graphic: e.target.value as Design["graphic"] })
            }
          >
            <option value="orbit">Orbital mark + typography</option>
            <option value="type">Typography</option>
            <option value="none">Blank / no graphic</option>
          </select>
        </label>
        <label>
          Print text
          <input
            maxLength={24}
            value={d.text}
            onChange={(e) => update({ text: e.target.value })}
          />
        </label>
      </div>
      <div className="cost-note">
        <span>Direct cost / shirt</span>
        <strong>{money(E.blank + E.ink + E.packaging + E.shipping)}</strong>
      </div>
      <p className="muted">
        Includes blank, printing, mailer and postage. Your own labour is unpaid
        in the bedroom stage. High prices reduce demand.
      </p>
      <button
        className="primary full"
        onClick={() => {
          if (dispatch({ type: "design", design: d })) setSaved(true);
        }}
      >
        {saved ? <Check size={16} /> : <Plus size={16} />}{" "}
        {saved ? "Sample saved — ready to produce" : "Save as new product"}
      </button>
      {g.designs.length > 0 && (
        <>
          <h3>
            YOUR CATALOGUE <span>{g.designs.length}</span>
          </h3>
          {g.designs.map((p) => (
            <div className="row" key={p.id}>
              <div className="color-chip" style={{ background: p.color }} />
              <div className="grow">
                <strong>{p.name}</strong>
                <small>
                  {p.fit} · {p.stock} ready
                </small>
              </div>
              <input
                className="price-input"
                aria-label={`Price for ${p.name}`}
                type="number"
                min="1"
                max="500"
                defaultValue={p.price / 100}
                onBlur={(e) =>
                  dispatch({
                    type: "price",
                    id: p.id,
                    price: Math.round(Number(e.target.value) * 100),
                  })
                }
              />
            </div>
          ))}
        </>
      )}
    </>
  );
}
export function ProductionPanel() {
  const g = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const job = g.jobs[0];
  return (
    <>
      <div className="feature-card">
        <div className="eyebrow">YOUR FIRST PRODUCTION LINE</div>
        <h2>
          Made here.
          <br />
          Made by you.
        </h2>
        <p>One heat press. A little patience. Something worth wearing.</p>
        <div className={`machine-status ${job ? "active" : ""}`}>
          <i />
          {job
            ? `Printing · ${Math.max(0, job.end - g.time)} seconds remaining`
            : "Heat press ready"}
        </div>
      </div>
      <div className="stats-pair">
        <div>
          <b>{g.blanks}</b>
          <small>blank shirts</small>
        </div>
        <div>
          <b>{g.designs.reduce((n, d) => n + d.stock, 0)}</b>
          <small>finished pieces</small>
        </div>
      </div>
      <h3>PRODUCTION CATALOGUE</h3>
      {g.designs.length ? (
        g.designs.map((d) => (
          <div className="product-row" key={d.id}>
            <div className="color-chip" style={{ background: d.color }} />
            <div className="grow">
              <strong>{d.name}</strong>
              <small>
                {money(E.ink)} ink ·{" "}
                {g.upgrades.includes("press") ? 7 : E.productionSeconds}s · 1
                blank
              </small>
            </div>
            <button
              className="secondary"
              disabled={!!job || !g.blanks}
              onClick={() => dispatch({ type: "produce", id: d.id })}
            >
              <Play size={13} />
              Print
            </button>
          </div>
        ))
      ) : (
        <Empty
          text="Every great label starts with a design."
          action="Open Design Studio"
          panel="design"
        />
      )}
      <p className="muted">
        Blanks and ink are consumed when a job starts. Finished pieces appear
        only after the press completes its cycle.
      </p>
      <button
        className="text-button"
        onClick={() => useGame.getState().open("inventory")}
      >
        Order more materials <ArrowUpRight size={14} />
      </button>
    </>
  );
}
export function SocialPanel() {
  const g = useGame((s) => s.game)!;
  const [caption, setCaption] = useState(
    "Our first release. Made in a bedroom, worn everywhere. #independent",
  );
  const cooldown = Math.max(0, E.postCooldown - g.time + g.lastPost);
  return (
    <>
      <div className="social-profile">
        <div className="avatar" style={{ background: g.accent }}>
          {g.brand.slice(0, 2)}
        </div>
        <div>
          <h2>{g.brand}</h2>
          <small>@{g.brand.toLowerCase().replace(/[^a-z0-9]/g, "")}</small>
        </div>
      </div>
      <div className="stats-pair">
        <div>
          <b>{g.followers}</b>
          <small>followers</small>
        </div>
        <div>
          <b>{g.posts.reduce((v, p) => v + p.views, 0)}</b>
          <small>total views</small>
        </div>
      </div>
      <h3>GIVE YOUR WORK A VOICE</h3>
      <textarea
        aria-label="Post caption"
        maxLength={160}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <div className="cost-note">
        <span>Discovery promotion</span>
        <b>{money(E.postCost)}</b>
      </div>
      <button
        className="primary full"
        disabled={cooldown > 0}
        onClick={() => useGame.getState().dispatch({ type: "post", caption })}
      >
        <Send size={15} />
        {cooldown ? `Next post in ${cooldown}s` : "Publish product reveal"}
      </button>
      <p className="muted">
        A small promotion introduces your available products to potential
        customers. Orders arrive over time when the price fits their budget. No
        stock, no sales.
      </p>
      <h3>RECENT POSTS</h3>
      {g.posts.length ? (
        g.posts.map((p) => (
          <article className="post" key={p.id}>
            <small>
              {g.brand} · day {Math.floor(p.time / 240) + 1}
            </small>
            <p>{p.caption}</p>
            <footer>
              {p.views} views <span>♡ {p.likes} likes</span>
            </footer>
          </article>
        ))
      ) : (
        <p className="muted">Your story is still unwritten.</p>
      )}
    </>
  );
}
export function OrdersPanel() {
  const g = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const active = g.orders.filter((o) => o.status !== "delivered");
  return (
    <>
      <div className="stats-pair">
        <div>
          <b>{active.length}</b>
          <small>to fulfil</small>
        </div>
        <div>
          <b>{completed(g)}</b>
          <small>delivered</small>
        </div>
      </div>
      <p className="muted">
        Ordered stock is reserved. Pack each order using one mailer, then pay{" "}
        {money(E.shipping)} postage. Payment arrives on delivery.
      </p>
      {g.orders.length ? (
        [...g.orders].reverse().map((o) => (
          <article className="order" key={o.id}>
            <div className="row">
              <strong>
                #{o.id.padStart(4, "0")} · {o.customer}
              </strong>
              <b>{money(o.price)}</b>
            </div>
            <small>{g.designs.find((d) => d.id === o.designId)?.name}</small>
            <div className="order-footer">
              <span
                className={`badge ${o.status === "delivered" ? "success" : ""}`}
              >
                {o.status === "shipping"
                  ? `In transit · ${Math.max(0, o.arrives! - g.time)}s`
                  : o.status}
              </span>
              {o.status === "ordered" && (
                <button
                  className="secondary"
                  onClick={() => dispatch({ type: "pack", id: o.id })}
                >
                  <Package size={14} />
                  Pack order
                </button>
              )}
              {o.status === "packed" && (
                <button
                  className="primary"
                  onClick={() => dispatch({ type: "ship", id: o.id })}
                >
                  <Truck size={14} />
                  Ship · $5
                </button>
              )}
              {o.status === "delivered" && <Check size={16} />}
            </div>
          </article>
        ))
      ) : (
        <Empty
          text="Your first order is out there."
          action="Promote a product"
          panel="social"
        />
      )}
    </>
  );
}
export function InventoryPanel() {
  const g = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  return (
    <>
      <div className="feature-card supplier">
        <div className="eyebrow">COMMON THREAD SUPPLY CO.</div>
        <h2>
          The good stuff
          <br />
          starts here.
        </h2>
        <p>
          Local blanks. Reliable basics. Instant supplier collection for this
          first slice.
        </p>
      </div>
      <h3>SUPPLIES</h3>
      {(
        [
          {
            id: "blanks",
            name: "Cotton blanks",
            cost: E.blank,
            count: g.blanks,
            desc: "Midweight cotton · unprinted",
          },
          {
            id: "packaging",
            name: "Recycled mailers",
            cost: E.packaging,
            count: g.packaging,
            desc: "One per order · protective sleeve",
          },
        ] as const
      ).map((i) => (
        <div className="supply" key={i.id}>
          <div className="row">
            <div>
              <strong>{i.name}</strong>
              <small>{i.desc}</small>
            </div>
            <b>
              {i.count}
              <small>on hand</small>
            </b>
          </div>
          <div className="row">
            <span>{money(i.cost)} / unit</span>
            <button
              className="secondary"
              onClick={() => dispatch({ type: "buy", item: i.id, quantity: 1 })}
            >
              Buy 1
            </button>
            <button
              className="primary"
              onClick={() => dispatch({ type: "buy", item: i.id, quantity: 5 })}
            >
              Buy 5 · {money(i.cost * 5)}
            </button>
          </div>
        </div>
      ))}
      <h3>
        GARMENT STORAGE{" "}
        <span>
          {occupied(g)} / {capacity(g)}
        </span>
      </h3>
      <div className="progress">
        <i style={{ width: `${(occupied(g) / capacity(g)) * 100}%` }} />
      </div>
      <p className="muted">
        Includes blanks, work in progress, finished shirts and orders awaiting
        shipment.
      </p>
      {g.designs.map((d) => (
        <div className="row" key={d.id}>
          <span>{d.name}</span>
          <strong>{d.stock} available</strong>
        </div>
      ))}
    </>
  );
}
export function FinancePanel() {
  const g = useGame((s) => s.game)!;
  const rev = revenue(g),
    exp = expenses(g);
  return (
    <>
      <div className="bank-card">
        <span>BUSINESS ACCOUNT · 0001</span>
        <h2>{money(g.cash)}</h2>
        <small>Available balance</small>
        <footer>
          {g.brand}
          <ArrowUpRight size={22} />
        </footer>
      </div>
      <div className="stats-pair">
        <div>
          <b>{money(rev)}</b>
          <small>revenue</small>
        </div>
        <div>
          <b className={rev - exp < 0 ? "negative" : ""}>{money(rev - exp)}</b>
          <small>net cash result</small>
        </div>
      </div>
      <div className="cost-note">
        <span>Total cash expenses</span>
        <strong>{money(exp)}</strong>
      </div>
      <p className="muted">
        Cash basis report. The initial $500 and starter supplies are a founder
        contribution, not sales. Net cash result expenses materials when
        purchased; inventory asset accounting and taxes come in later phases.
      </p>
      <h3>TRANSACTION LEDGER</h3>
      {g.ledger.length ? (
        [...g.ledger].reverse().map((e) => (
          <div className="ledger-row" key={e.id}>
            <div>
              <strong>{e.label}</strong>
              <small>
                Day {Math.floor(e.time / 240) + 1} ·{" "}
                {Math.floor((e.time % 240) / 15) + 8}:00
              </small>
            </div>
            <b className={e.amount > 0 ? "positive" : ""}>
              {e.amount > 0 ? "+" : ""}
              {money(e.amount)}
            </b>
          </div>
        ))
      ) : (
        <p className="muted">No transactions yet. Make your first piece.</p>
      )}
    </>
  );
}
export function UpgradePanel() {
  const g = useGame((s) => s.game)!;
  const [wall, setWall] = useState(g.wall);
  return (
    <>
      <div className="feature-card">
        <div className="eyebrow">BEDROOM / 01</div>
        <h2>
          Small space.
          <br />
          Big ambitions.
        </h2>
        <p>Choose improvements that do more than look good.</p>
      </div>
      <h3>WORKSPACE IMPROVEMENTS</h3>
      {UPGRADES.map((u) => {
        const owned = g.upgrades.includes(u.id),
          locked = completed(g) < u.orders;
        return (
          <article className="upgrade" key={u.id}>
            <div className="row">
              <strong>{u.name}</strong>
              <b>{money(u.cost)}</b>
            </div>
            <p>{u.description}</p>
            <button
              className={owned ? "secondary full" : "primary full"}
              disabled={owned || locked}
              onClick={() =>
                useGame.getState().dispatch({ type: "upgrade", id: u.id })
              }
            >
              {owned ? (
                <>
                  <Check size={15} />
                  Installed
                </>
              ) : locked ? (
                `${u.orders} delivered orders required`
              ) : (
                "Purchase & install"
              )}
            </button>
          </article>
        );
      })}
      <h3>MAKE IT YOURS</h3>
      <label className="row">
        Studio wall colour
        <input
          type="color"
          aria-label="Wall colour"
          value={wall}
          onChange={(e) => {
            setWall(e.target.value);
            useGame
              .getState()
              .dispatch({ type: "wall", color: e.target.value });
          }}
        />
      </label>
      <h3>
        ACHIEVEMENTS <span>{g.achievements.length}</span>
      </h3>
      {g.achievements.length ? (
        g.achievements.map((a) => (
          <div className="achievement" key={a}>
            <Check size={15} />
            {a}
          </div>
        ))
      ) : (
        <p className="muted">Your first design is your first milestone.</p>
      )}
    </>
  );
}
export function SettingsPanel() {
  const s = useGame((s) => s.settings);
  const g = useGame((s) => s.game)!;
  const configure = useGame((s) => s.configure);
  const [brand, setBrand] = useState(g.brand),
    [slogan, setSlogan] = useState(g.slogan);
  return (
    <>
      <p className="muted">The simulation pauses while settings are open.</p>
      <h3>DISPLAY & CONTROLS</h3>
      <label>
        Rendering quality
        <select
          value={s.quality}
          onChange={(e) =>
            configure({ quality: e.target.value as typeof s.quality })
          }
        >
          <option value="low">Low · 1× resolution, no shadows</option>
          <option value="high">High · adaptive resolution, shadows</option>
        </select>
      </label>
      <label>
        Trackpad / orbit sensitivity{" "}
        <input
          type="range"
          min=".25"
          max="2"
          step=".05"
          value={s.sensitivity}
          onChange={(e) => configure({ sensitivity: Number(e.target.value) })}
        />
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={s.invert}
          onChange={(e) => configure({ invert: e.target.checked })}
        />
        Invert orbit direction
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={s.firstPerson}
          onChange={(e) => configure({ firstPerson: e.target.checked })}
        />
        First-person preview (fixed forward view)
      </label>
      <label>
        <Volume2 size={14} /> UI sound volume
        <input
          type="range"
          min="0"
          max=".5"
          step=".01"
          value={s.volume}
          onChange={(e) => configure({ volume: Number(e.target.value) })}
        />
      </label>
      <h3>BRAND IDENTITY</h3>
      <label>
        Company name
        <input
          maxLength={28}
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
      </label>
      <label>
        Slogan
        <input
          maxLength={70}
          value={slogan}
          onChange={(e) => setSlogan(e.target.value)}
        />
      </label>
      <button
        className="secondary full"
        onClick={() => {
          if (useGame.getState().dispatch({ type: "identity", brand, slogan }))
            useGame.getState().notify("Brand identity updated.");
        }}
      >
        Update identity
      </button>
      <button
        className="secondary full"
        onClick={() => useGame.getState().open("wardrobe")}
      >
        Open wardrobe & home controls
      </button>
      <h3>KEYBOARD</h3>
      <div className="controls-list">
        W A S D <span>Move</span>
        <br />
        Shift <span>Sprint</span>
        <br />
        Space <span>Jump</span>
        <br />
        Drag / scroll <span>Orbit / zoom</span>
        <br />E <span>Use nearby workstation</span>
        <br />
        Tab <span>Phone / SocialHub</span>
        <br />I / B / M <span>Inventory / workspace / room guide</span>
        <br />
        Esc <span>Close screen / pause</span>
      </div>
      <button
        className="text-button"
        onClick={() => useGame.getState().open("saves")}
      >
        Manage saves <ArrowUpRight size={14} />
      </button>
    </>
  );
}
export function SavesPanel() {
  const g = useGame((s) => s.game)!;
  const [saves, setSaves] = useState<Awaited<ReturnType<typeof listSaves>>>([]);
  useEffect(() => {
    listSaves()
      .then(setSaves)
      .catch((e) => useGame.getState().notify(String(e)));
  }, []);
  const refresh = () => listSaves().then(setSaves);
  return (
    <>
      <p className="muted">
        Progress is stored in this browser using IndexedDB. Export a backup
        before clearing browser data. Loading replaces the current session.
      </p>
      {["autosave", "slot-1", "slot-2", "slot-3"].map((slot) => {
        const s = saves.find((s) => s.slot === slot);
        return (
          <div className="save-slot" key={slot}>
            <strong>
              {slot === "autosave" ? "Autosave" : slot.replace("-", " ")}
            </strong>
            <small>
              {s
                ? `${s.game.brand} · ${money(s.game.cash)} · ${new Date(s.savedAt).toLocaleString()}`
                : "Empty slot"}
            </small>
            <div className="row">
              <button
                className="secondary"
                onClick={async () => {
                  await useGame.getState().save(slot);
                  await refresh();
                }}
              >
                <Save size={14} />
                Save here
              </button>
              <button
                className="primary"
                disabled={!s}
                onClick={async () => {
                  try {
                    const save = await loadGame(slot);
                    if (save) {
                      useGame.getState().setGame(save.game);
                      useGame.getState().notify("Save loaded.");
                    }
                  } catch (e) {
                    useGame.getState().notify((e as Error).message);
                  }
                }}
              >
                Load
              </button>
            </div>
          </div>
        );
      })}
      <div className="two-col">
        <button
          className="secondary"
          onClick={() => {
            const a = document.createElement("a");
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(g)], { type: "application/json" }),
            );
            a.href = url;
            a.download = "streetwear-empire-save.json";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          <Download size={15} />
          Export save
        </button>
        <label className="secondary file-button">
          <Upload size={15} />
          Import save
          <input
            type="file"
            accept=".json"
            onChange={async (e) => {
              try {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5_000_000)
                  throw new Error("Save file exceeds 5 MB.");
                const game = validateSave(JSON.parse(await file.text()));
                useGame.getState().setGame(game);
                if (!(await useGame.getState().save()))
                  throw new Error("Imported save could not be persisted.");
                useGame.getState().notify("Save imported.");
              } catch (err) {
                useGame.getState().notify((err as Error).message);
              }
            }}
          />
        </label>
      </div>
    </>
  );
}
function Empty({
  text,
  action,
  panel,
}: {
  text: string;
  action: string;
  panel: string;
}) {
  return (
    <div className="empty">
      <ShoppingBag size={28} />
      <p>{text}</p>
      <button
        className="secondary"
        onClick={() => useGame.getState().open(panel)}
      >
        {action}
        <ArrowUpRight size={14} />
      </button>
    </div>
  );
}
export function PanelContent({ panel }: { panel: string }) {
  switch (panel) {
    case "wardrobe":
      return <Wardrobe />;
    case "design":
      return <DesignPanel />;
    case "production":
      return <ProductionPanel />;
    case "social":
      return <SocialPanel />;
    case "orders":
      return <OrdersPanel />;
    case "inventory":
      return <InventoryPanel />;
    case "finances":
      return <FinancePanel />;
    case "upgrades":
      return <UpgradePanel />;
    case "settings":
      return <SettingsPanel />;
    case "saves":
      return <SavesPanel />;
    default:
      return null;
  }
}
