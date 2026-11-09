import { useState } from "react";
import { useGame } from "../game/store";
import type { HandAction } from "../game/workshop";
export function WorkshopPanel({ station }: { station: string }) {
  const sound = useGame((s) => s.settings.workshopSounds);
  const g = useGame((s) => s.game)!,
    w = g.workshop,
    dispatch = useGame((s) => s.dispatch);
  const [design, setDesign] = useState(
      g.designs.find((d) => !d.kind || d.kind === "shirt")?.id || "",
    ),
    [alignment, setAlignment] = useState(0.5),
    [duration, setDuration] = useState(12);
  const button = (
    label: string,
    command: HandAction["command"],
    id?: string,
    value?: number,
  ) => (
    <button
      className="primary full"
      onClick={() => dispatch({ type: "hand", command, id, value })}
    >
      {label}
    </button>
  );
  if (g.industry && g.industry !== "streetwear") return null;
  if (!w?.enabled)
    return (
      <>
        <h3>Hands-on clothing</h3>
        <p>
          Carry boxes and shirts between real stations. No dragging is required.
          Your existing stock and designs are preserved.
        </p>
        {button("Start hands-on clothing", "enable")}
      </>
    );
  return (
    <>
      <h3>HANDS-ON WORKSHOP</h3>
      <label className="check-row">
        <input
          type="checkbox"
          checked={sound}
          onChange={(e) =>
            useGame.getState().configure({ workshopSounds: e.target.checked })
          }
        />
        Workshop sound effects · uses the UI volume setting
      </label>
      <p>
        {w.carry ? `Carrying ${w.carry.kind}.` : "Hands free."}{" "}
        {w.press ? `Press: ${w.press.stage}.` : ""}
      </p>
      {station === "receiving" && (
        <>
          {g.deliveries
            ?.filter((d) => d.arrives <= g.time && !d.picked)
            .map((d) => (
              <div className="order" key={d.id}>
                <p>
                  {d.quantity} × {d.item}
                </p>
                {button("Pick up delivery box", "pickup-delivery", d.id)}
              </div>
            ))}
          {w.carry?.kind === "parcel" &&
            button("Leave parcel for collection · $5", "dispatch")}
        </>
      )}
      {station === "shelf" && (
        <>
          <p>
            Material shelf → press → inspection shelf → finished stock → packing
            table → front-door collection.
          </p>
          {w.carry?.kind === "delivery" &&
            button("Open box and store materials", "unload")}
          {!w.carry && !w.press && button("Pick up one blank shirt", "blank")}
          {w.carry?.kind === "printed" &&
            w.press?.stage === "ready" &&
            button("Inspect printed shirt", "inspect")}
          {w.carry?.kind === "printed" && w.press?.stage === "inspected" && (
            <>
              <p>
                Quality {w.press.quality}/5. Both acceptable grades can be sold.
              </p>
              {button("Put inspected shirt in finished stock", "stock")}
            </>
          )}
          {!w.carry &&
            !w.packing &&
            g.orders
              .filter(
                (o) =>
                  o.status === "ordered" &&
                  !o.physical &&
                  g.designs.some(
                    (d) =>
                      d.id === o.designId && (!d.kind || d.kind === "shirt"),
                  ),
              )
              .map((o) => (
                <div className="order" key={o.id}>
                  <strong>
                    {o.customer} ·{" "}
                    {g.designs.find((d) => d.id === o.designId)?.name}
                  </strong>
                  {button(
                    "Collect reserved customer product",
                    "pick-order",
                    o.id,
                  )}
                </div>
              ))}
        </>
      )}
      {station === "production" && (
        <>
          {w.carry?.kind === "blank" && (
            <>
              <label>
                Saved tee design
                <select
                  value={design}
                  onChange={(e) => setDesign(e.target.value)}
                >
                  {g.designs
                    .filter((d) => !d.kind || d.kind === "shirt")
                    .map((d) => (
                      <option value={d.id} key={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </label>
              {button("Lay blank shirt on press", "place", design)}
            </>
          )}
          {["blank", "aligned"].includes(w.press?.stage || "") && (
            <>
              <label>
                Transfer alignment · centre is 50%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".05"
                  value={alignment}
                  onChange={(e) => setAlignment(+e.target.value)}
                />
              </label>
              {button(
                "Position custom transfer",
                "align",
                undefined,
                alignment,
              )}
              <label>
                Press cycle · recommended 12 seconds
                <input
                  type="range"
                  min="8"
                  max="18"
                  value={duration}
                  onChange={(e) => setDuration(+e.target.value)}
                />
                {duration}s
              </label>
              {w.press?.stage === "aligned" &&
                button(
                  `Lower and run heat press · $${g.designs.find((d) => d.id === w.press?.designId)?.finish === "premium" ? 7 : 4} ink`,
                  "press",
                  undefined,
                  duration,
                )}
            </>
          )}
          {w.press?.stage === "pressing" && (
            <p>
              Press closed · {Math.max(0, w.press.end! - g.time)}s. Open another
              app or wait here.
            </p>
          )}
          {w.press?.stage === "ready" &&
            !w.carry &&
            button("Raise press and collect shirt", "collect")}
          {w.learned && (
            <p>
              Repeat printing is now available below when your press and hands
              are clear.
            </p>
          )}
        </>
      )}
      {station === "orders" && (
        <>
          {w.carry?.kind === "order" &&
            button("Place reserved product on table", "place-order")}
          {w.packing?.stage === "product" &&
            button("Add protective mailer", "mailer")}
          {w.packing?.stage === "mailer" &&
            button("Check and attach customer label", "label")}
          {w.packing?.stage === "labelled" && (
            <>
              {!w.packing.insert &&
                button("Add branded insert · $0.50", "insert")}
              {button("Seal parcel", "seal")}
            </>
          )}
          {w.packing?.stage === "sealed" &&
            button("Pick up finished parcel", "parcel")}
        </>
      )}
      {!w.carry &&
        !w.press &&
        !w.packing &&
        button("Use streamlined workflow", "disable")}
      <button
        className="secondary full"
        onClick={() => useGame.getState().open(null)}
      >
        Return to the world
      </button>
    </>
  );
}
