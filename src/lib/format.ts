import { timeFormat } from "d3-time-format";

export const formatTime = timeFormat("%H:%M:%S");
export const formatHourMinute = timeFormat("%H:%M");
export const formatDateTime = timeFormat("%d/%m/%Y, %H:%M");
