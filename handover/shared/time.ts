export const SCHOOL_TIME_ZONE = "Asia/Taipei";
export const PERIOD_COUNT = 6;
export const PERIOD_MINUTES = 45;

export function schoolToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function weekdayIndex(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function mondayOnOrBefore(date: string): string {
  const day = weekdayIndex(date);
  const diff = day === 0 ? 6 : day - 1;
  return addDays(date, -diff);
}

export function defaultSchoolMonday(today = schoolToday()): string {
  const day = weekdayIndex(today);
  if (day === 6) return addDays(today, 2);
  if (day === 0) return addDays(today, 1);
  return mondayOnOrBefore(today);
}

export function isSchoolDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

export function periodClock(period: number): { start: string; end: string } {
  const starts = ["0810", "0905", "1010", "1105", "1310", "1405"];
  const start = starts[period - 1] ?? "0810";
  const hour = Number(start.slice(0, 2));
  const minute = Number(start.slice(2));
  const total = hour * 60 + minute + PERIOD_MINUTES;
  const end = `${String(Math.floor(total / 60)).padStart(2, "0")}${String(total % 60).padStart(2, "0")}`;
  return { start, end };
}
