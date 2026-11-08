import { useEffect, useState } from "react";
import {
  listCompanies,
  removeCompany,
  saveGame,
  type Save,
} from "../game/save";
import { useGame } from "../game/store";
import { newGame, revenue } from "../game/simulation";
import { money } from "../game/catalog";
export function Companies({
  play,
  close,
}: {
  play: (save: Save) => Promise<void>;
  close: () => void;
}) {
  const [companies, setCompanies] = useState<Save[]>([]),
    [error, setError] = useState("");
  const refresh = () =>
    listCompanies()
      .then(setCompanies)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void refresh();
  }, []);
  return (
    <div className="modal-shade">
      <section className="creation company-list">
        <button className="close" onClick={close} aria-label="Close companies">
          ×
        </button>
        <span className="eyebrow">INDEPENDENT BUSINESSES / LOCAL SAVES</span>
        <h2>My companies</h2>
        <p>
          Each company has separate money, designs, stock and orders. Original
          saves are retained during migration.
        </p>
        {error && <p role="alert">{error}</p>}
        {companies.length === 0 && (
          <p>
            No companies yet. Create your first business from the main menu.
          </p>
        )}
        {companies.map((s) => (
          <article className="save-slot" key={s.game.companyId}>
            <h3>{s.game.brand}</h3>
            <small>
              Streetwear · Starter home · {Math.floor(s.game.time / 60)} minutes
            </small>
            <p>
              {money(s.game.cash)} cash · {money(revenue(s.game))} revenue ·{" "}
              {s.game.followers} followers
            </p>
            <small>Last saved {new Date(s.savedAt).toLocaleString()}</small>
            <div className="company-actions">
              <button
                className="primary"
                onClick={() => play(s).catch((e) => setError(e.message))}
              >
                Play
              </button>
              <button
                className="secondary"
                onClick={async () => {
                  const name = prompt("Company name", s.game.brand);
                  if (!name?.trim()) return;
                  try {
                    await saveGame("autosave", {
                      ...s.game,
                      brand: name.trim().slice(0, 28),
                    });
                    await refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Rename
              </button>
              <button
                className="secondary"
                onClick={async () => {
                  try {
                    await saveGame("autosave", {
                      ...s.game,
                      companyId: crypto.randomUUID(),
                      brand: (s.game.brand + " copy").slice(0, 28),
                    });
                    await refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Duplicate
              </button>
              <button
                className="secondary"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(s.game)], {
                      type: "application/json",
                    }),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "company-save.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                Export
              </button>
              <button
                className="text-button"
                onClick={async () => {
                  if (
                    !confirm(
                      "Delete " +
                        s.game.brand +
                        "? This cannot be undone. Export a backup first.",
                    )
                  )
                    return;
                  try {
                    await removeCompany(s.game.companyId!);
                    if (useGame.getState().game?.companyId === s.game.companyId)
                      useGame.getState().setGame(newGame());
                    await refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
