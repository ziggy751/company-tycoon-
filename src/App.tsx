import { Computer } from "./ui/Computer";
import { stations } from "./game/interactions";
import { MenuPreferences } from "./ui/MenuPreferences";
import { industryOf, type IndustryId } from "./game/industries";
import { IndustrySelect } from "./ui/IndustrySelect";
import { Tutorial } from "./ui/Tutorial";
import { DEFAULT_CONTROLS, editing } from "./game/controls";
import { Companies } from "./ui/Companies";
import { useEffect, useState, Component, type ReactNode } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Settings,
  X,
  Pause,
  Play,
  Save,
  Leaf,
  MapPin,
} from "lucide-react";
import { World } from "./world/World";
import { useGame } from "./game/store";
import { newGame } from "./game/simulation";
import { loadGame } from "./game/save";
import { AESTHETICS, money } from "./game/catalog";
import { PanelContent, PANEL_TITLES } from "./ui/Panels";
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="world-fallback">
        This view could not load. Close it and retry. For 3D problems, choose
        Low quality in Settings and reload.
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
  const [screen, setScreen] = useState<"menu" | "industry" | "create" | "game">(
    "menu",
  );
  const [industry, setIndustry] = useState<IndustryId>("streetwear");
  const [menuSettings, setMenuSettings] = useState(false);
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
    open = useGame((s) => s.open),
    interaction = useGame((s) => s.interaction);
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
          ["high", "low", "medium", "ultra"].includes(p.quality) &&
          Number.isFinite(p.volume) &&
          Number.isFinite(p.sensitivity)
        )
          useGame.getState().configure({
            ...DEFAULT_CONTROLS,
            ...p,
            keys: { ...DEFAULT_CONTROLS.keys, ...p.keys },
          });
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
      if (screen !== "game") {
        if (e.code === "Escape") {
          setMenuSettings(false);
          setCompanies(false);
          setCredits(false);
          setGuide(false);
          if (screen !== "menu") setScreen("menu");
        }
        return;
      }
      if (editing(e.target) && e.code !== "Escape") return;
      const s = useGame.getState();
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (s.panel && e.code !== "Escape") return;
      if (e.code === "Escape") s.open(s.panel ? null : "settings");
      const application =
        e.code === s.settings.keys.phone
          ? "social"
          : e.code === s.settings.keys.inventory
            ? "inventory"
            : e.code === s.settings.keys.workspace
              ? "upgrades"
              : null;
      if (application) {
        e.preventDefault();
        if (s.interaction === "computer") {
          s.interact("computer");
          useGame.setState({ desktopApp: application });
        } else s.notify("Walk to a computer to open this application.");
      }
      if (e.code === s.settings.keys.map)
        s.open(s.panel === "map" ? null : "map");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [screen]);
  const saveAndExit = async () => {
    const previouslyPaused = useGame.getState().paused;
    useGame.setState({ paused: true });
    if (!(await useGame.getState().save())) {
      useGame.setState({ paused: previouslyPaused });
      return;
    }
    setAvailable(true);
    open(null);
    setScreen("menu");
  };
  useEffect(() => {
    useGame.setState({ playing: screen === "game" });
  }, [screen]);
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
              A home workspace. Your own industry. Five hundred dollars.
              <br />
              Build something that has your name on it.
            </p>
            <button
              className="primary menu-start"
              onClick={() => setScreen("industry")}
            >
              Create Company <ArrowUpRight size={20} />
            </button>
            <div className="menu-links">
              <button disabled={!available} onClick={resume}>
                Continue <ArrowRight size={14} />
              </button>
              <button onClick={() => setCompanies(true)}>My Companies</button>
              <button onClick={() => setMenuSettings(true)}>Settings</button>
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
      {screen === "industry" && (
        <IndustrySelect
          back={() => setScreen("menu")}
          choose={(id) => {
            setIndustry(id);
            setScreen("create");
          }}
        />
      )}
      {screen === "create" && (
        <div className="modal-shade">
          <form
            className="creation"
            onSubmit={(e) => {
              e.preventDefault();
              useGame
                .getState()
                .setGame(
                  newGame(brand, slogan, accent, aesthetic, founder, industry),
                );
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
            <p className="selected-industry">{industryOf({ industry }).name}</p>
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
              <b>
                $500 ·{" "}
                {industry === "streetwear"
                  ? "5 cotton blanks"
                  : industry === "haircare"
                    ? "5 paper labels"
                    : "Prototype tools"}{" "}
                · 5 mailers
              </b>
              <small>
                {industryOf({ industry }).equipment} ·{" "}
                {industryOf({ industry }).supplier}
              </small>
            </div>
            <button className="primary full" type="submit">
              Open the studio <ArrowRight size={17} />
            </button>
          </form>
        </div>
      )}
      {screen === "game" && (
        <>
          <header className="hud minimal-hud">
            <button
              className="brand-home"
              data-world-key={`${g.companyId || "legacy"}:${useGame.getState().worldEpoch}`}
              aria-label="Save & return to menu"
              onClick={saveAndExit}
            >
              <span className="mark">ct.</span>
              <div>
                <b>{g.brand}</b>
                <small>
                  {g.property === "garage"
                    ? "GARAGE WORKSHOP"
                    : "BEDROOM STUDIO"}
                </small>
              </div>
            </button>
            <strong className="cash-indicator">{money(g.cash)}</strong>
            <div className="clock">
              <span>DAY {Math.floor(g.time / 240) + 1}</span>
              <button
                aria-label={paused ? "Resume simulation" : "Pause simulation"}
                onClick={() => useGame.setState({ paused: !paused })}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button
                aria-label="Toggle simulation speed"
                onClick={() => useGame.setState({ speed: speed === 1 ? 3 : 1 })}
              >
                {speed}×
              </button>
            </div>
            <button
              className="icon-button"
              aria-label="Open world map"
              onClick={() => open("map")}
            >
              <MapPin size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Open settings"
              onClick={() => open("settings")}
            >
              <Settings size={18} />
            </button>
          </header>
          {!panel && <Tutorial />}
          {!panel && interaction && (
            <button
              className="interaction-prompt"
              onClick={() => useGame.getState().interact()}
            >
              <kbd>
                {useGame.getState().settings.keys.interact.replace("Key", "")}
              </kbd>
              {stations(g).find((s) => s.id === interaction)?.label}
            </button>
          )}
          <footer className="statusbar minimal-status">
            <span aria-live="polite">{status}</span>
            <button onClick={() => void useGame.getState().save()}>
              <Save size={12} />
              Save
            </button>
          </footer>
          {panel === "computer" && (
            <Boundary>
              <Computer saveAndExit={saveAndExit} />
            </Boundary>
          )}
          {panel && panel !== "computer" && (
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
                      Save & Exit
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
            <h2>{guide ? "The room that starts it all." : "Company Tycoon"}</h2>
            {guide ? (
              <>
                <p>
                  Walk near the computer or a physical workstation and press
                  your interaction key. Use the world map to plan a route.
                </p>
                {[
                  "Design desk · back-left: create a product for your chosen industry.",
                  industryOf(g).equipment +
                    " · back-right: " +
                    industryOf(g).workflow,
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
                  Original procedural geometry and generated typography, plus a
                  CC0 authored chair by Eric Chadwick / Wayfair. See ASSETS.md
                  for attribution. System fonts and synthesised UI audio.
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
      {menuSettings && <MenuPreferences close={() => setMenuSettings(false)} />}
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
