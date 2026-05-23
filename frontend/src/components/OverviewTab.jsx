import React from "react";

const lineColors = ["#2e8f7f", "#a16a2a", "#3f6f9f", "#8b4b66"];

export default function OverviewTab({ overview }) {
  return (
    <div className="tab-panel">
      <section className="panel leadership-box">
        <div>
          <p className="eyebrow">What leadership should know</p>
          <h2>{overview.leadership_takeaway}</h2>
        </div>
        <div className="next-allocation">
          <span>Recommended next allocation</span>
          <strong>{overview.recommended_next_allocation}</strong>
        </div>
      </section>

      <section className="metric-grid leadership-metrics">
        <Metric label="Donation conversion rate" value={formatPercent(overview.primary_metric.value)} primary />
        <Metric label="Expected donation amount" value={formatMoney(overview.secondary_metrics.expected_donation_amount)} />
        <Metric label="Net expected donation value" value={formatMoney(overview.secondary_metrics.net_expected_donation_value)} />
        <Metric label="Best message frame" value={overview.best_message_frame.label} />
        <Metric label="Best segment" value={overview.best_segment.label} />
        <Metric label="Best channel" value={overview.best_channel.label} />
        <Metric label="Current exploration rate" value={formatPercent(overview.exploration_rate)} />
        <Metric
          label="Donor fatigue warning"
          value={overview.donor_fatigue_warning ? "Monitor closely" : "Stable"}
          tone={overview.donor_fatigue_warning ? "warning" : "stable"}
        />
      </section>

      <LineChart rows={overview.conversion_timeline} />

      <section className="chart-grid">
        <BarChart
          title="Donation conversion by message frame"
          rows={overview.message_performance}
          valueKey="conversion_rate"
          formatter={formatPercent}
        />
        <BarChart
          title="Expected donation value by segment"
          rows={overview.segment_performance}
          valueKey="net_expected_value"
          formatter={formatMoney}
        />
      </section>

      <AllocationChart rows={overview.allocation_shift} />

      <section className="panel">
        <h2>Channel response rates</h2>
        <div className="channel-grid">
          {overview.channel_performance.map((channel) => (
            <article key={channel.id}>
              <strong>{channel.label}</strong>
              <span>{formatPercent(channel.conversion_rate)}</span>
              <small>Net value {formatMoney(channel.net_expected_value)}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, primary = false, tone = "" }) {
  return (
    <article className={primary ? "metric-card primary-metric" : "metric-card"}>
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
    </article>
  );
}

function LineChart({ rows }) {
  const series = rows[0]?.series ?? [];
  const max = Math.max(
    1,
    ...rows.flatMap((row) => row.series.map((point) => point.cumulative_conversions)),
  );
  const width = 760;
  const height = 260;
  const padding = 34;

  return (
    <section className="panel line-panel">
      <div className="chart-heading">
        <div>
          <h2>Cumulative donation conversions by message frame</h2>
          <p>Batch-by-batch view of how the active message arms are performing.</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cumulative conversions by message frame">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="axis" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="axis" />
        {series.map((item, seriesIndex) => {
          const points = rows
            .map((row, rowIndex) => {
              const value = row.series.find((point) => point.id === item.id)?.cumulative_conversions ?? 0;
              const x = padding + (rowIndex / Math.max(1, rows.length - 1)) * (width - padding * 2);
              const y = height - padding - (value / max) * (height - padding * 2);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polyline
              fill="none"
              key={item.id}
              points={points}
              stroke={lineColors[seriesIndex % lineColors.length]}
              strokeWidth="4"
            />
          );
        })}
        {rows.map((row, index) => {
          const x = padding + (index / Math.max(1, rows.length - 1)) * (width - padding * 2);
          return <text className="axis-label" key={row.batch} x={x} y={height - 8}>{row.batch}</text>;
        })}
      </svg>
      <div className="legend">
        {series.map((item, index) => (
          <span key={item.id}>
            <i style={{ background: lineColors[index % lineColors.length] }} />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function AllocationChart({ rows }) {
  const latest = rows.at(-1)?.frames ?? [];
  const first = rows[0]?.frames ?? [];
  return (
    <section className="panel">
      <h2>Allocation shift over time</h2>
      <p className="panel-copy">
        Shows how assignment share moves from broad exploration toward better-performing message frames.
      </p>
      <div className="allocation-grid">
        {latest.map((frame) => {
          const starting = first.find((item) => item.id === frame.id)?.allocation_share ?? 0;
          return (
            <article key={frame.id}>
              <strong>{frame.label}</strong>
              <span>Now {formatPercent(frame.allocation_share)}</span>
              <small>Started at {formatPercent(starting)}</small>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.max(4, frame.allocation_share * 100)}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BarChart({ title, rows, valueKey, formatter }) {
  const max = Math.max(...rows.map((row) => Math.abs(row[valueKey])), 0.01);
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="bar-list">
        {rows.map((row) => (
          <div className="bar-row" key={row.id}>
            <span>{row.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.max(4, (Math.abs(row[valueKey]) / max) * 100)}%` }} />
            </div>
            <strong>{formatter(row[valueKey])}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}
