import { useGame } from "../game/store";
import { IndustryEquipment } from "./IndustryEquipment";
import { surface } from "./materials";
function Block({
  p,
  s,
  c,
}: {
  p: [number, number, number];
  s: [number, number, number];
  c: string;
}) {
  return (
    <mesh
      position={p}
      castShadow
      receiveShadow
      userData={{ cameraSolid: true }}
    >
      <boxGeometry args={s} />
      {useGame.getState().settings.quality === "low" ? (
        <meshLambertMaterial color={c} />
      ) : (
        <meshStandardMaterial
          color={c}
          {...surface("concrete")}
          bumpScale={0.02}
          roughness={0.8}
        />
      )}
    </mesh>
  );
}
export function Garage() {
  const g = useGame((s) => s.game)!;
  const inside =
    g.player[0] > 24 &&
    g.player[0] < 36 &&
    g.player[1] > -19 &&
    g.player[1] < -9;
  const h = inside ? 0.7 : 3.5;
  return (
    <group position={[30, 0, -14]}>
      <Block p={[0, -0.08, 0]} s={[12, 0.16, 10]} c="#aaa79b" />
      <Block p={[0, 1.75, -5]} s={[12, 3.5, 0.15]} c="#8c948c" />
      {[-6, 6].map((x) => (
        <Block key={x} p={[x, h / 2, 0]} s={[0.15, h, 10]} c="#8c948c" />
      ))}
      {[-3.75, 3.75].map((x) => (
        <Block key={x} p={[x, h / 2, 5]} s={[4.5, h, 0.15]} c="#8c948c" />
      ))}
      {!inside && <Block p={[0, 3.65, 0]} s={[12.5, 0.2, 10.5]} c="#59645f" />}
      {g.property === "garage" && (
        <group onClick={() => useGame.getState().interact("computer")}>
          <Block p={[0, 1, -4]} s={[1.6, 0.1, 0.7]} c="#85725d" />
          <Block p={[0, 1.5, -4.2]} s={[1.1, 0.7, 0.06]} c="#242736" />
          <Block p={[0, 1.5, -4.16]} s={[1, 0.6, 0.01]} c="#8862bd" />
          <Block p={[0, 1.08, -3.9]} s={[0.8, 0.04, 0.3]} c="#4e5161" />
        </group>
      )}
      <Block p={[-3, 1, -3]} s={[3, 0.15, 1.4]} c="#85725d" />
      {[-4, -2].map((x) => (
        <Block key={x} p={[x, 0.5, -3]} s={[0.1, 1, 1]} c="#414941" />
      ))}
      <group position={[-3, 1.1, -3]}>
        <IndustryEquipment garage />
      </group>
      <Block p={[3, 0.95, 2]} s={[3, 0.12, 1.5]} c="#85725d" />
      {[0, 1, 2].map((y) => (
        <Block
          key={y}
          p={[4, y * 0.8 + 0.15, -2]}
          s={[2, 0.08, 2]}
          c="#4f5d52"
        />
      ))}
    </group>
  );
}
