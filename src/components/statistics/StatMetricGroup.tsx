export type StatMetric = {
  label: string;
  count: number | null;
  rate?: number | null;
};

function countLabel(value: number | null) {
  return value === null ? "—" : `${value}회`;
}

function rateLabel(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function MetricLine({ label, count, rate }: StatMetric) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[var(--line)]/70 py-1.5 last:border-0">
      <span className="truncate text-xs text-[var(--muted)]">{label}</span>
      <span className="shrink-0 text-right text-xs font-semibold text-[var(--text)]">
        {countLabel(count)}
        {rate !== undefined ? (
          <span className="ml-1.5 text-[var(--cyan)]">{rateLabel(rate)}</span>
        ) : null}
      </span>
    </div>
  );
}

export function StatMetricGroup({
  title,
  metrics,
}: {
  title: string;
  metrics: StatMetric[];
}) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[rgba(5,13,26,0.38)] px-3 py-2">
      <h5 className="mb-1 text-xs font-bold text-[var(--text)]">{title}</h5>
      {metrics.map((metric) => (
        <MetricLine key={metric.label} {...metric} />
      ))}
    </section>
  );
}
