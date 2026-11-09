export type Quality = "low" | "medium" | "high" | "ultra";
export type Graphics = {
  quality: Quality;
  shadows: boolean;
  renderScale: number;
  antialias: boolean;
  effects: boolean;
  textureQuality: "low" | "high";
};
export const GRAPHICS: Record<Quality, Graphics> = {
  low: {
    quality: "low",
    shadows: false,
    renderScale: 1,
    antialias: false,
    effects: false,
    textureQuality: "low",
  },
  medium: {
    quality: "medium",
    shadows: true,
    renderScale: 1,
    antialias: true,
    effects: false,
    textureQuality: "low",
  },
  high: {
    quality: "high",
    shadows: true,
    renderScale: 1.5,
    antialias: true,
    effects: true,
    textureQuality: "high",
  },
  ultra: {
    quality: "ultra",
    shadows: true,
    renderScale: 2,
    antialias: true,
    effects: true,
    textureQuality: "high",
  },
};
