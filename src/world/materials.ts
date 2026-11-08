import * as THREE from "three";
type Surface =
  | "plaster"
  | "timber"
  | "cotton"
  | "concrete"
  | "grass"
  | "asphalt"
  | "brick";
const cache = new Map<
  Surface,
  { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture }
>();
// Original deterministic textures: no runtime CDN or third-party licence dependency.
export function surface(kind: Surface) {
  if (cache.has(kind)) return cache.get(kind)!;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  let seed = 9;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const base = kind === "asphalt" ? 100 : kind === "grass" ? 160 : 210;
  ctx.fillStyle = `rgb(${base},${base},${base})`;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16000; i++) {
    const v = Math.floor(base - 25 + rand() * 50);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    const x = rand() * 256,
      y = rand() * 256;
    ctx.fillRect(
      x,
      y,
      kind === "timber" ? rand() * 30 + 2 : 1,
      kind === "cotton" ? 2 : 1,
    );
  }
  if (kind === "cotton") {
    ctx.strokeStyle = "#ffffff33";
    for (let i = 0; i < 256; i += 3) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
  }
  if (kind === "brick") {
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 3;
    for (let y = 0; y <= 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
      for (let x = ((y / 32) % 2) * 32; x < 256; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 32);
        ctx.stroke();
      }
    }
  }
  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(kind === "grass" ? 12 : 2, kind === "grass" ? 12 : 2);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const bumpMap = map.clone();
  bumpMap.colorSpace = THREE.NoColorSpace;
  const result = { map, bumpMap };
  cache.set(kind, result);
  return result;
}
