import { create } from "zustand";
import { HOUR_IN_MS } from "@/lib/constants";

export type DisplayMode = "flat" | "grouped";

interface DashboardUiState {
  displayMode: DisplayMode;
  isTableExpanded: boolean;
  highlightedHourMs: number | null;
  hourFocusRequest: { hourMs: number; requestId: number } | null;
  toggleDisplayMode: () => void;
  toggleTableExpanded: () => void;
  setHighlightedHour: (timestampMs: number | null) => void;
  requestHourFocus: (hourMs: number) => void;
}

export const useStore = create<DashboardUiState>()((set) => ({
  displayMode: "flat",
  isTableExpanded: false,
  highlightedHourMs: null,
  hourFocusRequest: null,
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
  requestHourFocus: (hourMs) =>
    set((state) => ({
      hourFocusRequest: {
        hourMs,
        requestId: (state.hourFocusRequest?.requestId ?? 0) + 1,
      },
    })),
}));
