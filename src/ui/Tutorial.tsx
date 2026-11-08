import { useGame } from "../game/store";
import { TUTORIAL_TASKS, industryOf } from "../game/industries";
export function Tutorial() {
  const g = useGame((s) => s.game)!,
    o = g.onboarding,
    dispatch = useGame((s) => s.dispatch);
  if (!o) return null;
  if (o.mode === "pending")
    return (
      <section className="tutorial-card">
        <span className="eyebrow">WELCOME TO COMPANY TYCOON</span>
        <h2>Find your first customer.</h2>
        <p>
          Would you like a short tutorial for your{" "}
          {industryOf(g).name.toLowerCase()} company? Complete it to earn a
          one-time $100 starting bonus.
        </p>
        <div className="row">
          <button
            className="primary"
            onClick={() => dispatch({ type: "tutorial-start" })}
          >
            Yes, start tutorial
          </button>
          <button
            className="secondary"
            onClick={() => dispatch({ type: "tutorial-skip" })}
          >
            No, start playing
          </button>
        </div>
      </section>
    );
  if (o.mode === "complete")
    return (
      <section className="tutorial-card compact">
        <span className="eyebrow">TUTORIAL COMPLETE</span>
        <p>
          Your $100 bonus is recorded once in the ledger. Replay any time in
          Settings.
        </p>
        <button
          className="secondary"
          onClick={() => dispatch({ type: "tutorial-skip" })}
        >
          Continue building
        </button>
      </section>
    );
  if (o.mode !== "active") return null;
  const done = o.tasks.length;
  return (
    <section className="tutorial-card compact">
      <span className="eyebrow">
        {industryOf(g).name.toUpperCase()} / TUTORIAL {done}/
        {TUTORIAL_TASKS.length}
      </span>
      <p>{TUTORIAL_TASKS.find(([t]) => !o.tasks.includes(t))?.[1]}</p>
      <div className="progress">
        <i style={{ width: (done / TUTORIAL_TASKS.length) * 100 + "%" }} />
      </div>
      <small>{industryOf(g).workflow}</small>
      <button
        className="text-button"
        onClick={() => dispatch({ type: "tutorial-skip" })}
      >
        Pause tutorial
      </button>
    </section>
  );
}
