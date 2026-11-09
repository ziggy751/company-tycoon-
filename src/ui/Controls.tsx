import { useState } from "react";
import { useGame } from "../game/store";
import {
  DEFAULT_CONTROLS,
  DEFAULT_KEYS,
  assignKey,
  type Binding,
} from "../game/controls";
export function Controls() {
  const s = useGame((x) => x.settings),
    configure = useGame((x) => x.configure);
  const [capture, setCapture] = useState<Binding | null>(null),
    [error, setError] = useState("");
  return (
    <>
      <h3>MOUSE & TRACKPAD</h3>
      <label>
        Input preset
        <select
          value={s.inputMode}
          onChange={(e) =>
            configure({
              inputMode: e.target.value as typeof s.inputMode,
              zoomSensitivity: e.target.value === "trackpad" ? 0.6 : 1,
            })
          }
        >
          <option value="trackpad">MacBook / trackpad</option>
          <option value="mouse">Mouse & keyboard</option>
        </select>
      </label>
      <p className="muted">
        Drag with one finger / the left button to orbit. Two-finger scroll,
        pinch, or the wheel zooms. Walk near a station, then click its prompt or
        use the interaction key. Middle click is never required. Scroll inside
        panels to read them.
      </p>
      <label>
        Zoom sensitivity
        <input
          type="range"
          min=".1"
          max="2"
          step=".1"
          value={s.zoomSensitivity}
          onChange={(e) =>
            configure({ zoomSensitivity: Number(e.target.value) })
          }
        />
      </label>
      <label>
        Camera smoothing
        <input
          type="range"
          min=".05"
          max=".3"
          step=".01"
          value={s.damping}
          onChange={(e) => configure({ damping: Number(e.target.value) })}
        />
      </label>
      <label>
        Movement sensitivity
        <input
          type="range"
          min=".5"
          max="1.5"
          step=".1"
          value={s.movementSensitivity}
          onChange={(e) =>
            configure({ movementSensitivity: Number(e.target.value) })
          }
        />
      </label>
      <h3>CONFIGURE KEYBOARD</h3>
      {Object.entries(s.keys).map(([action, code]) => (
        <div className="row" key={action}>
          <span>
            {(
              {
                phone: "SocialHub · near computer",
                inventory: "Suppliers · near computer",
                workspace: "Property · near computer",
              } as Record<string, string>
            )[action] || action}
          </span>
          <button
            className="secondary"
            aria-label={`Rebind ${action}`}
            onClick={() => {
              setCapture(action as Binding);
              setError("");
            }}
            onBlur={() => setCapture(null)}
            onKeyDown={(e) => {
              if (capture !== action) return;
              if (e.metaKey || e.ctrlKey || e.altKey) return;
              e.preventDefault();
              e.stopPropagation();
              try {
                configure({
                  keys: assignKey(s.keys, action as Binding, e.code),
                });
                setCapture(null);
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            {capture === action ? "Press a key…" : code.replace("Key", "")}
          </button>
        </div>
      ))}
      {error && <p role="alert">{error}</p>}
      <button
        className="secondary full"
        onClick={() =>
          configure({ ...DEFAULT_CONTROLS, keys: { ...DEFAULT_KEYS } })
        }
      >
        Reset controls
      </button>
    </>
  );
}
