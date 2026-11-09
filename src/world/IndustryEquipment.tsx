import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../game/store";
import { industryOf } from "../game/industries";
import { ProductModel } from "./ProductModel";
function Part({
  p,
  s,
  c = "#7d8b7e",
}: {
  p: [number, number, number];
  s: [number, number, number];
  c?: string;
}) {
  return (
    <mesh
      position={p}
      castShadow
      receiveShadow
      userData={{ cameraSolid: true }}
    >
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} metalness={0.35} roughness={0.55} />
    </mesh>
  );
}
export function IndustryEquipment({ garage = false }: { garage?: boolean }) {
  const g = useGame((s) => s.game)!;
  const industry = industryOf(g).id;
  const invalidate = useThree((s) => s.invalidate);
  const paused = useGame(
    (s) =>
      s.paused || !s.playing || ["settings", "saves"].includes(s.panel || ""),
  );
  const arm = useRef<THREE.Group>(null);
  const roller = useRef<THREE.Mesh>(null);
  const job = (g.property === "garage") === garage ? g.jobs[0] : undefined;
  const d = g.designs.find((d) => d.id === job?.designId) || g.designs[0];
  useFrame(({ clock }) => {
    if (paused) return;
    if (
      job &&
      (industry === "streetwear"
        ? !job.kind || job.kind === "print"
        : job.kind !== "contract")
    )
      invalidate();
    if (arm.current)
      arm.current.position.x =
        job?.kind === "prototype" || job?.kind === "inspect"
          ? Math.sin(clock.elapsedTime * 2) * 0.2
          : 0;
    if (arm.current && industry === "streetwear") arm.current.position.x = 0;
    if (arm.current && industry === "streetwear")
      arm.current.rotation.x =
        job && (!job.kind || job.kind === "print")
          ? -Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.2
          : 0;
    if (roller.current && job?.kind === "label")
      roller.current.rotation.x += 0.07;
  });
  return (
    <group>
      {industry === "mtb" ? (
        <>
          <Part p={[0, 0.03, 0]} s={[1.05, 0.08, 0.75]} c="#78878d" />
          {[-0.42, 0.42].map((x) => (
            <Part key={x} p={[x, 0.21, 0]} s={[0.08, 0.38, 0.65]} c="#485d64" />
          ))}
          <group ref={arm}>
            <Part p={[0, 0.43, 0]} s={[1.05, 0.06, 0.09]} c="#c3c8c1" />
            <Part p={[0.2, 0.3, 0]} s={[0.08, 0.26, 0.1]} c="#3b4544" />
          </group>
          <Part p={[0.7, 0.07, 0.1]} s={[0.28, 0.04, 0.4]} c="#c5baa0" />
          {d &&
            (d.prototypeApproved ||
              (d.rawStock || 0) > 0 ||
              d.stock > 0 ||
              job?.kind === "prototype" ||
              job?.kind === "inspect") && (
              <group position={[0, 0.12, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
                <ProductModel design={d} scale={0.25} />
              </group>
            )}
        </>
      ) : industry === "haircare" ? (
        <>
          <Part p={[0, 0.04, 0]} s={[1, 0.08, 0.7]} c="#c2baaa" />
          <Part p={[-0.3, 0.22, 0]} s={[0.12, 0.4, 0.2]} c="#7f8582" />
          <mesh
            ref={roller}
            position={[-0.3, 0.43, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.2, 0.2, 0.25, 20]} />
            <meshStandardMaterial color="#e9e2ce" roughness={0.9} />
          </mesh>
          <Part p={[0.2, 0.08, 0.15]} s={[0.4, 0.03, 0.26]} c="#eee4cc" />
          {d &&
            ((d.rawStock || 0) > 0 || d.stock > 0 || job?.kind === "label") && (
              <group
                position={[0.2, 0.23, 0.15]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <ProductModel design={d} scale={0.2} />
              </group>
            )}
        </>
      ) : (
        <>
          <Part p={[0, 0.05, 0]} s={[1, 0.1, 0.7]} c="#3e5b4b" />
          <Part p={[0, 0.5, -0.3]} s={[0.1, 0.9, 0.1]} />
          <group ref={arm}>
            <Part p={[0, 0.65, 0]} s={[1, 0.1, 0.7]} c="#778b76" />
          </group>
        </>
      )}
      <mesh position={[0.45, 0.15, 0.33]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial
          color={job ? "#badc78" : "#889685"}
          emissive={job ? "#9abf53" : "#000000"}
          emissiveIntensity={0.7}
        />
      </mesh>
    </group>
  );
}
