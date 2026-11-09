import { Graphics } from "./Graphics";
import { Controls } from "./Controls";
import { useGame } from "../game/store";
export function MenuPreferences({ close }: { close: () => void }) {
  const s = useGame((x) => x.settings),
    configure = useGame((x) => x.configure);
  return (
    <div className="modal-shade">
      <section className="creation">
        <button
          className="close"
          onClick={close}
          aria-label="Close menu settings"
        >
          ×
        </button>
        <h2>Settings</h2>
        <p className="muted">
          Device preferences apply to all companies. Opening settings does not
          create or load a business.
        </p>
        <Graphics />
        <label>
          Camera sensitivity
          <input
            type="range"
            min=".25"
            max="2"
            step=".05"
            value={s.sensitivity}
            onChange={(e) => configure({ sensitivity: Number(e.target.value) })}
          />
        </label>
        <label>
          UI sound volume
          <input
            type="range"
            min="0"
            max=".5"
            step=".01"
            value={s.volume}
            onChange={(e) => configure({ volume: Number(e.target.value) })}
          />
        </label>
        <Controls />
      </section>
    </div>
  );
}
