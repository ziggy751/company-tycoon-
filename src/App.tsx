import { Companies } from "./ui/Companies";
import { useEffect, useState, Component, type ReactNode } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Shirt,
  Hammer,
  Smartphone,
  Package,
  Boxes,
  ChartNoAxesCombined,
  Armchair,
  Settings,
  X,
  Pause,
  Play,
  ChevronsRight,
  Save,
  Leaf,
  MapPin,
} from "lucide-react";
import { World } from "./world/World";
import { useGame } from "./game/store";
import { newGame, objective, completed, revenue } from "./game/simulation";
import { loadGame } from "./game/save";
import { AESTHETICS, money } from "./game/catalog";
import { PanelContent, PANEL_TITLES } from "./ui/Panels";
const NAV = [
  { id: "design", icon: Shirt, label: "Design" },
  { id: "production", icon: Hammer, label: "Produce" },
  { id: "social", icon: Smartphone, label: "SocialHub" },
  { id: "orders", icon: Package, label: "Orders" },
  { id: "inventory", icon: Boxes, label: "Supplies" },
  { id: "finances", icon: ChartNoAxesCombined, label: "Finances" },
  { id: "upgrades", icon: Armchair, label: "Workspace" },
];
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="world-fallback">
        3D could not start. Enable WebGL in your browser. Business tools remain
        available.
      </div>
    ) : (
      this.props.children
    );
  }
}
let audio: AudioContext | undefined;
function sound() {
  const v = useGame.getState().settings.volume;
  if (!v) return;
  try {
    audio ??= new AudioContext();
    const o = audio.createOscillator(),
      a = audio.createGain();
    o.connect(a);
    a.connect(audio.destination);
    o.frequency.setValueAtTime(420, audio.currentTime);
    a.gain.setValueAtTime(v * 0.06, audio.currentTime);
    a.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.04);
    o.start();
    o.stop(audio.currentTime + 0.05);
  } catch {
    /* Optional browser audio. */
  }
}
export default function App() {
  const [screen, setScreen] = useState<"menu" | "create" | "game">("menu");
  const [companies, setCompanies] = useState(false);
  const [available, setAvailable] = useState(false),
    [credits, setCredits] = useState(false),
    [guide, setGuide] = useState(false);
  const [brand, setBrand] = useState("AFTERHOURS"),
    [slogan, setSlogan] = useState("Independent by design."),
    [accent, setAccent] = useState("#d9ed91"),
    [aesthetic, setAesthetic] = useState("Underground"),
    [founder, setFounder] = useState("#a77c62");
  const g = useGame((s) => s.game),
    panel = useGame((s) => s.panel),
    notice = useGame((s) => s.notice),
    status = useGame((s) => s.saveStatus),
    paused = useGame((s) => s.paused),
    speed = useGame((s) => s.speed),
    open = useGame((s) => s.open);
  useEffect(() => {
    useGame.getState().setGame(newGame());
    loadGame("autosave")
      .then((s) => setAvailable(!!s))
      .catch((e) => useGame.getState().notify(e.message));
    try {
      const s = localStorage.getItem("streetwear-settings");
      if (s) {
        const p = JSON.parse(s);
        if (
          ["high", "low"].includes(p.quality) &&
          Number.isFinite(p.volume) &&
          Number.isFinite(p.sensitivity)
        )
          useGame.getState().configure(p);
      }
    } catch {
      useGame.getState().notify("Settings could not be restored.");
    }
    return useGame.subscribe((s, p) => {
      if (s.settings !== p.settings)
        try {
          localStorage.setItem(
            "streetwear-settings",
            JSON.stringify(s.settings),
          );
        } catch {
          s.notify("Settings could not be saved.");
        }
    });
  }, []);
  useEffect(() => {
    if (screen !== "game") return;
    const timer = setInterval(() => useGame.getState().step(), 1000);
    const hide = () => {
      if (document.hidden) {
        useGame.setState({ paused: true });
        void useGame.getState().save();
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [screen]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => useGame.getState().notify(""), 6500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        screen !== "game" ||
        (e.target as HTMLElement).closest("input,textarea,select")
      )
        return;
      const s = useGame.getState();
      if (e.code === "Escape") s.open(s.panel ? null : "settings");
      if (e.code === "Tab") {
        e.preventDefault();
        s.open(s.panel === "social" ? null : "social");
      }
      if (e.code === "KeyI")
        s.open(s.panel === "inventory" ? null : "inventory");
      if (e.code === "KeyB") s.open(s.panel === "upgrades" ? null : "upgrades");
      if (e.code === "KeyM") setGuide((x) => !x);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [screen]);
  const saveAndExit = async () => {
    useGame.setState({ paused: true });
    if (!(await useGame.getState().save())) return;
    setAvailable(true);
    open(null);
    setScreen("menu");
  };
  const resume = async () => {
    try {
      const s = await loadGame("autosave");
      if (s) {
        useGame.getState().setGame(s.game);
        setScreen("game");
      }
    } catch (e) {
      useGame.getState().notify((e as Error).message);
    }
  };
  if (!g)
    return (
      <div className="loading">
        COMPANY TYCOON<small>Opening the studio…</small>
      </div>
    );
  const mission = objective(g),
    pending = g.orders.filter(
      (o) => o.status === "ordered" || o.status === "packed",
    ).length;
  return (
    <div
      className={`app ${screen === "game" ? "playing" : "on-menu"} ${panel ? "panel-open" : ""}`}
      style={{ "--accent": g.accent } as React.CSSProperties}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) sound();
      }}
    >
      <Boundary>
        <World />
      </Boundary>
      <div className="world-vignette" />
      {screen === "menu" && (
        <div className="menu-screen">
          <header className="menu-header">
            <div className="wordmark">
              <span className="mark">se.</span> COMPANY TYCOON
            </div>
            <span className="edition">HOME & NEIGHBOURHOOD / V.02</span>
          </header>
          <main className="menu-main">
            <div className="eyebrow">
              <i /> AN INDEPENDENT BUSINESS SIMULATOR
            </div>
            <h1>
              Every empire
              <br />
              starts <em>somewhere.</em>
            </h1>
            <p>
              A bedroom. Five blank shirts. Five hundred dollars.
              <br />
              Build something that has your name on it.
            </p>
            <button
              className="primary menu-start"
              onClick={() => setScreen("create")}
            >
              Start your story <ArrowUpRight size={20} />
            </button>
            <div className="menu-links">
              <button disabled={!available} onClick={resume}>
                Continue <ArrowRight size={14} />
              </button>
              <button onClick={() => setCompanies(true)}>My Companies</button>
              <button
                onClick={async () => {
                  try {
                    const saved = await loadGame("autosave");
                    if (saved) useGame.getState().setGame(saved.game);
                    setScreen("game");
                    open("settings");
                  } catch (e) {
                    useGame.getState().notify((e as Error).message);
                  }
                }}
              >
                Settings
              </button>
              <button onClick={() => setCredits(true)}>Credits</button>
            </div>
          </main>
          <aside className="menu-location">
            <span className="location-line" />
            <small>YOUR FIRST HEADQUARTERS</small>
            <h3>
              One small room.
              <br />
              Unlimited potential.
            </h3>
            <span>Bedroom startup · Day one</span>
          </aside>
          <footer className="menu-footer">
            <span>
              <Leaf size={13} /> INDEPENDENT BY DESIGN.
            </span>
            <span>DESIGN. MAKE. CONNECT. GROW.</span>
            <span>LOCAL SAVES · NO ACCOUNT NEEDED</span>
          </footer>
        </div>
      )}
      {screen === "create" && (
        <div className="modal-shade">
          <form
            className="creation"
            onSubmit={(e) => {
              e.preventDefault();
              useGame
                .getState()
                .setGame(newGame(brand, slogan, accent, aesthetic, founder));
              void useGame.getState().save();
              setScreen("game");
            }}
          >
            <button
              type="button"
              className="close"
              aria-label="Back to main menu"
              onClick={() => setScreen("menu")}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">CHAPTER ONE / YOUR NAME ON THE LABEL</div>
            <h1>Begin independent.</h1>
            <p>A brand is a point of view. What’s yours?</p>
            {available && (
              <p className="warning">
                Existing companies stay safe. Each new company gets its own
                autosave and manual slots.
              </p>
            )}
            <label>
              Company name
              <input
                required
                maxLength={28}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </label>
            <label>
              Brand slogan
              <input
                maxLength={70}
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
              />
            </label>
            <div className="two-col">
              <label>
                Your aesthetic
                <select
                  value={aesthetic}
                  onChange={(e) => setAesthetic(e.target.value)}
                >
                  {AESTHETICS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label>
                Brand colour
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                />
              </label>
            </div>
            <label>
              Founder skin tone
              <div className="swatches">
                {["#e6ba98", "#c59373", "#a77c62", "#81583f", "#50392c"].map(
                  (c) => (
                    <button
                      type="button"
                      key={c}
                      aria-label={`Skin tone ${c}`}
                      aria-pressed={founder === c}
                      className={founder === c ? "selected" : ""}
                      style={{ background: c }}
                      onClick={() => setFounder(c)}
                    />
                  ),
                )}
              </div>
            </label>
            <div className="starting-note">
              <span>YOUR STARTING KIT</span>
              <b>$500 · 5 cotton blanks · 5 mailers</b>
              <small>One laptop, one heat press, one very big idea.</small>
            </div>
            <button className="primary full" type="submit">
              Open the studio <ArrowRight size={17} />
            </button>
          </form>
        </div>
      )}
      {screen === "game" && (
        <>
          <header className="hud">
            <button
              className="brand-home"
              aria-label="Save & return to menu"
              onClick={saveAndExit}
            >
              <span className="mark">se.</span>
              <div>
                <b>COMPANY TYCOON</b>
                <small>{g.brand} / BEDROOM STUDIO</small>
              </div>
            </button>
            <div className="hud-stats">
              <button onClick={() => open("finances")}>
                <small>AVAILABLE CASH</small>
                <strong>{money(g.cash)}</strong>
              </button>
              <button onClick={() => open("social")}>
                <small>FOLLOWERS</small>
                <strong>
                  {g.followers.toLocaleString()}
                  <span> people</span>
                </strong>
              </button>
              <button onClick={() => open("upgrades")}>
                <small>REPUTATION</small>
                <strong>
                  {g.reputation}
                  <span> / 100</span>
                </strong>
              </button>
            </div>
            <div className="clock">
              <small>
                DAY {Math.floor(g.time / 240) + 1} · BEDROOM STARTUP
              </small>
              <div>
                <span>
                  {String(8 + Math.floor((g.time % 240) / 15)).padStart(2, "0")}
                  :{String((g.time % 15) * 4).padStart(2, "0")}
                </span>
                <button
                  aria-label={paused ? "Resume simulation" : "Pause simulation"}
                  onClick={() => useGame.setState({ paused: !paused })}
                >
                  {paused ? <Play size={14} /> : <Pause size={14} />}
                </button>
                <button
                  aria-label="Toggle simulation speed"
                  className={speed === 3 ? "selected" : ""}
                  onClick={() =>
                    useGame.setState({ speed: speed === 1 ? 3 : 1 })
                  }
                >
                  <ChevronsRight size={16} />
                  <small>{speed}×</small>
                </button>
              </div>
            </div>
            <button
              className="icon-button"
              aria-label="Open settings"
              onClick={() => open("settings")}
            >
              <Settings size={18} />
            </button>
          </header>
          <div className="scene-caption">
            <span className="live-dot" />
            YOUR BEDROOM STUDIO <span>01 — THE BEGINNING</span>
          </div>
          {!panel && (
            <>
              <aside className="chapter-card">
                <div className="eyebrow">
                  THE INDEPENDENT JOURNAL <span>01</span>
                </div>
                <h2>
                  A small start.
                  <br />A real business.
                </h2>
                <p>
                  Every piece you make is a step
                  <br />
                  toward something of your own.
                </p>
                <div className="chapter-rule" />
                <div className="chapter-metrics">
                  <span>
                    SHIRTS DELIVERED
                    <b>{String(completed(g)).padStart(2, "0")}</b>
                  </span>
                  <span>
                    TOTAL REVENUE<b>{money(revenue(g))}</b>
                  </span>
                </div>
                <div className="chapter-progress">
                  <div className="progress">
                    <i
                      style={{
                        width: `${Math.min(100, (completed(g) / 5) * 100)}%`,
                      }}
                    />
                  </div>
                  <small>
                    THE FIRST FIVE / {Math.min(5, completed(g))} OF 5
                  </small>
                </div>
              </aside>
              <button className="room-guide" onClick={() => setGuide(true)}>
                <MapPin size={14} />
                Bedroom studio <span>M</span>
              </button>
            </>
          )}
          {g.tutorial && !panel && (
            <section className="mission">
              <div className="mission-icon">
                <ArrowUpRight size={24} />
              </div>
              <div className="grow">
                <span className="eyebrow">YOUR NEXT MOVE</span>
                <h3>{mission.title}</h3>
                <p>{mission.detail}</p>
              </div>
              <button
                className="mission-go"
                onClick={() => open(mission.panel)}
                aria-label="Open current objective"
              >
                <ArrowRight size={20} />
              </button>
              <button
                className="mission-skip"
                aria-label="Hide tutorial"
                onClick={() =>
                  useGame.getState().dispatch({ type: "tutorial" })
                }
              >
                <X size={12} />
              </button>
            </section>
          )}
          <nav className="dock" aria-label="Workstations">
            {NAV.map((n) => (
              <button
                key={n.id}
                className={panel === n.id ? "active" : ""}
                onClick={() => open(panel === n.id ? null : n.id)}
              >
                <n.icon size={19} />
                <span>{n.label}</span>
                {n.id === "orders" && pending > 0 && <i>{pending}</i>}
              </button>
            ))}
          </nav>
          <footer className="statusbar">
            <span>
              <i className="live-dot" />
              {status}
            </span>
            <span>WASD move · Drag to orbit · E interact · Tab phone</span>
            <button
              onClick={() => {
                void useGame.getState().save();
              }}
            >
              <Save size={12} />
              Save journal
            </button>
          </footer>
          {panel && (
            <aside
              className="workstation"
              aria-label={PANEL_TITLES[panel]?.[1]}
            >
              <header>
                <div>
                  <span className="eyebrow">{PANEL_TITLES[panel]?.[0]}</span>
                  <h2>{PANEL_TITLES[panel]?.[1]}</h2>
                </div>
                <button
                  className="icon-button"
                  onClick={() => open(null)}
                  aria-label="Close workstation"
                >
                  <X size={20} />
                </button>
              </header>
              <div className="panel-body">
                <Boundary>
                  <PanelContent key={panel} panel={panel} />
                  {panel === "settings" && (
                    <button className="primary full" onClick={saveAndExit}>
                      Save & return to menu
                    </button>
                  )}
                </Boundary>
              </div>
            </aside>
          )}
        </>
      )}
      {(guide || credits) && (
        <div className="modal-shade">
          <div className="guide">
            <button
              className="close"
              aria-label="Close dialog"
              onClick={() => {
                setGuide(false);
                setCredits(false);
              }}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">
              {guide ? "YOUR FIRST HEADQUARTERS" : "INDEPENDENT BY DESIGN"}
            </span>
            <h2>
              {guide ? "The room that starts it all." : "Streetwear Empire"}
            </h2>
            {guide ? (
              <>
                <p>
                  Click a room label, use the dock, or walk near a workstation
                  and press E.
                </p>
                {[
                  "Design desk · back-left: create and save your first cotton T-shirt.",
                  "Heat press · back-right: use one blank and $4 ink to produce a piece.",
                  "Packing station · front-right: use a mailer, ship for $5, and receive payment on delivery.",
                ].map((t) => (
                  <p key={t}>{t}</p>
                ))}
                <button
                  className="secondary full"
                  onClick={() => {
                    useGame.getState().dispatch({ type: "tutorial" });
                    setGuide(false);
                  }}
                >
                  {g.tutorial ? "Hide" : "Show"} guided objectives
                </button>
              </>
            ) : (
              <>
                <p>
                  Original procedural geometry and generated typography. System
                  fonts. Synthesised UI audio. No third-party art or music
                  assets.
                </p>
                <p>
                  Built with React, Three.js, React Three Fiber, Drei, Zustand
                  and IndexedDB. Dependencies retain their respective
                  open-source licences.
                </p>
                <p className="muted">
                  First playable bedroom chapter. Full city and factory
                  progression are future development phases.
                </p>
              </>
            )}
          </div>
        </div>
      )}
      {companies && (
        <Companies
          close={() => {
            setCompanies(false);
            void loadGame("autosave")
              .then((s) => setAvailable(!!s))
              .catch((e) => useGame.getState().notify(e.message));
          }}
          play={async (save) => {
            useGame.getState().setGame(save.game);
            if (!(await useGame.getState().save()))
              throw new Error("Could not activate company.");
            setCompanies(false);
            setScreen("game");
          }}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => useGame.getState().notify("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
