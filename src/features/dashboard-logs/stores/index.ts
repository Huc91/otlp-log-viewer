import { create } from "zustand";

export type DisplayMode = "flat" | "grouped";

interface DisplayModeState {
  displayMode: DisplayMode;
  toggleDisplayMode: () => void;
}

export const useDisplayModeStore = create<DisplayModeState>()((set) => ({
  displayMode: "flat",
  toggleDisplayMode: () =>
    set((state) => ({
      displayMode: state.displayMode === "flat" ? "grouped" : "flat",
    })),
}));
