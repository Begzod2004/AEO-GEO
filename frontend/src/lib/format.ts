/** Format an ISO date (or date string) as e.g. "6 Jul 2026". */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Short axis label, e.g. "6 Jul". */
export function formatDayMonth(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Relative time, e.g. "2 hours ago". Falls back to a formatted date. */
export function timeAgo(value?: string | null): string {
  if (!value) return "never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

/** Compact integer with a sign, e.g. "+6", "-3", "0". */
export function signed(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

const rtf =
  typeof Intl !== "undefined" && "NumberFormat" in Intl
    ? new Intl.NumberFormat()
    : null;

export function formatNumber(value: number): string {
  return rtf ? rtf.format(value) : String(value);
}
