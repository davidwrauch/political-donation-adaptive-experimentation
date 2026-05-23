import React from "react";

const lineColors = ["#6d7a80", "#2e8f7f", "#a16a2a", "#3f6f9f", "#8b4b66"];
const defaultStrategies = [
  {
    id: "control",
    label: "Control",
    description: "Uses generic non-personalized outreach with fixed messaging and no adaptive allocation.",
  },
  {
    id: "static_ab",
    label: "Static randomized test",
    description: "Keeps contacts evenly split across approved message/channel combinations. It is a baseline for comparison against adaptive methods.",
  },
  {
    id: "thompson_sampling",
    label: "Thompson sampling",
    description: "Balances learning and performance by favoring options that look promising while still preserving uncertainty-aware exploration.",
  },
  {
    id: "linucb",
    label: "LinUCB",
    description: "Uses supporter context such as issue affinity, engagement, channel preference, and donation history to personalize assignments.",
  },
  {
    id: "guarded_contextual_bandit",
    label: "Contextual bandit with fatigue guardrail",
    description: "Personalizes outreach while reducing exposure for high-fatigue supporters and preserving a small exploration budget.",
  },
];

export default function OverviewTab({ overview }) {
  const strategies = overview?.strategy_performance ?? defaultStrategies;
  return (
    <div className="tab-panel">
      <section className="panel intro-card">
        <p>
          A New York Democratic campaign is testing donation outreach before scaling paid and volunteer outreach.
          This dashboard compares Control plus four allocation strategies to see which approach allocates limited contacts most
          effectively across messages, audience segments, and channels. It does not declare one global best message
          because adaptive campaigns assign different messages to different people.
        </p>
      </section>

      <ExperimentStatus strategies={strategies} readout={overview?.current_readout} />

      {!overview ? (
        <section className="panel loading">Loading campaign donation experiment results...</section>
      ) : (
        <>
          <StrategyRateChart rows={overview.strategy_rate_timeline} />

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
        </>
      )}
    </div>
  );
}

function ExperimentStatus({ strategies, readout }) {
  const leadingId = readout?.leading_strategy?.id;
  return (
    <section className="experiment-status" aria-label="Current experiment status">
      <CurrentReadout readout={readout} />
      <section className="strategy-grid">
        {strategies.map((strategy) => (
          <StrategyStatusCard
            isLeader={strategy.id === leadingId}
            key={strategy.id}
            strategy={strategy}
          />
        ))}
      </section>
    </section>
  );
}

function StrategyStatusCard({ strategy, isLeader }) {
  return (
    <article className={isLeader ? "panel strategy-metric-card leader-card" : "panel strategy-metric-card"}>
      <div className="card-title-row">
        <h3>{strategy.label}</h3>
        {isLeader && <span className="leader-pill">Current leader</span>}
      </div>
      <p>{strategy.description}</p>
      <div className="strategy-metric-list">
        <Metric label="Donation conversion rate" value={formatMaybePercent(strategy.conversion_rate)} />
        <Metric label="Net expected value" value={formatMaybeMoney(strategy.net_expected_value)} />
        <Metric
          label="Fatigue risk"
          value={formatMaybePercent(strategy.fatigue_risk)}
          help="Estimated risk that repeated outreach reduces future response or causes opt-outs."
        />
        <Metric
          label="Exploration rate"
          value={formatMaybePercent(strategy.exploration_rate)}
          help="Share of contacts reserved for learning rather than only using the current best-performing option."
        />
        <Metric
          label="Leading metric"
          value={strategy.winning_metrics?.length ? strategy.winning_metrics.join(", ") : "Not currently leading"}
        />
      </div>
    </article>
  );
}

function CurrentReadout({ readout }) {
  if (!readout) {
    return (
      <section className="panel current-readout readiness-card">
        <div>
          <p className="eyebrow">Current experiment status</p>
          <h2>How reliable is the current winner?</h2>
          <p>Loading live experiment metrics. The strategy cards below are available immediately and will fill in current results when the API responds.</p>
        </div>
      </section>
    );
  }
  const contactsNeeded = readout.estimated_additional_contacts_needed;
  return (
    <section className="panel current-readout readiness-card">
      <div>
        <p className="eyebrow">Current experiment status</p>
        <h2>How reliable is the current winner?</h2>
        <p>
          Do not send 100% of traffic to the current winner unless confidence is high. Keep some exploration active
          while the campaign is still learning.
        </p>
      </div>
      <div className="readout-grid">
        <ReadoutMetric label="Current leading strategy" value={readout.leading_strategy.label} />
        <ReadoutMetric
          label="Probability best"
          value={`${Math.round(readout.bayesian_confidence.probability_best * 100)}% simulated`}
        />
        <ReadoutMetric
          label="Additional contacts before high-confidence rollout"
          value={contactsNeeded > 0 ? `~${contactsNeeded.toLocaleString()}` : "0"}
        />
        <ReadoutMetric label="Recommendation status" value={readout.recommendation_status} />
        <ReadoutMetric label="Leading adaptive method" value={readout.leading_adaptive_strategy.label} />
        <ReadoutMetric label="Adaptive lift vs control" value={formatPercent(readout.adaptive_lift_vs_control)} />
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
  return <StrategyRateChart rows={rows} />;
}

function StrategyRateChart({ rows }) {
  const series = rows[0]?.series ?? [];
  const max = Math.max(0.4, ...rows.flatMap((row) => row.series.map((point) => point.conversion_rate)));
  const width = 820;
  const height = 300;
  const padding = { top: 34, right: 36, bottom: 54, left: 86 };
  const ticks = [0.2, 0.25, 0.3, 0.35, 0.4].filter((tick) => tick <= Math.max(0.4, max + 0.05));
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  return (
    <section className="panel line-panel">
      <div className="chart-heading">
        <div>
          <h2>Donation conversion rate over time by allocation strategy</h2>
          <p>X-axis: dates. Y-axis: conversion rate percentage by experiment date.</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Donation conversion rate over time by allocation strategy">
        <text className="axis-title" x={padding.left + chartWidth / 2} y={height - 8}>Date</text>
        <text className="axis-title y-title" x="20" y={padding.top + chartHeight / 2}>Conversion rate</text>
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} className="axis" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} className="axis" />
        {ticks.map((tick) => {
          const y = height - padding.bottom - (tick / max) * chartHeight;
          return (
            <g key={tick}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} className="grid-line" />
              <text className="axis-label y-axis-label" x={padding.left - 12} y={y + 4}>{formatWholePercent(tick)}</text>
            </g>
          );
        })}
        {series.map((item, seriesIndex) => {
          const points = rows
            .map((row, rowIndex) => {
              const value = row.series.find((point) => point.id === item.id)?.conversion_rate ?? 0;
              const x = padding.left + (rowIndex / Math.max(1, rows.length - 1)) * chartWidth;
              const y = height - padding.bottom - (value / max) * chartHeight;
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polyline
              fill="none"
              key={item.id}
              points={points}
              stroke={lineColors[seriesIndex % lineColors.length]}
              strokeOpacity="0.84"
              strokeWidth="2.75"
            />
          );
        })}
        {rows.map((row, index) => {
          const x = padding.left + (index / Math.max(1, rows.length - 1)) * chartWidth;
          return <text className="axis-label" key={row.experiment_date} x={x} y={height - 32}>{formatAxisDate(row.experiment_date)}</text>;
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
        <strong>Current leading strategy: {strategy}.</strong>
      </p>
      <p className="panel-copy">
        This secondary view shows how the current leading strategy distributes outreach across message frames while
        preserving some exploration.
      </p>
      <div className="allocation-grid">
        {latest.map((frame) => {
          const starting = first.find((item) => item.id === frame.id)?.allocation_share ?? 0;
          return (
            <article key={frame.id}>
              <strong>{frame.label}</strong>
              <span>Latest batch allocation: {formatPercent(frame.allocation_share)}</span>
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

function formatMaybePercent(value) {
  return typeof value === "number" ? formatPercent(value) : "Loading";
}

function formatMaybeMoney(value) {
  return typeof value === "number" ? formatMoney(value) : "Loading";
}

function formatWholePercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatAxisDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
