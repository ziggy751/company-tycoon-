import {
  DEFAULT_CONTROLS,
  normalizeControls,
  type ControlSettings,
} from "./controls";
import { create } from "zustand";
import { act, tick, type Action, type Game } from "./simulation";
import { saveGame } from "./save";
type Settings = ControlSettings & {
  quality: "low" | "high";
  sensitivity: number;
  volume: number;
  firstPerson: boolean;
  invert: boolean;
};
type Store = {
  game: Game | null;
  playing: boolean;
  panel: string | null;
  paused: boolean;
  speed: number;
  notice: string;
  saveStatus: string;
  settings: Settings;
  setGame: (g: Game) => void;
  open: (panel: string | null) => void;
  dispatch: (a: Action) => boolean;
  step: () => void;
  save: (slot?: string) => Promise<boolean>;
  notify: (s: string) => void;
  configure: (s: Partial<Settings>) => void;
};
let saveQueue = Promise.resolve();
export const useGame = create<Store>((set, get) => ({
  game: null,
  playing: false,
  panel: null,
  paused: false,
  speed: 1,
  notice: "",
  saveStatus: "Not saved yet",
  settings: {
    ...DEFAULT_CONTROLS,
    quality: "high",
    sensitivity: 1,
    volume: 0.15,
    firstPerson: false,
    invert: false,
  },
  setGame: (g) =>
    set({
      game: { ...g, companyId: g.companyId || crypto.randomUUID() },
      panel: null,
      paused: false,
    }),
  open: (panel) => {
    const g = get().game;
    if (
      g &&
      g.onboarding?.mode === "active" &&
      (panel === "design" || panel === "finances")
    ) {
      set({
        game: act(g, {
          type: "tutorial-event",
          task: panel === "design" ? "computer" : "finances",
        }),
        panel,
      });
      void get().save();
    } else set({ panel });
  },
  notify: (notice) => set({ notice }),
  configure: (s) => {
    const next = { ...get().settings, ...s };
    set({ settings: { ...next, ...normalizeControls(next) } });
  },
  dispatch: (a) => {
    try {
      const g = get().game;
      if (!g) return false;
      set({ game: act(g, a), notice: "", saveStatus: "Saving…" });
      void get().save();
      return true;
    } catch (e) {
      set({ notice: (e as Error).message });
      return false;
    }
  },
  step: () => {
    const { game, paused, speed, panel } = get();
    if (
      game &&
      !paused &&
      panel !== "settings" &&
      panel !== "saves" &&
      panel !== "account"
    ) {
      set({ game: tick(game, speed) });
      if (get().game!.time % 10 === 0) void get().save();
    }
  },
  save: async (slot = "autosave") => {
    const g = get().game;
    if (!g) return false;
    set({ saveStatus: "Saving…" });
    const snapshot = structuredClone(g);
    const operation = (saveQueue = saveQueue
      .catch(() => {})
      .then(() => saveGame(slot, snapshot)));
    try {
      await operation;
      if (operation === saveQueue) set({ saveStatus: "Saved locally" });
      return true;
    } catch (e) {
      if (operation === saveQueue)
        set({
          saveStatus: "Save failed",
          notice: "Could not save: " + (e as Error).message,
        });
      return false;
    }
  },
}));
