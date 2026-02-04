import dayjs from "dayjs";
import jalaliPlugin from "jalali-plugin-dayjs";
import "dayjs/locale/fa";

dayjs.extend(jalaliPlugin);
dayjs.locale("fa");

/** Parse date from API (YYYY-MM-DD or ISO string). Returns dayjs in Gregorian; use .calendar('jalali') for Jalali. */
export function parseApiDate(value: string | null | undefined): dayjs.Dayjs | null {
  if (value == null || String(value).trim() === "") return null;
  const s = String(value).trim();
  // Backend sends DATE as YYYY-MM-DD; avoid appending T12 if already has time
  const parsed = s.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? dayjs(s + "T12:00:00")
    : dayjs(s);
  return parsed.isValid() ? parsed : null;
}

/** Format as Jalali short for chart axis (e.g. ۹/۱۶) */
export function formatJalaliShort(value: string | null | undefined): string {
  const d = parseApiDate(value);
  if (!d) return "—";
  return d.calendar("jalali").locale("fa").format("M/D");
}

/** Format as Jalali long for tooltip/header (e.g. ۱۶ آذر ۱۴۰۳) */
export function formatJalaliLong(value: string | null | undefined): string {
  const d = parseApiDate(value);
  if (!d) return "—";
  return d.calendar("jalali").locale("fa").format("D MMMM YYYY");
}

/** Whether the API date string falls in the current Jalali month */
export function isInCurrentJalaliMonth(apiDateStr: string): boolean {
  const d = parseApiDate(apiDateStr);
  if (!d) return false;
  const j = d.calendar("jalali");
  const today = dayjs().calendar("jalali");
  return j.year() === today.year() && j.month() === today.month();
}

/** Whether the API date string is within the last 7 days (این هفته) */
export function isInCurrentWeek(apiDateStr: string): boolean {
  const d = parseApiDate(apiDateStr);
  if (!d) return false;
  const now = dayjs();
  const start = now.subtract(6, "day").startOf("day");
  const end = now.endOf("day");
  return !d.isBefore(start) && !d.isAfter(end);
}
