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
  const next = TUTORIAL_TASKS.find(([t]) => !o.tasks.includes(t))?.[0];
  const hints: Partial<Record<NonNullable<typeof next>, string>> = {
    move: "Use your configured movement keys. Drag to look and scroll to zoom.",
    computer:
      "Find the desk at the back left. Walk to its right side and use the nearby prompt.",
    design: "Open Design Studio on your computer and save a product.",
    materials:
      "Use Supplier Market on the computer. MTB batches need a bench prototype first.",
    produce:
      "Receive deliveries at the front door, then use the manufacturing bench at the back right.",
    price: "Set a retail price in Design Studio or Product Catalogue.",
    promote: "Use SocialHub on the computer once you have finished stock.",
    order:
      "Keep your online store open with a listed, advertised product in stock.",
    pack: "Use the packing station at the front right. Each order needs a mailer.",
    deliver: "Pay postage at the packing station and wait for delivery.",
    finances: "Open Finances on the computer to review your first sale.",
  };
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
      <small>{next && hints[next]}</small>
      <button
        className="text-button"
        onClick={() => dispatch({ type: "tutorial-skip" })}
      >
        Pause tutorial
      </button>
    </section>
  );
}
