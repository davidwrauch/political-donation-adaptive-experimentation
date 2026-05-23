import React, { useEffect, useRef, useState } from "react";

const lineColors = ["#6d7a80", "#2e8f7f", "#a16a2a", "#3f6f9f", "#8b4b66"];
const helpText = {
  "Current leading strategy": "The strategy with the highest net donation value per contact in this simulated experiment.",
  "Net donation value per contact": "Average expected dollars raised per person contacted, after accounting for conversion rate, donation amount, and fatigue penalty.",
  "Donation conversion rate": "Share of contacted people who are expected to donate.",
  "Average donation amount": "Average expected donation size among contacted supporters in this simulation.",
  "Probability best": "Probability best estimates how likely the current leading strategy is to be the best option if the experiment continues. Unlike a p-value, it is expressed directly as a probability.",
  "Additional contacts before high-confidence rollout": "Estimated number of additional outreach contacts needed before the result is reliable enough for broad rollout.",
  "Recommendation status": "Plain-English rollout guidance based on current simulated confidence and whether the campaign should keep learning.",
  "Adaptive lift vs control": "Estimated improvement versus generic non-personalized outreach.",
  "Total contacts observed": "Total simulated supporter contacts included in the current dashboard readout.",
  "Control contacts": "Number of simulated contacts assigned to generic non-personalized outreach.",
  "Contacts observed": "Number of simulated supporter contacts assigned to this strategy so far.",
  "Net expected value": "Estimated donation value after accounting for response rate, average donation amount, and fatigue effects.",
  "Fatigue risk": "Estimated risk that repeated outreach reduces future response or increases opt-outs.",
  "Exploration rate": "Share of traffic intentionally reserved for learning rather than only using the current winner.",
  "Control": "Generic non-personalized outreach with fixed messaging and no adaptive allocation.",
  "Static randomized test": "Randomly splits traffic across approved message/channel combinations, but does not adapt allocation based on results.",
  "Directional only": "The current winner may simply reflect early noise. More data is needed before confidently scaling traffic.",
  "Promising but keep testing": "The current winner looks encouraging, but the campaign should keep learning before shifting most traffic.",
  "Ready to scale": "The leading strategy has remained strong enough in the simulation to justify broader rollout with monitoring.",
};
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
  const [paused, setPaused] = useState(false);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const snapshots = overview?.strategy_status_timeline ?? [];
  const activeIndex = snapshots.length ? Math.min(visibleIndex, snapshots.length - 1) : 0;
  const snapshot = snapshots[activeIndex];
  const strategies = snapshot?.strategy_performance ?? overview?.strategy_performance ?? defaultStrategies;
  const readout = snapshot?.current_readout ?? overview?.current_readout;
  const chartRows = overview?.strategy_rate_timeline?.slice(0, activeIndex + 1) ?? [];
  const lastUpdated = snapshot?.experiment_date ? formatAxisDate(snapshot.experiment_date) : "";

  useEffect(() => {
    if (!overview) return undefined;
    setVisibleIndex(Math.min(2, Math.max(0, snapshots.length - 1)));
  }, [overview, snapshots.length]);

  useEffect(() => {
    if (!overview || paused || !snapshots.length) return undefined;
    const timer = window.setInterval(() => {
      setVisibleIndex((current) => (current >= snapshots.length - 1 ? current : current + 1));
    }, 3500);
    return () => window.clearInterval(timer);
  }, [overview, paused, snapshots.length]);

  return (
    <div className="tab-panel">
      <section className="panel intro-card">
        <p>
          A New York Democratic campaign is testing donation outreach before scaling donation outreach.
          This dashboard compares Control plus four allocation strategies to see which approach allocates limited contacts most
          effectively across messages, audience segments, and channels. It does not declare one global best message
          because adaptive campaigns assign different messages to different people.
        </p>
      </section>

      <ExperimentStatus
        lastUpdated={lastUpdated}
        onTogglePaused={() => setPaused((current) => !current)}
        paused={paused}
        readout={readout}
        strategies={strategies}
      />

      {!overview ? (
        <section className="panel loading">Loading campaign donation experiment results...</section>
      ) : (
        <>
          <StrategyRateChart rows={chartRows} />

          <section className="chart-grid">
            <BarChart
              title="Overall donation conversion rate by strategy"
              rows={strategies}
              valueKey="conversion_rate"
              formatter={formatPercent}
            />
            <BarChart
              title="Net donation value per contact by strategy"
              rows={strategies}
              valueKey="net_expected_value"
              formatter={formatMoney}
            />
          </section>

          <section className="chart-grid">
            <BarChart
              title="Fatigue risk by strategy"
              rows={strategies}
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

function ExperimentStatus({ strategies, readout, paused, onTogglePaused, lastUpdated }) {
  const leadingId = readout?.leading_strategy?.id;
  return (
    <section className="experiment-status" aria-label="Current experiment status">
      <CurrentReadout lastUpdated={lastUpdated} onTogglePaused={onTogglePaused} paused={paused} readout={readout} />
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
        <Metric label="Net donation value per contact" value={formatMaybeMoney(strategy.net_expected_value)} />
        <Metric label="Average donation amount" value={formatMaybeMoney(strategy.expected_donation_amount)} />
        <Metric label="Contacts observed" value={formatMaybeNumber(strategy.contacts_observed)} />
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
        <Metric label="Allocation status" value={strategy.allocation_status ?? "Loading"} />
      </div>
    </article>
  );
}

function CurrentReadout({ readout, paused, onTogglePaused, lastUpdated }) {
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
        <ReadoutMetric label="Net donation value per contact" value={formatMoney(readout.leading_strategy.net_expected_value)} />
        <ReadoutMetric label="Donation conversion rate" value={formatPercent(readout.leading_strategy.conversion_rate)} />
        <ReadoutMetric label="Average donation amount" value={formatMoney(readout.leading_strategy.expected_donation_amount)} />
        <ReadoutMetric label="Total contacts observed" value={readout.total_contacts_observed.toLocaleString()} />
        <ReadoutMetric
          label="Probability best"
          value={`${Math.round(readout.bayesian_confidence.probability_best * 100)}% simulated`}
        />
        <ReadoutMetric
          label="Additional contacts before high-confidence rollout"
          value={contactsNeeded > 0 ? `~${contactsNeeded.toLocaleString()}` : "0"}
        />
        <ReadoutMetric label="Recommendation status" value={readout.recommendation_status} valueHelp={helpText[readout.recommendation_status]} />
        <ReadoutMetric label="Adaptive lift vs control" value={formatMoney(readout.adaptive_lift_vs_control)} />
        <ReadoutMetric label="Control contacts" value={readout.contacts_by_control.toLocaleString()} />
      </div>
      <p className="confidence-note">
        High confidence generally means the leading strategy has remained stable over additional traffic and reached
        roughly 80-90% simulated probability best. Traditional statistical significance can still be reported in a real
        deployment, but this prototype uses Bayesian-style probability best because it is easier to interpret for live
        allocation decisions.
      </p>
      <div className="stream-controls">
        <button onClick={onTogglePaused} type="button">{paused ? "Resume updates" : "Pause updates"}</button>
        <span>Last updated: {lastUpdated || "Loading"}</span>
      </div>
    </section>
  );
}

function ReadoutMetric({ label, value, valueHelp }) {
  return (
    <article>
      <span><LabelWithHelp label={label} help={helpText[label]} /></span>
      <strong>{value}</strong>
      {valueHelp && <InfoTooltip text={valueHelp} />}
    </article>
  );
}

function StrategyLineChart({ rows }) {
  return <StrategyRateChart rows={rows} />;
}

function StrategyRateChart({ rows }) {
  const [hoveredId, setHoveredId] = useState("");
  const [isolatedId, setIsolatedId] = useState("");
  const [pointTooltip, setPointTooltip] = useState(null);
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
              className="chart-line"
              fill="none"
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId("")}
              points={points}
              stroke={lineColors[seriesIndex % lineColors.length]}
              strokeOpacity={lineOpacity(item.id, hoveredId, isolatedId)}
              strokeWidth={hoveredId === item.id ? "3.8" : "2.55"}
            />
          );
        })}
        {rows.flatMap((row, rowIndex) =>
          row.series.map((point, seriesIndex) => {
            const x = padding.left + (rowIndex / Math.max(1, rows.length - 1)) * chartWidth;
            const y = height - padding.bottom - (point.conversion_rate / max) * chartHeight;
            return (
              <circle
                className="chart-point"
                cx={x}
                cy={y}
                fill={lineColors[seriesIndex % lineColors.length]}
                key={`${point.id}-${row.experiment_date}`}
                onMouseEnter={(event) => {
                  setHoveredId(point.id);
                  setPointTooltip({
                    x: event.clientX,
                    y: event.clientY,
                    text: `${point.label} - ${formatAxisDate(row.experiment_date)} - ${formatPercent(point.conversion_rate)}`,
                  });
                }}
                onMouseLeave={() => {
                  setHoveredId("");
                  setPointTooltip(null);
                }}
                opacity={lineOpacity(point.id, hoveredId, isolatedId)}
                r={hoveredId === point.id ? 4 : 2.8}
              />
            );
          })
        )}
        {rows.map((row, index) => {
          const x = padding.left + (index / Math.max(1, rows.length - 1)) * chartWidth;
          return <text className="axis-label" key={row.experiment_date} x={x} y={height - 32}>{formatAxisDate(row.experiment_date)}</text>;
        })}
      </svg>
      <div className="legend">
        {series.map((item, index) => (
          <button
            className={isolatedId === item.id ? "legend-item active" : "legend-item"}
            key={item.id}
            onClick={() => setIsolatedId((current) => (current === item.id ? "" : item.id))}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId("")}
            type="button"
          >
            <i style={{ background: lineColors[index % lineColors.length] }} />
            {item.label}
          </button>
        ))}
      </div>
      {pointTooltip && <div className="chart-tooltip" style={chartTooltipStyle(pointTooltip)}>{pointTooltip.text}</div>}
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
      <span><LabelWithHelp label={label} help={help} /></span>
      <strong>{value}</strong>
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

function formatMaybeNumber(value) {
  return typeof value === "number" ? value.toLocaleString() : "Loading";
}

function formatWholePercent(value) {
  return `${Math.round(value * 100)}%`;
}

function lineOpacity(id, hoveredId, isolatedId) {
  if (isolatedId) {
    return isolatedId === id ? 0.96 : 0.16;
  }
  if (hoveredId) {
    return hoveredId === id ? 0.96 : 0.26;
  }
  return 0.84;
}

function chartTooltipStyle(point) {
  const width = 260;
  const height = 42;
  const margin = 16;
  const left = Math.min(Math.max(point.x + 14, margin), window.innerWidth - width - margin);
  const openAbove = point.y + height + margin > window.innerHeight;
  const top = openAbove ? point.y - height - 14 : point.y + 14;
  return { left, top: Math.max(margin, top), width };
}

function formatAxisDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function LabelWithHelp({ label, help }) {
  return (
    <span className="label-with-help">
      {label}
      {help && <InfoTooltip text={help} />}
    </span>
  );
}

function InfoTooltip({ text }) {
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!open) return undefined;
    function position() {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const margin = 16;
      const width = Math.min(320, window.innerWidth - margin * 2);
      const estimatedHeight = 92;
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.min(Math.max(left, margin), window.innerWidth - width - margin);
      const openAbove = rect.bottom + estimatedHeight + margin > window.innerHeight;
      const top = openAbove ? rect.top - estimatedHeight - 8 : rect.bottom + 8;
      setStyle({
        left,
        maxHeight: `calc(100vh - ${margin * 2}px)`,
        top: Math.max(margin, top),
        width,
      });
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open]);

  return (
    <span className="tooltip-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        aria-label="Help"
        className="help-icon"
        onBlur={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        ref={buttonRef}
        type="button"
      >
        ?
      </button>
      {open && <span className="tooltip-popover" role="tooltip" style={style}>{text}</span>}
    </span>
  );
}
