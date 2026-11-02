/**
 * JavaScript Native Temporal API Date Utilities
 * Provides modern date-time parsing, formatting, and duration math
 * using the standard TC39 Temporal API with robust Neo4j normalization
 * and isomorphic fallbacks.
 */

// Global type declaration for environments where Temporal is native
declare const Temporal: any;

/**
 * Normalizes any date value (ISO string, timestamp number, Date object, or Neo4j DateTime object)
 * into a valid ISO 8601 string.
 */
export function normalizeDateToISO(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;

  // 1. String: check if it's already an ISO or parsable date string
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const ts = Date.parse(trimmed);
    if (!isNaN(ts)) {
      return new Date(ts).toISOString();
    }
    return null;
  }

  // 2. Number: unix epoch in milliseconds
  if (typeof val === "number" && !isNaN(val) && isFinite(val)) {
    return new Date(val).toISOString();
  }

  // 3. Object: Date instance or Neo4j DateTime object
  if (typeof val === "object") {
    if (val instanceof Date) {
      return !isNaN(val.getTime()) ? val.toISOString() : null;
    }

    // Neo4j DateTime structure: { year: { low: 2026 }, month: { low: 11 }, day: { low: 20 }, ... }
    const obj = val as Record<string, any>;
    if (obj.year !== undefined && obj.month !== undefined && obj.day !== undefined) {
      const getNum = (v: any) =>
        v && typeof v === "object" && "low" in v ? Number(v.low) : Number(v) || 0;

      const y = getNum(obj.year);
      const m = getNum(obj.month);
      const d = getNum(obj.day);
      const h = getNum(obj.hour);
      const min = getNum(obj.minute);
      const s = getNum(obj.second);

      if (y > 0 && m > 0 && d > 0) {
        return new Date(Date.UTC(y, m - 1, d, h, min, s)).toISOString();
      }
    }

    // Generic .toISOString()
    if (typeof obj.toISOString === "function") {
      try {
        return obj.toISOString();
      } catch {
        // ignore
      }
    }

    // Generic .toString()
    if (typeof obj.toString === "function") {
      const str = obj.toString();
      const ts = Date.parse(str);
      if (!isNaN(ts)) {
        return new Date(ts).toISOString();
      }
    }
  }

  return null;
}

/**
 * Checks whether native JavaScript Temporal API is supported in the current runtime.
 */
export function isTemporalSupported(): boolean {
  return typeof Temporal !== "undefined" && typeof Temporal.Instant !== "undefined";
}

/**
 * Formats an event date using JavaScript's native Temporal API.
 * e.g. "Nov 20, 6:00 PM"
 */
export function formatEventDate(
  dateVal: unknown,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  },
  locale = "en-US"
): string {
  const iso = normalizeDateToISO(dateVal);
  if (!iso) return "Date TBD";

  if (isTemporalSupported()) {
    try {
      const instant = Temporal.Instant.from(iso);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const zonedDateTime = instant.toZonedDateTimeISO(timeZone);
      return zonedDateTime.toLocaleString(locale, options);
    } catch {
      // Fallback
    }
  }

  // Fallback to Date / Intl
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "Date TBD" : d.toLocaleString(locale, options);
  } catch {
    return "Date TBD";
  }
}

/**
 * Extracts decomposed parts (day, date, month, year, time) using Temporal API.
 */
export function getEventDateParts(dateVal: unknown) {
  const iso = normalizeDateToISO(dateVal);
  if (!iso) {
    return {
      day: "TBD",
      date: "--",
      month: "TBD",
      year: "",
      time: "TBD",
    };
  }

  if (isTemporalSupported()) {
    try {
      const instant = Temporal.Instant.from(iso);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const zdt = instant.toZonedDateTimeISO(timeZone);
      return {
        day: zdt.toLocaleString("en-US", { weekday: "short" }),
        date: zdt.day,
        month: zdt.toLocaleString("en-US", { month: "short" }),
        year: zdt.year,
        time: zdt.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
    } catch {
      // Fallback
    }
  }

  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.getDate(),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    year: d.getFullYear(),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

/**
 * Formats a deadline and returns its urgent flag using Temporal API.
 */
export function formatDeadline(isoInput: unknown): { label: string; urgent: boolean } {
  const iso = normalizeDateToISO(isoInput);
  if (!iso) return { label: "No deadline", urgent: false };

  let diffDays = 0;
  let formattedDate = "";

  if (isTemporalSupported()) {
    try {
      const now = Temporal.Now.instant();
      const target = Temporal.Instant.from(iso);
      diffDays = Math.ceil(now.until(target).total({ unit: "day" }));
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      formattedDate = target.toZonedDateTimeISO(timeZone).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      const d = new Date(iso);
      diffDays = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
      formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  } else {
    const d = new Date(iso);
    diffDays = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (diffDays < 0) return { label: "Expired", urgent: true };
  if (diffDays <= 3) return { label: diffDays === 0 ? "Today!" : `${diffDays}d left`, urgent: true };
  return { label: formattedDate, urgent: false };
}

/**
 * Calculates a human-readable relative time string (e.g. "5m", "2h", "3d") using Temporal API.
 */
export function timeAgo(dateVal?: unknown): string {
  const iso = normalizeDateToISO(dateVal);
  if (!iso) return "";

  if (isTemporalSupported()) {
    try {
      const now = Temporal.Now.instant();
      const past = Temporal.Instant.from(iso);
      const minutes = Math.floor(now.since(past).total({ unit: "minute" }));
      if (minutes < 1) return "just now";
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h`;
      return `${Math.floor(hours / 24)}d`;
    } catch {
      // Fallback
    }
  }

  const ts = Date.parse(iso);
  if (isNaN(ts)) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
