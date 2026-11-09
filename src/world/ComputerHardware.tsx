import { useEffect, useMemo, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useGame } from "../game/store";
export function ComputerHardware() {
  const keys = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < 40; i++)
      keys.current?.setMatrixAt(
        i,
        m.makeTranslation(
          -2.04 + (i % 10) * 0.085,
          1.155,
          -2.6 + Math.floor(i / 10) * 0.061,
        ),
      );
    if (keys.current) {
      keys.current.instanceMatrix.needsUpdate = true;
      keys.current.computeBoundingSphere();
    }
  }, []);
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 640;
    const x = c.getContext("2d")!;
    const sky = x.createLinearGradient(0, 0, 900, 640);
    sky.addColorStop(0, "#15223b");
    sky.addColorStop(0.6, "#544267");
    sky.addColorStop(1, "#b77b86");
    x.fillStyle = sky;
    x.fillRect(0, 0, 1024, 640);
    x.fillStyle = "#141d31";
    x.beginPath();
    x.moveTo(0, 640);
    x.lineTo(0, 500);
    x.lineTo(270, 270);
    x.lineTo(480, 480);
    x.lineTo(710, 190);
    x.lineTo(1024, 500);
    x.lineTo(1024, 640);
    x.fill();
    x.strokeStyle = "#dec9ff";
    x.lineWidth = 5;
    x.beginPath();
    x.moveTo(400, 295);
    x.lineTo(475, 215);
    x.lineTo(520, 260);
    x.lineTo(565, 200);
    x.lineTo(650, 295);
    x.lineTo(400, 295);
    x.stroke();
    x.fillStyle = "#fff";
    x.font = "24px Arial";
    x.textAlign = "center";
    x.fillText("SummitOS", 520, 345);
    for (let i = 0; i < 7; i++) {
      x.fillStyle = ["#9b72df", "#bc9467", "#678da9", "#719e89"][i % 4];
      x.fillRect(35 + (i % 2) * 100, 45 + Math.floor(i / 2) * 100, 50, 50);
    }
    x.fillStyle = "#151929dd";
    x.fillRect(0, 590, 1024, 50);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group onClick={() => useGame.getState().interact("computer")}>
      <mesh
        position={[-1.6, 1.62, -3.04]}
        castShadow
        userData={{ cameraSolid: true }}
      >
        <boxGeometry args={[1.45, 0.88, 0.065]} />
        <meshStandardMaterial color="#1b1c24" roughness={0.38} />
      </mesh>
      <mesh position={[-1.6, 1.62, -3.001]}>
        <planeGeometry args={[1.35, 0.79]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      <mesh position={[-1.6, 1.2, -3.04]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.3, 12]} />
        <meshStandardMaterial color="#7c7e8a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-1.6, 1.13, -2.94]}>
        <boxGeometry args={[0.5, 0.035, 0.3]} />
        <meshStandardMaterial color="#797b86" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[-1.65, 1.13, -2.5]} castShadow>
        <boxGeometry args={[0.9, 0.035, 0.3]} />
        <meshStandardMaterial color="#292b37" />
      </mesh>
      <instancedMesh ref={keys} args={[undefined, undefined, 40]}>
        <boxGeometry args={[0.065, 0.018, 0.044]} />
        <meshStandardMaterial color="#636172" roughness={0.7} />
      </instancedMesh>
      <mesh position={[-0.98, 1.14, -2.48]} scale={[0.085, 0.045, 0.13]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#454351" roughness={0.5} />
      </mesh>
    </group>
  );
}
