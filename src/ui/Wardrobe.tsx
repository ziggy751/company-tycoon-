import { useGame } from "../game/store";
export function Wardrobe() {
  const g = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  return (
    <>
      <p className="muted">
        Manufacture a sample, then set one aside to wear. This removes one
        saleable piece permanently into your wardrobe. Switching outfits never
        creates stock.
      </p>
      {g.designs.map((d) => (
        <article className="order" key={d.id}>
          <strong>{d.name}</strong>
          <p>
            {d.fit} · {d.stock} saleable ·{" "}
            {g.wardrobe?.includes(d.id) ? "Sample owned" : "No sample yet"}
          </p>
          <button
            className="primary full"
            disabled={
              g.equipped === d.id ||
              (!g.wardrobe?.includes(d.id) && d.stock === 0)
            }
            onClick={() => dispatch({ type: "wear", id: d.id })}
          >
            {g.equipped === d.id
              ? "Wearing this design"
              : g.wardrobe?.includes(d.id)
                ? "Wear sample"
                : "Set aside one sample & wear"}
          </button>
        </article>
      ))}
      <button
        className="secondary full"
        onClick={() => dispatch({ type: "wear", id: "" })}
      >
        Wear original outfit
      </button>
      <h3>HOME CONTROLS</h3>
      <button
        className="secondary full"
        onClick={() => dispatch({ type: "lights" })}
      >
        Turn interior lights {g.lightsOn === false ? "on" : "off"}
      </button>
      <button
        className="secondary full"
        onClick={() => dispatch({ type: "door" })}
      >
        {g.doorOpen ? "Close" : "Open"} bedroom door
      </button>
    </>
  );
}
