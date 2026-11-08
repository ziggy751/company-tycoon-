export const DEFAULT_KEYS = {
  forward: "KeyW",
  back: "KeyS",
  left: "KeyA",
  right: "KeyD",
  sprint: "ShiftLeft",
  jump: "Space",
  interact: "KeyE",
  phone: "Tab",
  inventory: "KeyI",
  workspace: "KeyB",
  map: "KeyM",
};
export type Binding = keyof typeof DEFAULT_KEYS;
export type ControlSettings = {
  keys: typeof DEFAULT_KEYS;
  inputMode: "trackpad" | "mouse";
  zoomSensitivity: number;
  damping: number;
  movementSensitivity: number;
};
export const DEFAULT_CONTROLS: ControlSettings = {
  keys: { ...DEFAULT_KEYS },
  inputMode: "trackpad",
  zoomSensitivity: 0.6,
  damping: 0.12,
  movementSensitivity: 1,
};
export function assignKey(
  keys: typeof DEFAULT_KEYS,
  action: Binding,
  code: string,
) {
  if (
    code === "Escape" ||
    [
      "MetaLeft",
      "MetaRight",
      "ControlLeft",
      "ControlRight",
      "AltLeft",
      "AltRight",
    ].includes(code)
  )
    throw new Error("Escape and system modifier keys are reserved.");
  if (Object.entries(keys).some(([a, k]) => a !== action && k === code))
    throw new Error("That key is already assigned.");
  return { ...keys, [action]: code };
}
export function editing(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    !!target.closest("input,textarea,select,[contenteditable=true]")
  );
}
export function normalizeControls(
  value: Partial<ControlSettings>,
): ControlSettings {
  const bound = (v: unknown, min: number, max: number, def: number) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.min(max, Math.max(min, v))
      : def;
  const keys = { ...DEFAULT_KEYS, ...value.keys };
  if (
    Object.values(keys).some(
      (k) =>
        typeof k !== "string" ||
        !/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Tab|Shift(Left|Right)|Enter|Backspace)$/.test(
          k,
        ),
    ) ||
    new Set(Object.values(keys)).size !== Object.keys(keys).length
  )
    return { ...DEFAULT_CONTROLS };
  return {
    keys,
    inputMode: value.inputMode === "mouse" ? "mouse" : "trackpad",
    zoomSensitivity: bound(value.zoomSensitivity, 0.1, 2, 0.6),
    damping: bound(value.damping, 0.05, 0.3, 0.12),
    movementSensitivity: bound(value.movementSensitivity, 0.5, 1.5, 1),
  };
}
