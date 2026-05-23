import React from "react";

const lineColors = ["#2e8f7f", "#a16a2a", "#3f6f9f", "#8b4b66"];

export default function OverviewTab({ overview }) {
  return (
    <div className="tab-panel">
      <section className="panel intro-card">
        <p>
          A New York Democratic campaign is testing donation outreach before scaling paid and
          volunteer outreach. The campaign wants to learn which experimentation strategy allocates
          limited contacts most effectively across messages, audience segments, and channels while
          avoiding donor fatigue.
        </p>
        <p>
          This dashboard compares four allocation strategies. It does not declare a single global
          best message because adaptive campaigns assign different messages to different people.
        </p>
      </section>

      <StrategyLegend strategies={overview.strategies} />

      <section className="panel summary-card">
        <p className="eyebrow">Campaign readout</p>
        <p>{overview.leadership_takeaway}</p>
        <small>{overview.recommended_next_allocation}</small>
      </section>

      <StrategyLineChart rows={overview.strategy_timeline} />

      <section className="strategy-grid">
        {overview.strategy_performance.map((strategy) => (
          <article className="panel strategy-metric-card" key={strategy.id}>
            <h3>{strategy.label}</h3>
            <div className="strategy-metric-list">
              <Metric label="Donation conversion rate" value={formatPercent(strategy.conversion_rate)} />
              <Metric label="Net expected value" value={formatMoney(strategy.net_expected_value)} />
              <Metric label="Fatigue risk" value={formatPercent(strategy.fatigue_risk)} />
              <Metric label="Exploration rate" value={formatPercent(strategy.exploration_rate)} />
            </div>
          </article>
        ))}
      </section>

      <section className="chart-grid">
        <BarChart
          title="Overall donation conversion rate by strategy"
          rows={overview.strategy_performance}
          valueKey="conversion_rate"
          formatter={formatPercent}
        />
        <BarChart
          title="Net expected donation value by strategy"
          rows={overview.strategy_performance}
          valueKey="net_expected_value"
          formatter={formatMoney}
        />
      </section>

      <section className="chart-grid">
        <BarChart
          title="Fatigue risk by strategy"
          rows={overview.strategy_performance}
          valueKey="fatigue_risk"
          formatter={formatPercent}
        />
        <BarChart
          title="Message-frame performance under the best-performing strategy"
          rows={overview.message_performance}
          valueKey="conversion_rate"
          formatter={formatPercent}
        />
      </section>

      <MessageAllocationChart rows={overview.message_allocation_shift} />
    </div>
  );
}

function StrategyLegend({ strategies }) {
  return (
    <section className="strategy-legend">
      {strategies.map((strategy) => (
        <article className="panel" key={strategy.id}>
          <h3>{strategy.label}</h3>
          <p>{strategy.description}</p>
        </article>
      ))}
    </section>
  );
}

function StrategyLineChart({ rows }) {
  const series = rows[0]?.series ?? [];
  const max = Math.max(
    1,
    ...rows.flatMap((row) => row.series.map((point) => point.cumulative_conversions)),
  );
  const width = 760;
  const height = 270;
  const padding = 38;

  return (
    <section className="panel line-panel">
      <div className="chart-heading">
        <div>
          <h2>Cumulative donation conversions by strategy</h2>
          <p>Y-axis: cumulative conversions. X-axis: experiment batch/date.</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cumulative conversions by strategy">
        <text className="axis-title" x={width / 2} y={height - 3}>Experiment batch</text>
        <text className="axis-title y-title" x="14" y={height / 2}>Cumulative conversions</text>
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
          return <text className="axis-label" key={row.batch} x={x} y={height - 21}>{row.batch}</text>;
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

function MessageAllocationChart({ rows }) {
  const latest = rows.at(-1)?.frames ?? [];
  const first = rows[0]?.frames ?? [];
  return (
    <section className="panel">
      <h2>Message allocation under the best-performing strategy</h2>
      <p className="panel-copy">
        Under the best-performing strategy, some message frames receive more allocation for specific
        donor segments, while the system preserves exploration because performance varies by segment and channel.
      </p>
      <div className="allocation-grid">
        {latest.map((frame) => {
          const starting = first.find((item) => item.id === frame.id)?.allocation_share ?? 0;
          return (
            <article key={frame.id}>
              <strong>{frame.label}</strong>
              <span>Latest batch {formatPercent(frame.allocation_share)}</span>
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

function Metric({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
