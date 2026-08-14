import { GUIDE_CONFIG } from "./config.mjs";

function zonedParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GUIDE_CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function localDateString(date = new Date()) {
  const parts = zonedParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function localHour(date = new Date()) {
  return Number(zonedParts(date).hour);
}

export function shiftDate(dateString, offsetDays) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays, 12));
  return date.toISOString().slice(0, 10);
}

export function previousCompletedLocalDate(date = new Date()) {
  return shiftDate(localDateString(date), -1);
}

export function datesEnding(endDate, count) {
  return Array.from({ length: count }, (_, index) => shiftDate(endDate, index - count + 1));
}

export function formatDisplayDate(dateString, withYear = false) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function shortDisplayDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

export function weekdayLabel(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
  });
}

export function shouldRunPacificMorning(date = new Date()) {
  return localHour(date) === 8;
}
