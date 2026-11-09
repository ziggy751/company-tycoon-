import { workshopSound } from "./workshopSound";
import { handHint } from "./workshop";
import {
  DEFAULT_CONTROLS,
  normalizeControls,
  type ControlSettings,
} from "./controls";
import { GRAPHICS, type Graphics } from "./graphics";
import { create } from "zustand";
import { act, tick, type Action, type Game } from "./simulation";
import { saveGame } from "./save";
type Settings = ControlSettings &
  Graphics & {
    workshopSounds: boolean;
    sensitivity: number;
    volume: number;
    firstPerson: boolean;
    invert: boolean;
  };
type Store = {
  game: Game | null;
  playing: boolean;
  worldEpoch: number;
  panel: string | null;
  interaction: string | null;
  desktopApp: string | null;
  desktopFocused: string | null;
  interact: (expected?: string) => void;
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
  worldEpoch: 0,
  desktopApp: null,
  desktopFocused: null,
  panel: null,
  interaction: null,
  paused: false,
  speed: 1,
  notice: "",
  saveStatus: "Not saved yet",
  settings: {
    ...DEFAULT_CONTROLS,
    ...GRAPHICS.high,
    workshopSounds: false,
    sensitivity: 1,
    volume: 0.15,
    firstPerson: false,
    invert: false,
  },
  setGame: (g) =>
    set((state) => ({
      worldEpoch: state.worldEpoch + 1,
      game: { ...g, companyId: g.companyId || crypto.randomUUID() },
      panel: null,
      interaction: null,
      desktopApp: null,
      desktopFocused: null,
      paused: false,
    })),
  interact: (expected) => {
    const s = get();
    if (
      !s.playing ||
      s.panel ||
      !s.interaction ||
      (expected && expected !== s.interaction)
    )
      return;
    const physical = s.game && handHint(s.game, s.interaction);
    if (physical) {
      s.dispatch(physical.action);
      return;
    }
    if (s.interaction === "door" || s.interaction === "lights")
      s.dispatch({ type: s.interaction });
    else s.open(s.interaction);
  },
  open: (panel) => {
    if (
      panel &&
      ["design", "inventory", "finances", "social", "upgrades"].includes(panel)
    ) {
      if (get().panel === "computer") set({ desktopApp: panel });
      else get().notify("Use the computer at your desk to open business apps.");
      return;
    }
    if (
      get().panel === "computer" &&
      panel &&
      ["settings", "saves"].includes(panel)
    ) {
      set({ desktopApp: panel });
      return;
    }
    const g = get().game;
    if (
      g &&
      g.onboarding?.mode === "active" &&
      (panel === "design" || panel === "computer" || panel === "finances")
    ) {
      set({
        game: act(g, {
          type: "tutorial-event",
          task: panel === "finances" ? "finances" : "computer",
        }),
        panel,
      });
      void get().save();
    } else set({ panel });
  },
  notify: (notice) => set({ notice }),
  configure: (s) => {
    const next = {
      ...get().settings,
      ...(s.quality ? GRAPHICS[s.quality] : {}),
      ...s,
    };
    next.renderScale = Math.max(
      0.75,
      Math.min(2, Number(next.renderScale) || 1),
    );
    set({ settings: { ...next, ...normalizeControls(next) } });
  },
  dispatch: (a) => {
    try {
      const g = get().game;
      if (!g) return false;
      const next = act(g, a);
      if (a.type === "hand" && get().settings.workshopSounds)
        workshopSound(a.command, get().settings.volume);
      set({
        game: next,
        notice: "",
        saveStatus: "Saving…",
        ...(next.property !== g.property
          ? { panel: null, interaction: null, desktopFocused: null }
          : {}),
      });
      void get().save();
      return true;
    } catch (e) {
      set({ notice: (e as Error).message });
      return false;
    }
  },
  step: () => {
    const { game, paused, speed, panel, desktopFocused } = get();
    if (
      game &&
      !paused &&
      !(
        panel === "computer" &&
        ["settings", "saves"].includes(desktopFocused || "")
      ) &&
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
