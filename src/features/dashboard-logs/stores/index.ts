import { create } from "zustand";

export type DisplayMode = "flat" | "grouped";

const HOUR_IN_MS = 3_600_000;

interface DashboardUiState {
  displayMode: DisplayMode;
  isTableExpanded: boolean;
  highlightedHourMs: number | null;
  toggleDisplayMode: () => void;
  toggleTableExpanded: () => void;
  setHighlightedHour: (timestampMs: number | null) => void;
}

export const useDashboardUiStore = create<DashboardUiState>()((set) => ({
  displayMode: "flat",
  isTableExpanded: false,
  highlightedHourMs: null,
  toggleDisplayMode: () =>
    set((state) => ({
      displayMode: state.displayMode === "flat" ? "grouped" : "flat",
    })),
  toggleTableExpanded: () =>
    set((state) => ({ isTableExpanded: !state.isTableExpanded })),
  setHighlightedHour: (timestampMs) =>
    set({
      highlightedHourMs:
        timestampMs === null
          ? null
          : Math.floor(timestampMs / HOUR_IN_MS) * HOUR_IN_MS,
    }),
}));
