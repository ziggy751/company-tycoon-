import { PointerRecovery } from "./PointerRecovery";
import { LoadedChair } from "./LoadedChair";
import { industryOf } from "../game/industries";
import { IndustryEquipment } from "./IndustryEquipment";
import { Garage } from "./Garage";
import { editing } from "../game/controls";
import { CameraCollision } from "./CameraCollision";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  RoundedBox,
  Html,
  ContactShadows,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useGame } from "../game/store";
import { surface } from "./materials";
import { movePlayer } from "./navigation";
import { Neighbourhood } from "./Neighbourhood";
import { Garment } from "./Garment";
const wood = "#84654a",
  steel = "#303833";
function Box({
  p,
  s,
  c = wood,
  ...props
}: {
  p: [number, number, number];
  s: [number, number, number];
  c?: string;
  rotation?: [number, number, number];
  onClick?: () => void;
}) {
  return (
    <RoundedBox
      position={p}
      args={s}
      radius={Math.min(0.035, ...s.map((n) => n * 0.25))}
      smoothness={2}
      castShadow
      receiveShadow
      userData={{ cameraSolid: true }}
      {...props}
    >
      <meshStandardMaterial
        color={c}
        {...surface(c === wood ? "timber" : "plaster")}
        bumpScale={0.018}
        roughness={0.8}
      />
    </RoundedBox>
  );
}
function Label({
  at,
  children,
  onClick,
}: {
  at: [number, number, number];
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Html position={at} center distanceFactor={13} zIndexRange={[10, 0]}>
      <button className="world-label" onClick={onClick}>
        {children}
        <span>↗</span>
      </button>
    </Html>
  );
}
function Legs({
  x,
  z,
  w,
  d,
  h = 1,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  h?: number;
}) {
  return (
    <>
      {[-1, 1].flatMap((a) =>
        [-1, 1].map((b) => (
          <Box
            key={`${a}${b}`}
            p={[x + a * (w / 2 - 0.1), h / 2, z + b * (d / 2 - 0.1)]}
            s={[0.06, h, 0.06]}
            c={steel}
          />
        )),
      )}
    </>
  );
}
function Press() {
  const moving = useRef<THREE.Group>(null);
  const busy = useGame(
    (s) => !!s.game?.jobs.length && s.game.property !== "garage",
  );
  const invalidate = useThree((s) => s.invalidate);
  const paused = useGame(
    (s) =>
      s.paused || !s.playing || ["settings", "saves"].includes(s.panel || ""),
  );
  useFrame(({ clock }) => {
    if (paused) return;
    if (busy) invalidate();
    if (moving.current)
      moving.current.rotation.x = busy
        ? Math.sin(clock.elapsedTime * 2) * 0.13
        : 0.5;
  });
  return (
    <group position={[3.3, 1.08, -2.6]}>
      <Box p={[0, 0.07, 0]} s={[0.85, 0.12, 0.7]} c="#26332f" />
      <Box p={[0, 0.3, -0.3]} s={[0.15, 0.6, 0.15]} c="#a7aaa0" />
      <group ref={moving} position={[0, 0.55, -0.3]}>
        <Box p={[0, 0, 0.3]} s={[0.85, 0.09, 0.7]} c="#5c7464" />
        <Box p={[0, 0.15, 0.55]} s={[0.5, 0.07, 0.07]} c="#171d19" />
      </group>
      <mesh position={[0.36, 0.14, 0.32]}>
        <sphereGeometry args={[0.028]} />
        <meshStandardMaterial
          color={busy ? "#d9ed91" : "#f0a374"}
          emissive={busy ? "#d9ed91" : "#542216"}
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}
function Founder() {
  const ref = useRef<THREE.Group>(null);
  const legs = useRef<THREE.Group>(null);
  const keys = useRef(new Set<string>());
  const walk = useRef(0);
  const travelled = useRef(0);
  const lastMotion = useRef(performance.now());
  const settings = useGame((s) => s.settings);
  const { camera, controls, gl, invalidate } = useThree();
  useEffect(
    () =>
      useGame.subscribe((state, previous) => {
        if (
          (state.panel !== previous.panel && state.panel) ||
          (state.playing !== previous.playing && !state.playing)
        ) {
          keys.current.clear();
          lastMotion.current = performance.now();
          invalidate();
        }
      }),
    [invalidate],
  );
  const look = useRef({ yaw: 0, pitch: 0 });
  useEffect(() => {
    if (!settings.firstPerson) return;
    const canvas = gl.domElement;
    let point: { x: number; y: number; id: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.button !== 2) return;
      point = { x: e.clientX, y: e.clientY, id: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!point) return;
      const sensitivity = useGame.getState().settings.sensitivity * 0.004;
      look.current.yaw -= (e.clientX - point.x) * sensitivity;
      look.current.pitch = THREE.MathUtils.clamp(
        look.current.pitch -
          (e.clientY - point.y) *
            sensitivity *
            (useGame.getState().settings.invert ? -1 : 1),
        -1.35,
        1.35,
      );
      invalidate();
      point.x = e.clientX;
      point.y = e.clientY;
    };
    const up = () => {
      if (point && canvas.hasPointerCapture(point.id))
        canvas.releasePointerCapture(point.id);
      point = null;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    window.addEventListener("blur", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", up);
    };
  }, [gl, settings.firstPerson]);
  const outfit = useGame((s) =>
    s.game!.designs.find((d) => d.id === s.game!.equipped),
  );

  const position = useRef(
    new THREE.Vector3(
      ...([
        useGame.getState().game?.player[0] ?? 0,
        0,
        useGame.getState().game?.player[1] ?? 2,
      ] as [number, number, number]),
    ),
  );
  useEffect(() => {
    const p = position.current;
    camera.position.set(p.x + 10, 13, p.z + 12);
    const orbit = controls as unknown as { target: THREE.Vector3 } | null;
    orbit?.target.set(p.x, 0.9, p.z);
  }, [camera, controls]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (editing(e.target) || useGame.getState().panel) return;
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        (e.repeat && e.code === useGame.getState().settings.keys.interact)
      )
        return;
      if (!useGame.getState().playing) return;
      if (keys.current.size === 0) lastMotion.current = performance.now();
      keys.current.add(e.code);
      invalidate();
      if (["Space", "ArrowUp", "ArrowDown"].includes(e.code))
        e.preventDefault();
      if (e.code === useGame.getState().settings.keys.interact) {
        const p = position.current;
        const stations: [number, number, string][] = [
          [-1.6, -2, "design"],
          [
            27,
            -16,
            useGame.getState().game?.property === "garage"
              ? "production"
              : "upgrades",
          ],
          [
            33,
            -12,
            useGame.getState().game?.property === "garage"
              ? "orders"
              : "upgrades",
          ],
          [-4.2, 8, "wardrobe"],
          [0, 3, "door"],
          [3.3, -1.6, "production"],
          [3.5, 1.4, "orders"],
        ];
        const near = stations
          .filter(([x, z]) => Math.hypot(p.x - x, p.z - z) < 2)
          .sort(
            (a, b) =>
              Math.hypot(p.x - a[0], p.z - a[1]) -
              Math.hypot(p.x - b[0], p.z - b[1]),
          )[0];
        if (near?.[2] === "door") useGame.getState().dispatch({ type: "door" });
        else if (near) useGame.getState().open(near[2]);
        else
          useGame
            .getState()
            .notify(
              "Walk closer to a workstation or open its tool from the dock.",
            );
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
      invalidate();
    };
    const blur = () => {
      keys.current.clear();
      invalidate();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const now = performance.now();
    const movementDelta = Math.min(
      Math.max((now - lastMotion.current) / 1000, 0),
      5,
    );
    lastMotion.current = now;
    const k = keys.current;
    const st = useGame.getState();
    const canMove = st.playing && !st.panel && !st.paused;
    let dx = canMove
      ? Number(k.has(settings.keys.right)) - Number(k.has(settings.keys.left))
      : 0;
    let dz = canMove
      ? Number(k.has(settings.keys.back)) - Number(k.has(settings.keys.forward))
      : 0;
    const moving = !!(dx || dz);
    if (moving || (canMove && k.has(settings.keys.jump))) invalidate();
    if (moving) {
      const n = Math.hypot(dx, dz);
      const speed =
        (k.has(settings.keys.sprint) ? 3.6 : 2.1) *
        settings.movementSensitivity *
        movementDelta;
      dx = (dx / n) * speed;
      dz = (dz / n) * speed;
      if (settings.firstPerson) {
        const x = dx,
          z = dz;
        dx = x * Math.cos(look.current.yaw) - z * Math.sin(look.current.yaw);
        dz = x * Math.sin(look.current.yaw) + z * Math.cos(look.current.yaw);
      }
      const p = position.current;
      const previous = p.clone();
      const next = movePlayer([p.x, p.z], dx, dz, !!st.game?.doorOpen);
      p.x = next[0];
      p.z = next[1];
      if (!settings.firstPerson) {
        const offset = p.clone().sub(previous);
        camera.position.add(offset);
        const orbit = controls as unknown as { target: THREE.Vector3 } | null;
        orbit?.target.add(offset);
      }
      ref.current.rotation.y = Math.atan2(dx, dz);
      walk.current += delta * 9;
      if (st.game) {
        st.game.player = [p.x, p.z];
        travelled.current += p.distanceTo(previous);
        if (
          travelled.current >= 2 &&
          st.game.onboarding?.mode === "active" &&
          !st.game.onboarding.tasks.includes("move")
        )
          st.dispatch({ type: "tutorial-event", task: "move" });
      }
    }
    const jump =
      canMove && k.has(settings.keys.jump)
        ? Math.abs(Math.sin(walk.current + performance.now() / 250)) * 0.28
        : 0;
    ref.current.position.copy(position.current);
    ref.current.position.y =
      jump + (moving ? Math.sin(walk.current * 2) * 0.025 : 0);
    if (legs.current) {
      legs.current.children[0].rotation.x = moving
        ? Math.sin(walk.current) * 0.4
        : 0;
      legs.current.children[1].rotation.x = moving
        ? -Math.sin(walk.current) * 0.4
        : 0;
    }
    ref.current.visible =
      !settings.firstPerson &&
      camera.position.distanceTo(
        position.current.clone().add(new THREE.Vector3(0, 1.3, 0)),
      ) > 0.8;
    if (settings.firstPerson) {
      camera.position.lerp(
        position.current.clone().add(new THREE.Vector3(0, 1.55, 0.1)),
        0.2,
      );
      const eye = position.current.clone().add(new THREE.Vector3(0, 1.55, 0.1));
      const target = eye
        .clone()
        .add(
          new THREE.Vector3(
            Math.sin(look.current.yaw) * Math.cos(look.current.pitch),
            Math.sin(look.current.pitch),
            -Math.cos(look.current.yaw) * Math.cos(look.current.pitch),
          ),
        );
      const matrix = new THREE.Matrix4().lookAt(
        camera.position,
        target,
        new THREE.Vector3(0, 1, 0),
      );
      camera.quaternion.slerp(
        new THREE.Quaternion().setFromRotationMatrix(matrix),
        1 - Math.exp(-15 * delta),
      );
      if (
        camera.quaternion.angleTo(
          new THREE.Quaternion().setFromRotationMatrix(matrix),
        ) > 0.002
      )
        invalidate();
    }
  });
  return (
    <group ref={ref}>
      <group ref={legs}>
        {[-0.14, 0.14].map((x) => (
          <group key={x} position={[x, 0.65, 0]}>
            <mesh position={[0, -0.25, 0]} castShadow>
              <capsuleGeometry args={[0.105, 0.42, 4, 8]} />
              <meshStandardMaterial color="#343635" />
            </mesh>
            <Box p={[0, -0.56, 0.06]} s={[0.2, 0.12, 0.35]} c="#e1dfd2" />
          </group>
        ))}
      </group>
      {outfit ? (
        <group position={[0, 1.1, 0]}>
          <Garment design={outfit} scale={0.44} />
        </group>
      ) : (
        <mesh position={[0, 1, 0]} castShadow>
          <capsuleGeometry args={[0.24, 0.37, 6, 12]} />
          <meshStandardMaterial
            color="#394d40"
            {...surface("cotton")}
            bumpScale={0.008}
          />
        </mesh>
      )}
      {[-1, 1].map((x) => (
        <mesh
          key={x}
          position={[x * 0.31, 0.96, 0]}
          rotation={[0, 0, x * 0.12]}
          castShadow
        >
          <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
          <meshStandardMaterial
            color={outfit?.color || "#394d40"}
            {...surface("cotton")}
            bumpScale={0.008}
          />
        </mesh>
      ))}
      <mesh position={[0, 1.52, 0]} castShadow>
        <sphereGeometry args={[0.17, 16, 12]} />
        <meshStandardMaterial color={useGame((s) => s.game!.founder)} />
      </mesh>
      <mesh position={[0, 1.62, -0.025]}>
        <sphereGeometry
          args={[0.174, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]}
        />
        <meshStandardMaterial color="#211f1b" />
      </mesh>
    </group>
  );
}

function FloorFinish() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;
    const ctx = c.getContext("2d")!;
    let seed = 31;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let p = 0; p < 20; p++) {
      const x = p * 51.2;
      const v = Math.floor(random() * 12);
      ctx.fillStyle = `rgb(${159 + v},${143 + v},${117 + v})`;
      ctx.fillRect(x, 0, 51.2, 1024);
      ctx.fillStyle = "#685b4933";
      ctx.fillRect(x, 0, 1.5, 1024);
      for (let i = 0; i < 110; i++) {
        ctx.strokeStyle = random() > 0.5 ? "#352c1510" : "#ffffe912";
        ctx.lineWidth = random() * 0.8 + 0.3;
        const gx = x + random() * 50;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(
          gx + random() * 6,
          300,
          gx - random() * 6,
          650,
          gx,
          1024,
        );
        ctx.stroke();
      }
      ctx.fillStyle = "#66554433";
      const z = random() * 1024;
      ctx.fillRect(x, z, 51, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.012, 0]}
      receiveShadow
    >
      <planeGeometry args={[9.9, 7.9]} />
      <meshStandardMaterial map={texture} roughness={0.85} />
    </mesh>
  );
}
function StudioDetails() {
  const art = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 640;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#c3bd9e";
    ctx.fillRect(0, 0, 512, 640);
    ctx.fillStyle = "#314437";
    ctx.font = "bold 72px Arial";
    ["MAKE", "SOMETHING", "MATTER."].forEach((t, i) =>
      ctx.fillText(t, 30, 160 + i * 90, 455),
    );
    ctx.fillRect(30, 520, 450, 3);
    ctx.font = "18px monospace";
    ctx.fillText("INDEPENDENT STUDIO / 001", 30, 560);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => art.dispose(), [art]);
  return (
    <>
      <Box p={[1.5, 2.45, -3.87]} s={[1.12, 1.45, 0.05]} c="#414a3b" />
      <mesh position={[1.5, 2.45, -3.835]}>
        <planeGeometry args={[1.02, 1.35]} />
        <meshStandardMaterial map={art} roughness={1} />
      </mesh>
      <mesh position={[-0.5, 1.2, -2.7]} castShadow>
        <cylinderGeometry args={[0.075, 0.065, 0.18, 20]} />
        <meshStandardMaterial color="#e5dfca" />
      </mesh>
      <Box p={[-2.4, 1.15, -2.7]} s={[0.3, 0.025, 0.42]} c="#d0c9b4" />
      <group position={[-4.4, 0, -3.3]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.16, 0.4, 12]} />
          <meshStandardMaterial color="#a0876b" />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} rotation={[0.25, i * 0.9, 0.3]} position={[0, 0.3, 0]}>
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.014, 0.02, 1, 6]} />
              <meshStandardMaterial color="#566841" />
            </mesh>
            <mesh
              position={[0.1, 0.8, 0]}
              rotation={[0, 0, -0.5]}
              scale={[0.12, 0.3, 0.035]}
              castShadow
            >
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color={i % 2 ? "#5b6d46" : "#6d7b50"} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

function Room() {
  const game = useGame((s) => s.game)!;
  const night = game.time % 240 > 170;
  const open = useGame((s) => s.open);
  return (
    <>
      <color attach="background" args={["#c4c7bd"]} />
      <fog attach="fog" args={["#c4c7bd", 28, 60]} />
      <ambientLight intensity={night ? 0.16 : 0.35} />
      <hemisphereLight
        args={[night ? "#7a8daf" : "#f4f1d8", "#686958", night ? 0.3 : 0.8]}
      />
      <directionalLight
        position={[-3, 9, 4]}
        intensity={night ? 0.2 : 2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.001}
      />
      <Box p={[0, -0.15, 0]} s={[10, 0.3, 8]} c="#a4977e" />
      <FloorFinish />
      <Box p={[0, 1.8, -4]} s={[10, 3.6, 0.16]} c={game.wall} />
      <Box p={[-5, 1.8, 0]} s={[0.16, 3.6, 8]} c="#c8c3b4" />
      <Box p={[0, 0.12, -3.87]} s={[9.8, 0.2, 0.05]} c="#d1cbbb" />
      <Box p={[-4.88, 0.12, 0]} s={[0.05, 0.2, 8]} c="#d1cbbb" />
      <Box p={[-4.86, 2.1, -0.6]} s={[0.03, 1.9, 2.9]} c="#8b9a94" />
      {[-1, 0, 1].map((i) => (
        <Box
          key={i}
          p={[-4.81, 2.1, -0.6 + i * 0.9]}
          s={[0.04, 1.8, 0.03]}
          c="#d4d4c7"
        />
      ))}
      <Box p={[-4.8, 2.1, -0.6]} s={[0.04, 0.03, 2.8]} c="#d4d4c7" />
      <Box p={[-4.72, 1.12, -0.6]} s={[0.35, 0.1, 3.15]} c="#e2decc" />
      <Box p={[-2.9, 0.3, 0.1]} s={[1.8, 0.6, 3]} c="#655d4d" />
      <Box p={[-2.9, 0.65, 0.1]} s={[1.85, 0.24, 3.05]} c="#d4c7ab" />
      <Box p={[-2.9, 0.83, 0.55]} s={[1.9, 0.18, 2]} c="#89927b" />
      <Box p={[-2.9, 0.88, -0.9]} s={[1.15, 0.22, 0.56]} c="#e6e0cb" />
      <Box p={[-1.5, 1.05, -2.8]} s={[2.8, 0.12, 1.1]} />
      <Legs x={-1.5} z={-2.8} w={2.8} d={1.1} />
      <group onClick={() => open("design")}>
        <Box p={[-1.6, 1.16, -2.7]} s={[0.9, 0.04, 0.57]} c="#a8aea4" />
        <Box p={[-1.6, 1.51, -2.98]} s={[0.9, 0.66, 0.045]} c="#252b27" />
        <Box p={[-1.6, 1.52, -2.948]} s={[0.82, 0.56, 0.012]} c="#d9ed91" />
      </group>
      {useGame.getState().settings.quality === "high" ? (
        <Suspense
          fallback={
            <>
              {" "}
              <Box p={[-1.4, 0.58, -1.7]} s={[0.65, 0.12, 0.65]} c="#3f4b40" />
              <Box p={[-1.4, 0.95, -1.4]} s={[0.65, 0.65, 0.08]} c="#3f4b40" />
              <Legs x={-1.4} z={-1.7} w={0.6} d={0.6} h={0.55} />
            </>
          }
        >
          <LoadedChair />
        </Suspense>
      ) : (
        <>
          {" "}
          <Box p={[-1.4, 0.58, -1.7]} s={[0.65, 0.12, 0.65]} c="#3f4b40" />
          <Box p={[-1.4, 0.95, -1.4]} s={[0.65, 0.65, 0.08]} c="#3f4b40" />
          <Legs x={-1.4} z={-1.7} w={0.6} d={0.6} h={0.55} />
        </>
      )}
      <Box p={[3.3, 1, -2.6]} s={[2.1, 0.14, 1.3]} />
      <Legs x={3.3} z={-2.6} w={2.1} d={1.3} />
      {industryOf(game).id === "streetwear" ? (
        <Press />
      ) : (
        <group position={[3.3, 1.08, -2.6]}>
          <IndustryEquipment />
        </group>
      )}
      <Box p={[3.8, 0.95, 2.3]} s={[1.65, 0.12, 1.6]} />
      <Legs x={3.8} z={2.3} w={1.65} d={1.6} h={0.9} />
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          p={[3.6, 1.12 + i * 0.08, 2.2]}
          s={[0.7, 0.07, 0.5]}
          c="#c2a67c"
        />
      ))}
      <Box p={[4.3, 1.08, 2]} s={[0.2, 0.2, 0.3]} c="#303a30" />
      <group
        position={[0.8, 0, -3.2]}
        visible={industryOf(game).id === "streetwear"}
      >
        {[-0.7, 0.7].map((x) => (
          <Box key={x} p={[x, 1.1, 0]} s={[0.04, 2.2, 0.04]} c={steel} />
        ))}
        <Box p={[0, 2.18, 0]} s={[1.45, 0.04, 0.04]} c={steel} />
        {game.designs
          .filter((d) => !d.kind || d.kind === "shirt")
          .slice(0, 3)
          .map((d, i) => (
            <group key={d.id} position={[-0.45 + i * 0.45, 1.68, 0]}>
              <Garment design={d} scale={0.4} />
            </group>
          ))}
      </group>
      {Array.from({ length: Math.min(game.blanks, 5) }, (_, i) => (
        <Box
          key={i}
          p={[2.7, 1.15 + i * 0.045, -2.3]}
          s={[0.43, 0.04, 0.36]}
          c="#dfdccd"
        />
      ))}
      <Box p={[-3.8, 0.38, 2.65]} s={[0.6, 0.76, 0.6]} c="#9b8570" />
      <mesh position={[-3.8, 1.16, 2.65]}>
        <cylinderGeometry args={[0.29, 0.14, 0.5, 20]} />
        <meshStandardMaterial color="#e7ddc2" />
      </mesh>
      <pointLight position={[-3.8, 1.2, 2.65]} color="#ffd6a0" intensity={2} />
      <Box p={[0.4, 0.025, 1.3]} s={[3.4, 0.025, 2.3]} c="#8c8e77" />
      {game.upgrades.includes("storage") && (
        <group position={[4.4, 0, -0.2]}>
          {[0.2, 1, 1.8].map((y) => (
            <Box key={y} p={[0, y, 0]} s={[0.8, 0.08, 1.4]} c={steel} />
          ))}
          {[-0.55, 0.55].map((z) => (
            <Box key={z} p={[0, 1, z]} s={[0.05, 2, 0.05]} c={steel} />
          ))}
        </group>
      )}
      <Label at={[-1.6, 2.45, -2.8]} onClick={() => open("design")}>
        Design studio
      </Label>
      <Label at={[3.3, 2.2, -2.6]} onClick={() => open("production")}>
        {industryOf(game).equipment} {game.jobs.length ? "· working" : ""}
      </Label>
      <Label at={[3.6, 1.85, 2.3]} onClick={() => open("orders")}>
        Packing station
      </Label>
      <Neighbourhood />
      <Garage />
      {game.waypoint && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[game.waypoint[0], 0.04, game.waypoint[1]]}
        >
          <ringGeometry args={[0.5, 0.65, 32]} />
          <meshBasicMaterial color="#e6be52" side={THREE.DoubleSide} />
        </mesh>
      )}
      {game.lightsOn !== false && (
        <pointLight
          position={[0, 3, 1]}
          intensity={night ? 18 : 5}
          color="#ffe2b5"
          distance={12}
        />
      )}
      <StudioDetails />
      <Founder
        key={(game.companyId || "legacy") + ":" + (game.property || "home")}
      />
      {useGame.getState().settings.quality === "high" && (
        <ContactShadows
          position={[0, 0.02, 0]}
          opacity={0.28}
          scale={16}
          blur={2}
          far={4}
          resolution={256}
        />
      )}
    </>
  );
}
export function World() {
  const enabled = useGame((s) => s.playing && !s.panel);
  const settings = useGame((s) => s.settings);
  const [failed, setFailed] = useState(false);
  return (
    <div className="world">
      {failed ? (
        <div className="world-fallback">
          3D rendering is unavailable on this device. You can still run your
          business using the workstation tabs.
        </div>
      ) : (
        <Canvas
          frameloop="demand"
          shadows={settings.quality === "high"}
          dpr={settings.quality === "high" ? [1, 1.75] : 1}
          camera={{ position: [10, 13, 14], fov: 43 }}
          gl={{
            antialias: settings.quality === "high",
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.domElement.addEventListener("webglcontextlost", () =>
              setFailed(true),
            );
          }}
        >
          <Suspense fallback={null}>
            <Room />
          </Suspense>
          {!settings.firstPerson && (
            <OrbitControls
              makeDefault
              enabled={enabled}
              target={[0, 0.6, 0]}
              minDistance={0.3}
              maxDistance={28}
              maxPolarAngle={Math.PI / 2.15}
              minPolarAngle={0.25}
              enablePan={false}
              enableDamping
              dampingFactor={settings.damping}
              zoomSpeed={settings.zoomSensitivity}
              onStart={() => useGame.getState().notify("")}
              rotateSpeed={settings.sensitivity * (settings.invert ? -1 : 1)}
              mouseButtons={{
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: undefined as unknown as THREE.MOUSE,
                RIGHT: THREE.MOUSE.ROTATE,
              }}
            />
          )}
          {!settings.firstPerson && <CameraCollision />}
          <PointerRecovery enabled={enabled} />
        </Canvas>
      )}
    </div>
  );
}
