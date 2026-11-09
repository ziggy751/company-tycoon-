import { useEffect, useRef, useState } from "react";
import {
  Mountain,
  Shirt,
  Package,
  ShoppingBag,
  ChartNoAxesCombined,
  Store,
  Mail,
  Settings,
  X,
  Minus,
  Square,
  LogOut,
  FolderOpen,
  Smartphone,
  Armchair,
  Search,
} from "lucide-react";
import { useGame } from "../game/store";
import { PanelContent } from "./Panels";
import {
  CatalogueApp,
  SupplierApp,
  InboxApp,
  OnlineStoreApp,
} from "./BusinessApps";
import { IndustryDesigner } from "./IndustryPanels";
import type { ProductKind } from "../game/industries";
const APPS = [
  { id: "design", name: "Design Studio", icon: Shirt, color: "#9771f2" },
  {
    id: "catalogue",
    name: "Product Catalogue",
    icon: FolderOpen,
    color: "#b69368",
  },
  {
    id: "inventory",
    name: "Supplier Market",
    icon: ShoppingBag,
    color: "#658fa9",
  },
  { id: "social", name: "SocialHub", icon: Smartphone, color: "#9c6cb4" },
  { id: "orders", name: "Orders", icon: Package, color: "#6988c1" },
  {
    id: "finances",
    name: "Finances",
    icon: ChartNoAxesCombined,
    color: "#719e89",
  },
  { id: "upgrades", name: "Property", icon: Armchair, color: "#9271be" },
  { id: "store", name: "Online Store", icon: Store, color: "#689886" },
  { id: "inbox", name: "Email Inbox", icon: Mail, color: "#668cbe" },
  { id: "settings", name: "Settings", icon: Settings, color: "#7e8396" },
];
type WindowState = {
  id: string;
  x: number;
  y: number;
  minimized: boolean;
  maximized: boolean;
  z: number;
};
export function Computer({
  saveAndExit,
}: {
  saveAndExit: () => Promise<void>;
}) {
  const g = useGame((s) => s.game)!,
    status = useGame((s) => s.saveStatus),
    request = useGame((s) => s.desktopApp);
  const [windows, setWindows] = useState<WindowState[]>([]),
    [selected, setSelected] = useState<ProductKind | undefined>(),
    [search, setSearch] = useState("");
  const top = useRef(0),
    drag = useRef<{
      id: string;
      x: number;
      y: number;
      left: number;
      top: number;
    } | null>(null),
    root = useRef<HTMLDivElement>(null);
  const launch = (id: string) => {
    if (id === "design" || id === "finances")
      useGame.getState().dispatch({
        type: "tutorial-event",
        task: id === "design" ? "computer" : "finances",
      });
    setWindows((ws) =>
      ws.some((w) => w.id === id)
        ? ws.map((w) =>
            w.id === id ? { ...w, minimized: false, z: ++top.current } : w,
          )
        : [
            ...ws,
            {
              id,
              x: Math.min(70 + ws.length * 20, 180),
              y: 28 + ws.length * 12,
              minimized: false,
              maximized: false,
              z: ++top.current,
            },
          ],
    );
  };
  useEffect(() => {
    const frontmost =
      windows.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0]?.id ||
      null;
    useGame.setState({ desktopFocused: frontmost });
    return () => useGame.setState({ desktopFocused: null });
  }, [windows]);
  useEffect(() => {
    if (request) {
      launch(request);
      useGame.setState({ desktopApp: null });
    }
  }, [request]);
  useEffect(() => {
    const cancel = () => {
      drag.current = null;
    };
    window.addEventListener("blur", cancel);
    return () => window.removeEventListener("blur", cancel);
  }, []);
  const close = () => useGame.getState().open(null);
  const front = (id: string) =>
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, z: ++top.current } : w)),
    );
  return (
    <div
      className="computer-shade"
      onWheel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <section
        className="computer"
        aria-label="SummitOS desktop"
        ref={root}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const box = root.current!.getBoundingClientRect();
          setWindows((ws) =>
            ws.map((w) =>
              w.id === d.id
                ? {
                    ...w,
                    x: Math.max(
                      0,
                      Math.min(box.width - 220, d.left + e.clientX - d.x),
                    ),
                    y: Math.max(
                      0,
                      Math.min(box.height - 150, d.top + e.clientY - d.y),
                    ),
                  }
                : w,
            ),
          );
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <div className="os-menubar">
          <span>
            <Mountain size={18} /> SummitOS <b>{g.brand}</b>
          </span>
          <span>
            Day {Math.floor(g.time / 240) + 1} · {status}
            <button onClick={close} aria-label="Exit computer">
              <LogOut size={14} /> Exit computer · Esc
            </button>
          </span>
        </div>
        <div className="os-desktop">
          <div className="wallpaper-art">
            <Mountain />
            <span>
              MAKE SOMETHING
              <br />
              OF YOUR OWN.
            </span>
          </div>
          <div className="desktop-icons">
            {APPS.filter((a) =>
              a.name.toLowerCase().includes(search.toLowerCase()),
            ).map((a) => (
              <button
                key={a.id}
                onClick={() => launch(a.id)}
                aria-label={`Open ${a.name}`}
              >
                <i style={{ background: a.color }}>
                  <a.icon size={27} />
                </i>
                <span>{a.name}</span>
              </button>
            ))}
          </div>
          {windows.map((w) => {
            const app = APPS.find((a) => a.id === w.id),
              name = app?.name || "Save Management";
            return (
              <article
                key={w.id}
                className={`os-window ${w.maximized ? "maximized" : ""}`}
                aria-label={`${name} window`}
                style={{
                  left: w.maximized ? 0 : w.x,
                  top: w.maximized ? 0 : w.y,
                  zIndex: w.z,
                  display: w.minimized ? "none" : undefined,
                  maxHeight: w.maximized ? "100%" : `calc(100% - ${w.y + 8}px)`,
                }}
                onPointerDown={() => front(w.id)}
              >
                <header
                  className="window-title"
                  onDoubleClick={() =>
                    setWindows((ws) =>
                      ws.map((a) =>
                        a.id === w.id ? { ...a, maximized: !a.maximized } : a,
                      ),
                    )
                  }
                  onPointerDown={(e) => {
                    if (
                      (e.target as HTMLElement).closest("button") ||
                      w.maximized
                    )
                      return;
                    drag.current = {
                      id: w.id,
                      x: e.clientX,
                      y: e.clientY,
                      left: w.x,
                      top: w.y,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                >
                  <span>
                    {app && <app.icon size={15} />} {name}{" "}
                    <small>— {g.brand}</small>
                  </span>
                  <div>
                    <button
                      aria-label={`Minimize ${name}`}
                      onClick={() =>
                        setWindows((ws) =>
                          ws.map((a) =>
                            a.id === w.id ? { ...a, minimized: true } : a,
                          ),
                        )
                      }
                    >
                      <Minus size={15} />
                    </button>
                    <button
                      aria-label={`Maximize ${name}`}
                      onClick={() =>
                        setWindows((ws) =>
                          ws.map((a) =>
                            a.id === w.id
                              ? { ...a, maximized: !a.maximized }
                              : a,
                          ),
                        )
                      }
                    >
                      <Square size={12} />
                    </button>
                    <button
                      aria-label={`Close ${name}`}
                      onClick={() =>
                        setWindows((ws) => ws.filter((a) => a.id !== w.id))
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                </header>
                <div className="window-body">
                  {w.id === "catalogue" ? (
                    <CatalogueApp
                      design={(kind) => {
                        setSelected(kind);
                        launch("design");
                      }}
                    />
                  ) : w.id === "inventory" ? (
                    <SupplierApp />
                  ) : w.id === "inbox" ? (
                    <InboxApp />
                  ) : w.id === "store" ? (
                    <OnlineStoreApp />
                  ) : w.id === "design" ? (
                    <IndustryDesigner
                      key={selected || "default"}
                      initialKind={selected}
                      active={!w.minimized}
                    />
                  ) : (
                    <PanelContent panel={w.id} />
                  )}
                  {w.id === "settings" && (
                    <button className="primary full" onClick={saveAndExit}>
                      Save & Exit
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <footer className="os-taskbar">
          <button
            aria-label="Show desktop"
            title="Show desktop"
            onClick={() =>
              setWindows((ws) => ws.map((w) => ({ ...w, minimized: true })))
            }
          >
            <Mountain size={25} />
          </button>
          <label>
            <Search size={15} />
            <input
              aria-label="Find application"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find an app"
            />
          </label>
          <div>
            {windows.map((w) => {
              const app = APPS.find((a) => a.id === w.id);
              return (
                <button
                  key={w.id}
                  title={app?.name || w.id}
                  aria-label={`Restore ${app?.name || w.id}`}
                  className={w.minimized ? "" : "running"}
                  onClick={() => launch(w.id)}
                >
                  {app ? <app.icon size={20} /> : <FolderOpen size={20} />}
                </button>
              );
            })}
          </div>
          <button onClick={() => void useGame.getState().save()}>
            {status}
          </button>
          <button onClick={saveAndExit}>Save & Exit</button>
        </footer>
      </section>
    </div>
  );
}
