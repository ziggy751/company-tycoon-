import { useGame } from "../game/store";
import type { Quality } from "../game/graphics";
export function Graphics() {
  const s = useGame((x) => x.settings),
    configure = useGame((x) => x.configure);
  return (
    <>
      <label>
        Rendering quality
        <select
          value={s.quality}
          onChange={(e) => configure({ quality: e.target.value as Quality })}
        >
          <option value="low">Low · 1×, no shadows</option>
          <option value="medium">Medium · 1×, shadows</option>
          <option value="high">High · 1.5×, contact shadows</option>
          <option value="ultra">Ultra · 2×, contact shadows</option>
        </select>
      </label>
      <div className="two-col">
        <label>
          Render resolution
          <select
            value={s.renderScale}
            onChange={(e) => configure({ renderScale: +e.target.value })}
          >
            <option value={0.75}>75%</option>
            <option value={1}>100%</option>
            <option value={1.5}>150%</option>
            <option value={2}>200%</option>
          </select>
        </label>
        <label>
          Texture quality
          <select
            value={s.textureQuality}
            onChange={(e) =>
              configure({ textureQuality: e.target.value as "low" | "high" })
            }
          >
            <option value="low">Low · 256 px maps</option>
            <option value="high">High · up to 2048 px maps</option>
          </select>
        </label>
      </div>
      <div className="row">
        {(
          [
            { key: "shadows", label: "Shadows" },
            { key: "antialias", label: "Antialiasing" },
            { key: "effects", label: "Contact shadows" },
          ] as const
        ).map((x) => (
          <label className="check-label" key={x.key}>
            <input
              type="checkbox"
              checked={s[x.key]}
              onChange={(e) => configure({ [x.key]: e.target.checked })}
            />
            {x.label}
          </label>
        ))}
      </div>
      <p className="muted">
        Antialiasing takes effect after reloading. Higher resolution increases
        GPU use; Low is recommended for older laptops.
      </p>
    </>
  );
}
