import { Html } from "@react-three/drei";
import { useGame } from "../game/store";
import { surface } from "./materials";
function Block({
  p,
  s,
  c,
  mat = "concrete",
  onClick,
}: {
  p: [number, number, number];
  s: [number, number, number];
  c: string;
  mat?: Parameters<typeof surface>[0];
  onClick?: () => void;
}) {
  return (
    <mesh
      position={p}
      castShadow
      receiveShadow
      userData={{ cameraSolid: true }}
      onClick={onClick}
    >
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        {...surface(mat)}
        bumpScale={0.035}
        roughness={0.85}
      />
    </mesh>
  );
}
function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.23, 2.4, 7]} />
        <meshStandardMaterial color="#776149" {...surface("timber")} />
      </mesh>
      {[
        [-0.6, 2.5, 0],
        [0.6, 3, 0],
        [0, 3.6, 0],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <icosahedronGeometry args={[1.15, 2]} />
          <meshStandardMaterial
            color={i % 2 ? "#60734d" : "#738454"}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}
export function Neighbourhood() {
  const g = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const open = useGame((s) => s.open);
  const outside = Math.abs(g.player[0]) > 5 || g.player[1] > 10;
  const cut = outside ? 3.4 : 0.65;
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial
          color="#7e8b5f"
          {...surface("grass")}
          bumpScale={0.07}
          roughness={1}
        />
      </mesh>
      <Block p={[0, -0.1, 7]} s={[10, 0.2, 6]} c="#b2a48b" mat="timber" />
      <Block p={[0, -0.25, 3]} s={[10.5, 0.3, 14.5]} c="#aaa494" />
      <Block p={[-5, 1.7, 7]} s={[0.2, 3.4, 6]} c="#c3b7a1" mat="plaster" />
      <Block p={[5, cut / 2, 3]} s={[0.2, cut, 14]} c="#a99b87" mat="brick" />
      {[-3, 3].map((x) => (
        <Block
          key={x}
          p={[x, cut / 2, 4]}
          s={[4, cut, 0.16]}
          c={g.wall}
          mat="plaster"
        />
      ))}
      <Block p={[0, 3.2, 4]} s={[2, 0.4, 0.16]} c={g.wall} mat="plaster" />
      <group
        position={[-1, 0, 4]}
        rotation={[0, g.doorOpen ? -Math.PI * 0.5 : 0, 0]}
        onClick={() => dispatch({ type: "door" })}
      >
        <Block p={[1, 1.4, 0]} s={[2, 2.8, 0.1]} c="#86715a" mat="timber" />
        <mesh position={[1.8, 1.35, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 12]} />
          <meshStandardMaterial
            color="#bbb5a6"
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
      </group>
      <Html position={[0, 2.8, 4]} center distanceFactor={16}>
        <button
          className="world-label"
          onClick={() => dispatch({ type: "door" })}
        >
          {g.doorOpen ? "Close" : "Open"} bedroom door
        </button>
      </Html>
      {[-3, 3].map((x) => (
        <Block
          key={x}
          p={[x, cut / 2, 10]}
          s={[4, cut, 0.16]}
          c="#b7ad98"
          mat="brick"
        />
      ))}
      <Block p={[0, 3.2, 10]} s={[2, 0.4, 0.16]} c="#b7ad98" />
      {outside && <Block p={[0, 3.65, 3]} s={[10.8, 0.25, 14.8]} c="#58605b" />}
      <Block
        p={[-3.1, 0.45, 6.1]}
        s={[2.7, 0.65, 1.6]}
        c="#7e8a77"
        mat="cotton"
      />
      <Block
        p={[-3.1, 0.9, 5.4]}
        s={[2.7, 0.8, 0.25]}
        c="#7e8a77"
        mat="cotton"
      />
      <Block p={[-1.8, 0.4, 8]} s={[1.7, 0.12, 1]} c="#8c7354" mat="timber" />
      {[-2.4, -1.2].map((x) => (
        <Block key={x} p={[x, 0.2, 8]} s={[0.08, 0.4, 0.7]} c="#554c40" />
      ))}
      <Block p={[4, 0.55, 5.8]} s={[1.5, 1.1, 2.5]} c="#c8c8b9" />
      <Block p={[4, 1.14, 5.8]} s={[1.6, 0.1, 2.6]} c="#b5b4ab" />
      <Block p={[4.1, 1.2, 8.7]} s={[1.1, 2.4, 1]} c="#c5c9c0" />
      <Block
        p={[-4.2, 1.2, 8.7]}
        s={[0.8, 2.4, 1]}
        c="#9d8871"
        mat="timber"
        onClick={() => open("wardrobe")}
      />
      <Html position={[-4.2, 2.7, 8.7]} center distanceFactor={16}>
        <button className="world-label" onClick={() => open("wardrobe")}>
          Wardrobe
        </button>
      </Html>
      <Block
        p={[-0.8, 1.3, 3.88]}
        s={[0.12, 0.18, 0.06]}
        c="#deddd0"
        onClick={() => dispatch({ type: "lights" })}
      />
      <Block p={[0, -0.04, 12.5]} s={[2, 0.12, 5]} c="#bbb8aa" />
      <Block p={[0, -0.07, 18]} s={[110, 0.15, 7]} c="#575d5d" mat="asphalt" />
      {[13.8, 22.2].map((z) => (
        <Block key={z} p={[0, -0.02, z]} s={[110, 0.15, 1.3]} c="#b7b7ac" />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <Block
          key={i}
          p={[-48 + i * 6, 0.012, 18]}
          s={[2.7, 0.012, 0.09]}
          c="#d5cdb0"
        />
      ))}
      {[-18, 18].map((x) => (
        <group key={x}>
          <Block
            p={[x, 1.7, 3]}
            s={[10, 3.4, 14]}
            c={x < 0 ? "#b0a48f" : "#919b93"}
            mat="brick"
          />
          <Block p={[x, 3.65, 3]} s={[10.8, 0.35, 14.8]} c="#515a57" />
          <Block p={[x, 1.3, 10.08]} s={[1.2, 2.6, 0.08]} c="#5d695e" />
          {[-3, 3].map((dx) => (
            <Block
              key={dx}
              p={[x + dx, 2, 10.12]}
              s={[1.8, 1.2, 0.05]}
              c="#6b8991"
            />
          ))}
          <Block p={[x, -0.03, 12.5]} s={[2, 0.1, 5]} c="#a8a79b" />
        </group>
      ))}
      {[-30, -12, 11, 41].map((x, i) => (
        <Tree key={i} x={x} z={i % 2 ? -10 : 11} />
      ))}
      {[-10, 10, 30].map((x) => (
        <group key={x} position={[x, 0, 14]}>
          <Block p={[0, 2, 0]} s={[0.08, 4, 0.08]} c="#5b6260" />
          <Block p={[0.3, 4, 0]} s={[0.7, 0.08, 0.3]} c="#5b6260" />
          {g.time % 240 > 170 && (
            <pointLight
              position={[0.3, 3.9, 0]}
              color="#ffd5a0"
              intensity={6}
              distance={7}
            />
          )}
        </group>
      ))}
      <group position={[8, 0.45, 12]}>
        <Block p={[0, 0, 0]} s={[1.8, 0.6, 3.5]} c="#687c7a" />
        <Block p={[0, 0.6, -0.1]} s={[1.6, 0.6, 1.6]} c="#a5b3af" />
        {[-0.9, 0.9].flatMap((x) =>
          [-1.1, 1.1].map((z) => (
            <mesh
              key={`${x}${z}`}
              position={[x, -0.2, z]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.32, 0.32, 0.17, 12]} />
              <meshStandardMaterial color="#30332f" />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}
