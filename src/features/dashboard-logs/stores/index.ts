import { create } from "zustand";

export type DisplayMode = "flat" | "grouped";

interface DashboardUiState {
  displayMode: DisplayMode;
  isTableExpanded: boolean;
  toggleDisplayMode: () => void;
  toggleTableExpanded: () => void;
}

export const useDashboardUiStore = create<DashboardUiState>()((set) => ({
  displayMode: "flat",
  isTableExpanded: false,
  toggleDisplayMode: () =>
    set((state) => ({
      displayMode: state.displayMode === "flat" ? "grouped" : "flat",
    })),
  toggleTableExpanded: () =>
    set((state) => ({ isTableExpanded: !state.isTableExpanded })),
}));
