import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { useGame } from "../game/store";
import { Garment } from "./Garment";
function Parcel({
  label = false,
  sealed = false,
  text = "COMPANY TYCOON",
}: {
  label?: boolean;
  sealed?: boolean;
  text?: string;
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const x = c.getContext("2d")!;
    x.fillStyle = "#faf6e9";
    x.fillRect(0, 0, 512, 256);
    x.fillStyle = "#1a2233";
    x.font = "bold 28px Arial";
    x.fillText("CUSTOMER COLLECTION", 20, 40);
    x.font = "24px Arial";
    x.fillText(text, 20, 100, 470);
    for (let i = 0; i < 50; i++) {
      if (i % 3) x.fillRect(20 + i * 8, 150, i % 2 ? 3 : 5, 65);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.48, 0.32, 0.36]} />
        <meshStandardMaterial color="#ac8258" roughness={0.9} />
      </mesh>
      {sealed && (
        <mesh position={[0, 0.166, 0]}>
          <boxGeometry args={[0.06, 0.012, 0.36]} />
          <meshStandardMaterial color="#c7a56e" />
        </mesh>
      )}
      {label && (
        <mesh position={[0, 0.163, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.24, 0.18]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      )}
    </group>
  );
}
export function CarriedObject({
  firstPerson = false,
}: {
  firstPerson?: boolean;
}) {
  const g = useGame((s) => s.game)!,
    w = g.workshop,
    c = w?.carry;
  if (!c) return null;
  const d = g.designs.find(
    (d) =>
      d.id ===
      (c.kind === "order"
        ? g.orders.find((o) => o.id === c.id)?.designId
        : c.id),
  );
  return (
    <group position={firstPerson ? [0, -0.18, -0.85] : [0, 0.95, 0.48]}>
      {c.kind === "delivery" || c.kind === "parcel" ? (
        <Parcel
          sealed={c.kind === "parcel"}
          label={c.kind === "parcel"}
          text={`${g.orders.find((o) => o.id === c.id)?.customer || "Materials"} · #${c.id}`}
        />
      ) : d ? (
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Garment design={d} placement={w?.press?.alignment} scale={0.3} />
        </group>
      ) : (
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Garment
            design={{
              color: "#eee9dd",
              ink: "#eee9dd",
              text: "",
              fit: "Regular",
              graphic: "none",
            }}
            scale={0.3}
          />
        </group>
      )}
    </group>
  );
}
export function WorkshopObjects() {
  const g = useGame((s) => s.game)!,
    w = g.workshop;
  if (!w?.enabled) return null;
  const garage = g.property === "garage";
  const [x, z] = garage ? [30, -14] : [1, -0.1];
  const p = w.press,
    d = g.designs.find((d) => d.id === p?.designId);
  const pack = w.packing,
    order = g.orders.find((o) => o.id === pack?.orderId),
    pd = g.designs.find((d) => d.id === order?.designId);
  return (
    <>
      <group position={[x, 0, z - 0.6]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[0.8, 0.07, 0.6]} />
          <meshStandardMaterial color="#657466" />
        </mesh>
        {Array.from({ length: Math.min(5, g.blanks) }, (_, i) => (
          <mesh key={i} position={[0, 0.87 + i * 0.045, 0]}>
            <boxGeometry args={[0.4, 0.04, 0.3]} />
            <meshStandardMaterial color="#eee9dd" roughness={1} />
          </mesh>
        ))}
        {g.designs
          .filter(
            (d) =>
              d.stock +
                g.orders.filter(
                  (o) =>
                    o.designId === d.id &&
                    o.status === "ordered" &&
                    !o.physical,
                ).length >
                0 &&
              (!d.kind || d.kind === "shirt"),
          )
          .slice(0, 3)
          .map((d, i) => (
            <group
              key={d.id}
              position={[0.1, 0.9 + i * 0.08, 0.1]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <Garment design={d} scale={0.2} />
            </group>
          ))}
      </group>
      {p && d && w.carry?.kind !== "printed" && (
        <group
          position={garage ? [27, 1.22, -17] : [3.3, 1.22, -2.6]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <Garment
            design={
              p.stage === "blank" ? { ...d, text: "", graphic: "none" } : d
            }
            placement={p.alignment}
            scale={0.4}
          />
        </group>
      )}
      {pack && (
        <group position={garage ? [33, 1.15, -12] : [3.8, 1.15, 2.3]}>
          {pack.stage === "product" && pd ? (
            <group rotation={[-Math.PI / 2, 0, 0]}>
              <Garment design={pd} scale={0.3} />
            </group>
          ) : (
            <Parcel
              sealed={pack.stage === "sealed"}
              text={`${order?.customer} · #${order?.id}`}
              label={pack.stage === "labelled" || pack.stage === "sealed"}
            />
          )}
        </group>
      )}
      {g.orders
        .filter((o) => o.physical && o.status === "shipping")
        .slice(0, 4)
        .map((o, i) => (
          <group
            key={o.id}
            position={
              garage ? [30 + i * 0.5, 0.2, -8] : [-1.4 - i * 0.5, 0.2, 11]
            }
          >
            <Parcel sealed label text={`${o.customer} · #${o.id}`} />
          </group>
        ))}
    </>
  );
}

export function FirstPersonCarry() {
  const group = useRef<THREE.Group>(null),
    { camera } = useThree();
  const enabled = useGame(
      (s) => s.settings.firstPerson && !!s.game?.workshop?.carry,
    ),
    skin = useGame((s) => s.game!.founder);
  useFrame(() => {
    if (group.current) {
      group.current.position.copy(camera.position);
      group.current.quaternion.copy(camera.quaternion);
    }
  });
  if (!enabled) return null;
  return (
    <group ref={group}>
      <CarriedObject firstPerson />
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.27, -0.29, -0.75]}
          rotation={[1.1, 0, 0]}
        >
          <capsuleGeometry args={[0.055, 0.18, 4, 8]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      ))}
    </group>
  );
}
