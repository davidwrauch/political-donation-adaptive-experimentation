import React from "react";

const lineColors = ["#2e8f7f", "#a16a2a", "#3f6f9f", "#8b4b66"];

export default function OverviewTab({ overview }) {
  return (
    <div className="tab-panel">
      <section className="panel intro-card">
        <p>
          A New York Democratic campaign is testing donation outreach before scaling paid and volunteer outreach.
          This dashboard compares four allocation strategies to see which one allocates limited contacts most
          effectively across messages, audience segments, and channels. It does not declare one global best message
          because adaptive campaigns assign different messages to different people.
        </p>
      </section>

      <StrategyLegend strategies={overview.strategies} />

      <CurrentReadout readout={overview.current_readout} />

      <StrategyLineChart rows={overview.strategy_timeline} />

      <section className="section-note">
        This dashboard compares four allocation strategies. It does not declare a single global best message because
        adaptive campaigns assign different messages to different people.
      </section>

      <section className="strategy-grid">
        {overview.strategy_performance.map((strategy) => (
          <article className="panel strategy-metric-card" key={strategy.id}>
            <h3>{strategy.label}</h3>
            <p>{strategy.description}</p>
            <div className="strategy-metric-list">
              <Metric label="Donation conversion rate" value={formatPercent(strategy.conversion_rate)} />
              <Metric label="Net expected value" value={formatMoney(strategy.net_expected_value)} />
              <Metric
                label="Fatigue risk"
                value={formatPercent(strategy.fatigue_risk)}
                help="Estimated risk that repeated outreach reduces future response or causes opt-outs."
              />
              <Metric
                label="Exploration rate"
                value={formatPercent(strategy.exploration_rate)}
                help="Share of contacts intentionally reserved for learning rather than only using the current best-performing option."
              />
              <Metric
                label="Currently winning"
                value={strategy.winning_metrics.length ? strategy.winning_metrics.join(", ") : "No leading metric yet"}
              />
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
          title="Message-frame performance within the current leading strategy"
          rows={overview.message_performance}
          valueKey="conversion_rate"
          formatter={formatPercent}
          note={`Using ${overview.current_readout.leading_strategy.label}. Message-frame performance is secondary to the allocation strategy comparison.`}
        />
      </section>

      <MessageAllocationChart rows={overview.message_allocation_shift} strategy={overview.current_readout.leading_strategy.label} />
    </div>
  );
}

function StrategyLegend({ strategies }) {
  return (
    <section className="strategy-legend" aria-label="Allocation strategies being compared">
      {strategies.map((strategy) => (
        <article className="panel" key={strategy.id}>
          <h3>{strategy.label}</h3>
          <p>{strategy.description}</p>
        </article>
      ))}
    </section>
  );
}

function CurrentReadout({ readout }) {
  return (
    <section className="panel current-readout">
      <div>
        <p className="eyebrow">Current readout</p>
        <h2>Which allocation strategy is winning right now, and can we trust it yet?</h2>
        <p>{readout.confidence_note}</p>
      </div>
      <div className="readout-grid">
        <ReadoutMetric label="Current leading strategy" value={readout.leading_strategy.label} />
        <ReadoutMetric label="Winner by donation conversion rate" value={readout.conversion_winner.label} />
        <ReadoutMetric label="Winner by net expected value" value={readout.net_value_winner.label} />
        <ReadoutMetric
          label="Probability this is the best strategy"
          value={`${Math.round(readout.bayesian_confidence.probability_best * 100)}% simulated`}
        />
        <ReadoutMetric label="Recommendation status" value={readout.recommendation_status} />
      </div>
    </section>
  );
}

function ReadoutMetric({ label, value }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
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
          <h2>Cumulative donation conversions by allocation strategy</h2>
          <p>X-axis: date. Y-axis: cumulative donations/conversions.</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cumulative conversions by strategy">
        <text className="axis-title" x={width / 2} y={height - 3}>Date</text>
        <text className="axis-title y-title" x="14" y={height / 2}>Cumulative donations/conversions</text>
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
          return <text className="axis-label" key={row.experiment_date} x={x} y={height - 21}>{formatAxisDate(row.experiment_date)}</text>;
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

function MessageAllocationChart({ rows, strategy }) {
  const latest = rows.at(-1)?.frames ?? [];
  const first = rows[0]?.frames ?? [];
  return (
    <section className="panel">
      <h2>Message allocation within the current leading strategy</h2>
      <p className="panel-copy">
        This secondary view uses {strategy}. Under the current leading strategy, some message frames receive
        more allocation for specific donor segments while exploration remains active.
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

function Metric({ label, value, help }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      {help && <small>{help}</small>}
    </div>
  );
}

function BarChart({ title, rows, valueKey, formatter, note }) {
  const max = Math.max(...rows.map((row) => Math.abs(row[valueKey])), 0.01);
  return (
    <section className="panel">
      <h2>{title}</h2>
      {note && <p className="panel-copy">{note}</p>}
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

function formatAxisDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
