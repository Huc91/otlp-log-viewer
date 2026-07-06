const APP_TIME_ZONE = process.env.APP_TIMEZONE || undefined;

function makeFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      ...options,
      timeZone: APP_TIME_ZONE,
    });
  } catch {
    // Unrecognized APP_TIMEZONE value: fall back to the system timezone.
    return new Intl.DateTimeFormat("en-GB", options);
  }
}

const timeFormatter = makeFormatter({
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const hourMinuteFormatter = makeFormatter({
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateTimeFormatter = makeFormatter({
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const formatTime = (date: Date): string => timeFormatter.format(date);
export const formatHourMinute = (date: Date): string =>
  hourMinuteFormatter.format(date);
export const formatDateTime = (date: Date): string =>
  dateTimeFormatter.format(date);
