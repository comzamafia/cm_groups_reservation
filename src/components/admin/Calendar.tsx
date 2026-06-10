import Link from "next/link";
import { Icon } from "@/components/events/Icon";

export type CalEvent = { date: string; label: string };

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Pure month-grid calendar. `month` is "YYYY-MM"; events are plotted by date.
 * Prev/next link back to the same page preserving other query params.
 */
export function Calendar({
  month,
  events,
  baseQuery = "",
}: {
  month: string;
  events: CalEvent[];
  baseQuery?: string;
}) {
  const [yy, mm] = month.split("-").map(Number);
  const year = yy;
  const monthIdx = mm - 1;

  const first = new Date(year, monthIdx, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const todayStr = ymd(new Date());

  const prev = new Date(year, monthIdx - 1, 1);
  const next = new Date(year, monthIdx + 1, 1);
  const prevQ = `?month=${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}${baseQuery}`;
  const nextQ = `?month=${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}${baseQuery}`;

  const byDate = new Map<string, string[]>();
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e.label);
  }

  // Build leading blanks + day cells, padded to full weeks.
  const cells: { day: number | null; key: string }[] = [];
  for (let i = 0; i < startDow; i++) cells.push({ day: null, key: `b${i}` });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `d${d}` });
  while (cells.length % 7 !== 0) cells.push({ day: null, key: `t${cells.length}` });

  return (
    <div className="cal">
      <div className="cal-head">
        <span className="cal-title">
          {MONTHS[monthIdx]} {year}
        </span>
        <div className="cal-nav">
          <Link href={prevQ} aria-label="Previous month">
            <Icon name="ChevronLeft" size={18} />
          </Link>
          <Link href={nextQ} aria-label="Next month">
            <Icon name="ChevronRight" size={18} />
          </Link>
        </div>
      </div>
      <div className="cal-scroll">
      <div className="cal-grid">
        {DOW.map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
        {cells.map((c) => {
          if (c.day === null) return <div key={c.key} className="cal-cell dim" />;
          const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(
            c.day,
          ).padStart(2, "0")}`;
          const evs = byDate.get(dateStr) ?? [];
          return (
            <div
              key={c.key}
              className={`cal-cell ${dateStr === todayStr ? "today" : ""}`}
            >
              <span className="cal-date">{c.day}</span>
              {evs.slice(0, 3).map((label, i) => (
                <span key={i} className="cal-ev" title={label}>
                  {label}
                </span>
              ))}
              {evs.length > 3 && (
                <span className="cal-ev">+{evs.length - 3} more</span>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
