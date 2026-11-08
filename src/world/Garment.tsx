import { useMemo, useEffect } from "react";
import * as THREE from "three";
import type { Design } from "../game/simulation";
export function Garment({
  design,
  scale = 1,
}: {
  design: Pick<Design, "color" | "ink" | "text" | "fit" | "graphic">;
  scale?: number;
}) {
  const geometry = useMemo(() => {
    const s = new THREE.Shape();
    const w =
      design.fit === "Oversized" ? 0.57 : design.fit === "Boxy" ? 0.53 : 0.44;
    const h = design.fit === "Boxy" ? 0.68 : 0.86;
    s.moveTo(-0.18, 0.7);
    s.quadraticCurveTo(0, 0.54, 0.18, 0.7);
    s.lineTo(w, 0.61);
    s.lineTo(w + 0.34, 0.15);
    s.lineTo(w + 0.12, 0.02);
    s.lineTo(w, 0.29);
    s.lineTo(w, -h);
    s.quadraticCurveTo(0, -h - 0.04, -w, -h);
    s.lineTo(-w, 0.29);
    s.lineTo(-w - 0.12, 0.02);
    s.lineTo(-w - 0.34, 0.15);
    s.lineTo(-w, 0.61);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.065,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.025,
    });
    g.computeVertexNormals();
    return g;
  }, [design.fit]);
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = design.ink;
    ctx.strokeStyle = design.ink;
    if (design.graphic === "orbit") {
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(256, 230, 155, 55, -0.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(256, 230, 65, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (design.graphic !== "none") {
      ctx.font = "900 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        design.text || "INDEPENDENT",
        256,
        design.graphic === "orbit" ? 355 : 225,
        470,
      );
      ctx.font = "16px monospace";
      ctx.fillText(
        "EST. 2026  /  STUDIO EDITION",
        256,
        design.graphic === "orbit" ? 387 : 265,
      );
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [design.text, design.ink, design.graphic]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group scale={scale}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={design.color} roughness={0.94} />
      </mesh>
      <mesh position={[0, -0.04, 0.101]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial
          map={texture}
          transparent
          roughness={0.9}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
