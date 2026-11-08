import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
export function PointerRecovery({ enabled }: { enabled: boolean }) {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    const canvas = gl.domElement,
      ids = new Set<number>();
    const down = (e: PointerEvent) => ids.add(e.pointerId);
    const up = (e: PointerEvent) => ids.delete(e.pointerId);
    const cancel = () => {
      for (const id of [...ids]) {
        canvas.dispatchEvent(
          new PointerEvent("pointercancel", {
            pointerId: id,
            pointerType: "mouse",
            bubbles: true,
          }),
        );
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      }
      ids.clear();
      invalidate();
    };
    canvas.addEventListener("pointerdown", down, true);
    canvas.addEventListener("pointerup", up, true);
    canvas.addEventListener("pointercancel", up, true);
    window.addEventListener("blur", cancel);
    if (!enabled) cancel();
    return () => {
      cancel();
      canvas.removeEventListener("pointerdown", down, true);
      canvas.removeEventListener("pointerup", up, true);
      canvas.removeEventListener("pointercancel", up, true);
      window.removeEventListener("blur", cancel);
    };
  }, [gl, invalidate, enabled]);
  return null;
}
