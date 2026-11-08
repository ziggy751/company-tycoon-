import { useState } from "react";
import { useGame } from "../game/store";
export function WorldMap() {
  const g = useGame((s) => s.game)!;
  const [zoom, setZoom] = useState(1);
  const points = [
    { name: "Starter home", x: 0, z: 2, owned: true },
    { name: "Garage workshop", x: 30, z: -14, owned: g.property === "garage" },
  ];
  return (
    <>
      <p className="muted">
        Click a destination to place a navigation marker. Move there using your
        movement keys; map clicks do not teleport you.
      </p>
      <label>
        Map zoom
        <input
          type="range"
          min="1"
          max="2"
          step=".1"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
      </label>
      <svg
        className="world-map"
        viewBox={`${40 - 40 / zoom} ${35 - 35 / zoom} ${80 / zoom} ${70 / zoom}`}
        aria-label="Neighbourhood map"
      >
        <rect width="80" height="70" fill="#dce3c8" />
        <path d="M0 53H80" stroke="#8d9783" strokeWidth="7" />
        {[-18, 18].map((x) => (
          <rect
            key={x}
            x={x + 35}
            y="31"
            width="10"
            height="14"
            fill="#b2b7a5"
          />
        ))}
        {points.map((p) => (
          <g
            key={p.name}
            role="button"
            tabIndex={0}
            aria-label={"Navigate to " + p.name}
            onClick={() => {
              useGame
                .getState()
                .dispatch({ type: "waypoint", position: [p.x, p.z] });
              useGame.getState().open(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                useGame
                  .getState()
                  .dispatch({ type: "waypoint", position: [p.x, p.z] });
                useGame.getState().open(null);
              }
            }}
          >
            <rect
              x={p.x + 36}
              y={p.z + 32}
              width="8"
              height="6"
              rx="1"
              fill={p.owned ? "#476747" : "#b5aa86"}
            />
            <text x={p.x + 40} y={p.z + 30} textAnchor="middle" fontSize="2.1">
              {p.name}
            </text>
          </g>
        ))}
        <circle
          cx={g.player[0] + 40}
          cy={g.player[1] + 35}
          r="1"
          fill="#b45735"
        />
        {g.waypoint && (
          <circle
            cx={g.waypoint[0] + 40}
            cy={g.waypoint[1] + 35}
            r="2"
            fill="none"
            stroke="#8b6d34"
            strokeWidth=".5"
          />
        )}
      </svg>
      <p className="muted">
        Green: owned · Sand: available for progression · Orange: your position
      </p>
      {points.map((p) => (
        <div className="row" key={p.name}>
          <strong>{p.name}</strong>
          <span>{p.owned ? "Owned" : "See Workspace unlocks"}</span>
        </div>
      ))}
    </>
  );
}
