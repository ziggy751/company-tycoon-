import type { Design } from "../game/simulation";
import { Garment } from "./Garment";
type Props = {
  d: Pick<Design, "kind" | "color" | "ink" | "text" | "fit" | "graphic">;
};
export function CatalogueModel({ d }: { d: Props["d"] }) {
  const k = d.kind!;
  const box = (
    p: [number, number, number],
    s: [number, number, number],
    c = d.color,
  ) => (
    <mesh position={p} castShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={0.72} />
    </mesh>
  );
  const ring = (
    p: [number, number, number],
    radius: number,
    tube: number,
    c = d.color,
    arc = Math.PI * 2,
  ) => (
    <mesh position={p} castShadow>
      <torusGeometry args={[radius, tube, 10, 40, arc]} />
      <meshStandardMaterial color={c} roughness={0.6} />
    </mesh>
  );
  if (["longsleeve", "hoodie", "crewneck"].includes(k))
    return (
      <>
        <Garment design={d} longSleeves />
        {k === "hoodie" && (
          <>
            <mesh position={[0, 0.62, -0.1]} scale={[0.42, 0.45, 0.2]}>
              <sphereGeometry args={[1, 20, 16]} />
              <meshStandardMaterial color={d.color} />
            </mesh>
            {box([0, -0.45, 0.13], [0.62, 0.22, 0.07])}
            {[-0.12, 0.12].map((x) => (
              <mesh key={x} position={[x, 0.15, 0.16]}>
                <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
                <meshStandardMaterial color={d.ink} />
              </mesh>
            ))}
          </>
        )}
      </>
    );
  if (k === "shorts")
    return (
      <>
        {box([0, 0.4, 0], [1.25, 0.22, 0.2])}
        {[-0.34, 0.34].map((x) => (
          <group key={x}>
            {box([x, -0.05, 0], [0.6, 0.85, 0.22])}
            {box([x, -0.47, 0.03], [0.6, 0.07, 0.25], d.ink)}
          </group>
        ))}
        {box([0.35, 0.02, 0.13], [0.25, 0.3, 0.03], d.ink)}
      </>
    );
  if (k === "tote" || k === "styling-pouch")
    return (
      <>
        {box([0, -0.1, 0], [1.4, k === "tote" ? 1.3 : 0.75, 0.35])}
        {k === "tote"
          ? ring([0, 0.65, 0], 0.38, 0.05)
          : box([0, 0.3, 0.01], [1.4, 0.045, 0.37], d.ink)}
        {box([0, 0, 0.19], [0.55, 0.23, 0.015], d.ink)}
      </>
    );
  if (k === "cap" || k === "beanie")
    return (
      <>
        <mesh scale={[0.7, k === "cap" ? 0.45 : 0.8, 0.6]}>
          <sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={d.color} roughness={1} />
        </mesh>
        {k === "cap"
          ? box([0, 0.02, 0.65], [1.1, 0.06, 0.7])
          : box([0, 0.05, 0.01], [1.38, 0.25, 1.2])}
        {box([0, 0.23, 0.57], [0.35, 0.15, 0.025], d.ink)}
      </>
    );
  if (k === "grips")
    return (
      <>
        {[-0.5, 0.5].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.18, 0.18, 1.3, 24]} />
              <meshStandardMaterial color={d.color} roughness={0.95} />
            </mesh>
            {Array.from({ length: 12 }, (_, i) => (
              <mesh
                key={i}
                position={[0, -0.56 + i * 0.1, 0]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <torusGeometry args={[0.18, 0.018, 4, 20]} />
                <meshStandardMaterial color={d.ink} />
              </mesh>
            ))}
          </group>
        ))}
      </>
    );
  if (k === "end-plugs" || k === "top-cap")
    return (
      <>
        {[-0.4, 0.4].slice(0, k === "top-cap" ? 1 : 2).map((x) => (
          <mesh
            key={x}
            position={[k === "top-cap" ? 0 : x, 0, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry
              args={[
                k === "top-cap" ? 0.65 : 0.3,
                k === "top-cap" ? 0.65 : 0.25,
                0.2,
                32,
              ]}
            />
            <meshStandardMaterial
              color={d.color}
              metalness={k === "top-cap" ? 0.8 : 0.1}
              roughness={0.35}
            />
          </mesh>
        ))}
        {ring([0, 0, 0.14], 0.08, 0.03, d.ink)}
      </>
    );
  if (k === "number-plate")
    return (
      <>
        {box([0, 0, 0], [1.65, 1.1, 0.035])}
        {[-0.68, 0.68].map((x) => ring([x, 0.4, 0.04], 0.04, 0.016, d.ink))}
        {box([0, 0.03, 0.03], [0.8, 0.35, 0.015], d.ink)}
      </>
    );
  if (k === "frame-strap")
    return (
      <>
        <group scale={[1.6, 0.65, 1]}>{ring([0, 0.1, 0], 0.6, 0.1)}</group>
        {box([0.6, 0.12, 0.1], [0.35, 0.35, 0.12], d.ink)}
      </>
    );
  if (k === "bottle")
    return (
      <>
        <mesh>
          <cylinderGeometry args={[0.35, 0.33, 1.3, 32]} />
          <meshStandardMaterial color={d.color} roughness={0.42} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.28, 0.32, 0.15, 24]} />
          <meshStandardMaterial color={d.ink} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.09, 0.11, 0.16, 16]} />
          <meshStandardMaterial color={d.ink} />
        </mesh>
      </>
    );
  if (k === "bottle-cage")
    return (
      <>
        <group scale={[0.8, 1.3, 1]}>
          {ring([0, 0, 0], 0.5, 0.055, d.color, Math.PI * 1.8)}
        </group>
        {box([0, 0, -0.25], [0.12, 1.4, 0.08])}
        {[-0.4, 0.4].map((y) => ring([0, y, -0.18], 0.055, 0.015, d.ink))}
      </>
    );
  if (k === "scrunchie" || k === "headband")
    return (
      <>
        {ring(
          [0, 0.1, 0],
          0.6,
          k === "scrunchie" ? 0.18 : 0.09,
          d.color,
          k === "headband" ? Math.PI : Math.PI * 2,
        )}
        {k === "scrunchie" &&
          Array.from({ length: 14 }, (_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin((i / 14) * Math.PI * 2) * 0.6,
                0.1 + Math.cos((i / 14) * Math.PI * 2) * 0.6,
                0,
              ]}
              scale={[0.14, 0.22, 0.22]}
            >
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color={d.color} roughness={1} />
            </mesh>
          ))}
      </>
    );
  if (k === "hair-pins")
    return (
      <>
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i} position={[-0.7 + i * 0.28, 0, 0]}>
            {box([0, 0, 0], [0.035, 1.25, 0.03])}
            {box([0.08, 0, 0], [0.035, 1.25, 0.03])}
            {ring([0.04, 0.63, 0], 0.04, 0.018, d.color, Math.PI)}
          </group>
        ))}
      </>
    );
  if (k === "hair-towel")
    return (
      <>
        {box([0, 0, 0], [1.6, 1.25, 0.22])}
        {box([0, -0.47, 0.13], [1.6, 0.1, 0.03], d.ink)}
        {box([0.5, -0.2, 0.14], [0.3, 0.16, 0.02], d.ink)}
      </>
    );
  if (k === "brush")
    return (
      <>
        <mesh position={[0, -0.4, 0]}>
          <capsuleGeometry args={[0.12, 0.8, 4, 12]} />
          <meshStandardMaterial color={d.color} />
        </mesh>
        <mesh position={[0, 0.35, 0]} scale={[0.45, 0.65, 0.12]}>
          <sphereGeometry args={[1, 20, 16]} />
          <meshStandardMaterial color={d.color} />
        </mesh>
        {Array.from({ length: 35 }, (_, i) => (
          <mesh
            key={i}
            position={[
              -0.28 + (i % 5) * 0.14,
              0.02 + Math.floor(i / 5) * 0.1,
              0.16,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.015, 0.015, 0.16, 4]} />
            <meshStandardMaterial color={d.ink} />
          </mesh>
        ))}
      </>
    );
  return null;
}
