/**
 * Daily scan schedule: the pipeline runs on NYSE trading days at 3:35 PM US/Eastern.
 * Full-day NYSE holidays are skipped (list below; extend it each year).
 * Early-close days (e.g. day after Thanksgiving) are not special-cased.
 */

export const SCAN_HOUR_ET = 15;
export const SCAN_MINUTE_ET = 35;

// NYSE full-day closures (observed dates), 2026-2027
const NYSE_HOLIDAYS = new Set<string>([
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25", "2026-06-19",
  "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25",
  "2027-01-01", "2027-01-18", "2027-02-15", "2027-03-26", "2027-05-31", "2027-06-18",
  "2027-07-05", "2027-09-06", "2027-11-25", "2027-12-24",
]);

/** Wall-clock parts of `d` in New York. */
function etParts(d: Date) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
  });
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(d)) p[part.type] = part.value;
  return {
    y: Number(p.year), m: Number(p.month), d: Number(p.day),
    hh: Number(p.hour) % 24, mm: Number(p.minute),
  };
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function isTradingDay(y: number, m: number, d: number): boolean {
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow !== 0 && dow !== 6 && !NYSE_HOLIDAYS.has(iso(y, m, d));
}

/** Next scheduled scan as an ET calendar date (YYYY-MM-DD), relative to `now`. */
export function nextScanDate(now: Date = new Date()): string {
  const t = etParts(now);
  const beforeScan = t.hh < SCAN_HOUR_ET || (t.hh === SCAN_HOUR_ET && t.mm < SCAN_MINUTE_ET);
  let day = new Date(Date.UTC(t.y, t.m - 1, t.d));
  if (!(beforeScan && isTradingDay(t.y, t.m, t.d))) day = new Date(day.getTime() + 86400000);
  for (let i = 0; i < 15; i++) {
    const y = day.getUTCFullYear(), m = day.getUTCMonth() + 1, d = day.getUTCDate();
    if (isTradingDay(y, m, d)) return iso(y, m, d);
    day = new Date(day.getTime() + 86400000);
  }
  return iso(t.y, t.m, t.d);
}

/** Minutes from `now` until the next scan (ET), for a "in 2h 10m" hint. */
export function minutesUntilNextScan(now: Date = new Date()): number {
  const date = nextScanDate(now);
  const t = etParts(now);
  const [y, m, d] = date.split("-").map(Number);
  const dayDiff = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(t.y, t.m - 1, t.d)) / 86400000);
  return dayDiff * 1440 + (SCAN_HOUR_ET * 60 + SCAN_MINUTE_ET) - (t.hh * 60 + t.mm);
}

export function formatScanDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

export function formatCountdown(mins: number): string {
  if (mins <= 0) return "running now";
  const days = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (days > 0) return `in ${days}d ${h}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}
