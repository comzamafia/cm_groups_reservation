export type BarItem = { label: string; value: number; sub?: string };

/**
 * Dependency-free horizontal bar chart. Bars are scaled to the largest value.
 * `format` renders the numeric value (e.g. as currency or a count).
 */
export function Bars({
  items,
  format = (v) => String(v),
  empty = "No data yet.",
}: {
  items: BarItem[];
  format?: (v: number) => string;
  empty?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) {
    return <p className="muted" style={{ padding: "8px 4px" }}>{empty}</p>;
  }
  return (
    <div className="bars">
      {items.map((it) => (
        <div className="bar-row" key={it.label}>
          <div className="bar-label" title={it.label}>
            {it.label}
            {it.sub && <span className="bar-sub"> · {it.sub}</span>}
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
          <div className="bar-value">{format(it.value)}</div>
        </div>
      ))}
    </div>
  );
}
