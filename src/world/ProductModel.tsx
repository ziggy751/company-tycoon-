import { useMemo, useEffect } from "react";
import * as THREE from "three";
import type { Design } from "../game/simulation";
import { CatalogueModel } from "./CatalogueModels";
import { Garment } from "./Garment";
function Branding({ d }: { d: Pick<Design, "text" | "ink"> }) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const x = c.getContext("2d")!;
    x.fillStyle = "#eee9d7";
    x.fillRect(0, 0, 512, 256);
    x.fillStyle = d.ink;
    x.textAlign = "center";
    x.font = "bold 50px Arial";
    x.fillText(d.text, 256, 120, 470);
    x.font = "20px monospace";
    x.fillText("INDEPENDENT / STUDIO EDITION", 256, 180);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [d.text, d.ink]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0, -0.65, 0.13]}>
      <planeGeometry args={[1.35, 0.65]} />
      <meshStandardMaterial map={texture} roughness={0.9} />
    </mesh>
  );
}
export function ProductModel({
  design: d,
  scale = 1,
}: {
  design: Pick<Design, "kind" | "color" | "ink" | "text" | "fit" | "graphic">;
  scale?: number;
}) {
  const guard = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.16, -0.85);
    shape.lineTo(0.16, -0.85);
    shape.lineTo(0.4, 0.3);
    shape.quadraticCurveTo(0.65, 1, 0, 1.1);
    shape.quadraticCurveTo(-0.65, 1, -0.4, 0.3);
    shape.closePath();
    for (const x of [-0.22, 0.22]) {
      const hole = new THREE.Path();
      hole.absellipse(x, 0.3, 0.035, 0.1, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 2,
      steps: 1,
    });
  }, []);
  useEffect(() => () => guard.dispose(), [guard]);
  if (!d.kind || d.kind === "shirt")
    return <Garment design={d} scale={scale} />;
  return (
    <group scale={scale}>
      {d.kind === "frame-kit" && (
        <>
          {[-0.55, 0, 0.55].map((x, i) => (
            <mesh
              key={x}
              position={[x, i === 1 ? 0.1 : 0, 0]}
              rotation={[0, 0, i === 1 ? 0 : 0.1]}
              castShadow
            >
              <capsuleGeometry args={[0.15, i === 1 ? 1.5 : 1.05, 6, 16]} />
              <meshStandardMaterial
                color={d.color}
                metalness={0.05}
                roughness={0.45}
              />
            </mesh>
          ))}
        </>
      )}
      {d.kind === "mudguard" && (
        <mesh geometry={guard} castShadow>
          <meshStandardMaterial
            color={d.color}
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {d.kind === "comb" && (
        <group position={[0, 0.2, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[1.8, 0.23, 0.14]} />
            <meshStandardMaterial color={d.color} roughness={0.3} />
          </mesh>
          {Array.from({ length: 19 }, (_, i) => (
            <mesh key={i} position={[-0.85 + i * 0.095, 0.03, 0]} castShadow>
              <capsuleGeometry args={[0.025, 0.43, 3, 6]} />
              <meshStandardMaterial color={d.color} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}
      {d.kind === "claw-clip" && (
        <group rotation={[0.25, -0.25, 0]}>
          {[-1, 1].map((side) => (
            <group
              key={side}
              position={[0, 0.1, side * 0.15]}
              rotation={[side * 0.35, 0, 0]}
            >
              <mesh rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.5, 0.12, 10, 24, Math.PI]} />
                <meshStandardMaterial color={d.color} roughness={0.25} />
              </mesh>
              {Array.from({ length: 8 }, (_, i) => (
                <mesh
                  key={i}
                  position={[-0.6 + i * 0.17, -0.12, 0]}
                  rotation={[0.3 * side, 0, 0]}
                  castShadow
                >
                  <capsuleGeometry args={[0.045, 0.55, 4, 8]} />
                  <meshStandardMaterial color={d.color} roughness={0.25} />
                </mesh>
              ))}
            </group>
          ))}
          <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 1.35, 16]} />
            <meshStandardMaterial
              color="#b1a794"
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        </group>
      )}
      {!["frame-kit","mudguard","comb","claw-clip"].includes(d.kind!) && <CatalogueModel d={d}/>}
      <Branding d={d} />
    </group>
  );
}
