import React, { useEffect, useRef, useState } from "react";

const lineColors = ["#6d7a80", "#2e8f7f", "#a16a2a", "#3f6f9f", "#8b4b66"];
const helpText = {
  "Current leading strategy": "The strategy with the highest net donation value per contact in this simulated experiment.",
  "Net donation value per contact": "Average dollars raised per person contacted, after combining conversion rate, average donation amount, and fatigue penalty.",
  "Donation conversion rate": "Share of contacted people who are expected to donate.",
  "Average donation amount": "Average expected donation size among contacted supporters in this simulation.",
  "Probability best": "Probability best estimates how likely the current leading strategy is to outperform the others if the experiment continues. In this prototype, high confidence means roughly 80-90% probability best plus stable performance over additional batches. Traditional statistical significance can still be reported separately.",
  "Additional contacts before high-confidence rollout": "Estimated number of additional outreach contacts needed before the result is reliable enough for broad rollout.",
  "Recommendation status": "Plain-English rollout guidance based on current simulated confidence and whether the campaign should keep learning.",
  "Rollout confidence status": "Plain-English rollout guidance based on current simulated confidence and whether the campaign should keep learning.",
  "Adaptive lift vs control": "Estimated improvement versus generic non-personalized outreach.",
  "Total contacts observed": "Total simulated supporter contacts included in the current dashboard readout.",
  "Control contacts": "Number of simulated contacts assigned to generic non-personalized outreach.",
  "Contacts observed": "Number of simulated supporter contacts assigned to this strategy so far.",
  "Contacts assigned to this strategy": "Number of simulated supporter contacts assigned to the current leading strategy.",
  "Traffic share": "Current share of simulated outreach traffic allocated to this strategy.",
  "Net expected value": "Estimated donation value after accounting for response rate, average donation amount, and fatigue effects.",
  "Fatigue risk": "Estimated risk that repeated outreach reduces future response or increases opt-outs.",
  "Control": "Generic non-personalized outreach with fixed messaging and no adaptive allocation.",
  "Static randomized test": "Randomly splits traffic across approved message/channel combinations, but does not adapt allocation based on results.",
  "Directional only": "Directional only means the current leader is promising, but the evidence is not strong enough to shift all traffic to it yet.",
  "Promising but keep testing": "The current winner looks encouraging, but the campaign should keep learning before shifting most traffic.",
  "Ready to scale": "The leading strategy has remained strong enough in the simulation to justify broader rollout with monitoring.",
  "Statistically significant?": "Traditional statistical significance asks whether the observed winner is unlikely to be ahead because of random chance. This prototype also uses probability-best because live adaptive experiments need readable decision signals before final confirmation.",
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
];

export default function OverviewTab({ overview }) {
  const [paused, setPaused] = useState(false);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [nextUpdateIn, setNextUpdateIn] = useState(5);
  const snapshots = overview?.strategy_status_timeline ?? [];
  const activeIndex = snapshots.length ? Math.min(visibleIndex, snapshots.length - 1) : 0;
  const snapshot = snapshots[activeIndex];
  const strategies = snapshot?.strategy_performance ?? overview?.strategy_performance ?? defaultStrategies;
  const readout = snapshot?.current_readout ?? overview?.current_readout;
  const chartRows = overview?.strategy_rate_timeline?.slice(0, activeIndex + 1) ?? [];
  const allocationRows = overview?.traffic_allocation_timeline?.slice(0, activeIndex + 1) ?? [];
  const probabilityBest = readout?.bayesian_confidence?.probability_best ?? 0;
  const lastUpdated = snapshot?.experiment_date ? formatAxisDate(snapshot.experiment_date) : "";
  const simulationComplete = Boolean(snapshots.length && activeIndex >= snapshots.length - 1);
  const progress = snapshot?.progress ?? (simulationComplete ? 1 : 0);

  useEffect(() => {
    if (!overview) return undefined;
    setVisibleIndex(Math.min(1, Math.max(0, snapshots.length - 1)));
    setNextUpdateIn(5);
  }, [overview, snapshots.length]);

  useEffect(() => {
    if (!overview || paused || !snapshots.length) return undefined;
    const timer = window.setInterval(() => {
      setVisibleIndex((current) => (current >= snapshots.length - 1 ? current : current + 1));
      setNextUpdateIn(5);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [overview, paused, snapshots.length]);

  useEffect(() => {
    if (!overview || paused) return undefined;
    const countdown = window.setInterval(() => {
      setNextUpdateIn((current) => (current <= 1 ? 5 : current - 1));
    }, 1000);
    return () => window.clearInterval(countdown);
  }, [overview, paused]);

  return (
    <div className="tab-panel">
      <section className="panel intro-card">
        <p>
          A New York Democratic campaign is testing donation outreach before scaling donation outreach.
          This dashboard compares Control plus three allocation strategies to see which approach allocates limited contacts most
          effectively across messages, audience segments, and channels. It does not declare one global best message
          because adaptive campaigns assign different messages to different people. The simulation updates quickly so
          the tradeoff between learning and scaling is visible during a short demo.
        </p>
      </section>

      {readout && (
        <LiveSimulationStatus
          lastUpdated={lastUpdated}
          nextUpdateIn={nextUpdateIn}
          onFastForward={() => {
            setVisibleIndex(Math.max(0, snapshots.length - 1));
            setPaused(true);
            setNextUpdateIn(0);
          }}
          onReplay={() => {
            setVisibleIndex(Math.min(1, Math.max(0, snapshots.length - 1)));
            setPaused(false);
            setNextUpdateIn(5);
          }}
          onTogglePaused={() => setPaused((current) => !current)}
          paused={paused}
          progress={progress}
          simulationComplete={simulationComplete}
        />
      )}

      <ExperimentStatus
        lastUpdated={lastUpdated}
        nextUpdateIn={nextUpdateIn}
        onFastForward={() => {
          setVisibleIndex(Math.max(0, snapshots.length - 1));
          setPaused(true);
          setNextUpdateIn(0);
        }}
        onTogglePaused={() => setPaused((current) => !current)}
        paused={paused}
        progress={progress}
        readout={readout}
        onReplay={() => {
          setVisibleIndex(Math.min(1, Math.max(0, snapshots.length - 1)));
          setPaused(false);
          setNextUpdateIn(5);
        }}
        simulationComplete={simulationComplete}
        strategies={strategies}
      />

      {!overview ? (
        <section className="panel loading">Loading campaign donation experiment results...</section>
      ) : (
        <>
          <StrategyRateChart allocationRows={allocationRows} probabilityBest={probabilityBest} rows={chartRows} strategies={strategies} />
        </>
      )}
    </div>
  );
}

function ExperimentStatus({ strategies, readout, paused, onTogglePaused, lastUpdated, nextUpdateIn, onReplay, simulationComplete, onFastForward, progress }) {
  const leadingId = readout?.leading_strategy?.id;
  return (
    <section className="experiment-status" aria-label="Current experiment status">
      <CurrentReadout
        lastUpdated={lastUpdated}
        nextUpdateIn={nextUpdateIn}
        onFastForward={onFastForward}
        onReplay={onReplay}
        onTogglePaused={onTogglePaused}
        paused={paused}
        progress={progress}
        readout={readout}
        simulationComplete={simulationComplete}
      />
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
  const statusClass = allocationStatusClass(strategy.allocation_status);
  return (
    <article className={`${isLeader ? "panel strategy-metric-card leader-card" : "panel strategy-metric-card"} ${strategyGroupClass(strategy.id)}`}>
      <div className="card-title-row">
        <div>
          <span className="strategy-group-label">{strategyGroupLabel(strategy.id)}</span>
          <h3>{strategy.label}</h3>
        </div>
        {isLeader && <span className="leader-pill winning">Current leader</span>}
      </div>
      <p>{strategy.description}</p>
      <div className="strategy-metric-list">
        <Metric label="Net donation value per contact" value={formatMaybeMoney(strategy.net_expected_value)} />
        <Metric label="Donation conversion rate" value={formatMaybePercent(strategy.conversion_rate)} />
        <Metric
          label="Fatigue risk"
          value={formatMaybePercent(strategy.fatigue_risk)}
          help="Estimated risk that repeated outreach reduces future response or causes opt-outs."
        />
        <Metric label="Contacts observed" value={formatMaybeNumber(strategy.contacts_observed)} />
        <div className="allocation-box">
          <Metric label="Traffic share" value={formatMaybePercent(strategy.traffic_share)} />
          <Metric className={`allocation-status ${statusClass}`} label="Allocation status" value={strategy.allocation_status ?? "Loading"} />
        </div>
      </div>
    </article>
  );
}

function CurrentReadout({ readout, paused, onTogglePaused, lastUpdated, nextUpdateIn, onReplay, simulationComplete, onFastForward, progress }) {
  if (!readout) {
    return (
      <section className="panel current-readout readiness-card">
        <div>
          <p className="eyebrow">Current experiment status</p>
          <p>Loading live experiment metrics. The strategy cards below are available immediately and will fill in current results when the API responds.</p>
        </div>
      </section>
    );
  }
  const contactsNeeded = readout.estimated_additional_contacts_needed;
  return (
    <section className="panel current-readout readiness-card">
      <div className="readout-intro">
        <p className="eyebrow">Current experiment status</p>
      </div>
      <div className="executive-scope-grid">
        <section className="scope-card">
          <h3>Campaign-wide experiment status</h3>
          <div className="confidence-highlight">
            <ReadoutMetric
              label="Probability best"
              value={`${Math.round(readout.bayesian_confidence.probability_best * 100)}% simulated`}
            />
            <ReadoutMetric label="Rollout confidence status" value={readout.recommendation_status} valueHelp={helpText[readout.recommendation_status]} />
          </div>
          <div className="readout-grid compact">
            <ReadoutMetric label="Total contacts observed" value={readout.total_contacts_observed.toLocaleString()} />
            <ReadoutMetric
              label="Additional contacts before high-confidence rollout"
              value={contactsNeeded > 0 ? `~${contactsNeeded.toLocaleString()}` : "0"}
            />
            <ReadoutMetric label="Adaptive lift vs control" value={formatMoney(readout.adaptive_lift_vs_control)} />
            <ReadoutMetric label="Statistically significant?" value={formatSignificanceCheck(readout.frequentist_check)} />
          </div>
        </section>
        <section className="scope-card leading-scope">
          <h3>Current leading strategy performance</h3>
          <p>Metrics below refer only to the current leading strategy.</p>
          <article className="winner-focus">
            <span><LabelWithHelp label="Current leading strategy" help={helpText["Current leading strategy"]} /></span>
            <strong>{readout.leading_strategy.label}</strong>
          </article>
          <div className="readout-grid compact">
            <ReadoutMetric label="Net donation value per contact" value={formatMoney(readout.leading_strategy.net_expected_value)} />
            <ReadoutMetric label="Donation conversion rate" value={formatPercent(readout.leading_strategy.conversion_rate)} />
            <ReadoutMetric label="Average donation amount" value={formatMoney(readout.leading_strategy.expected_donation_amount)} />
            <ReadoutMetric label="Fatigue risk" value={formatPercent(readout.leading_strategy.fatigue_risk)} />
            <ReadoutMetric label="Contacts assigned to this strategy" value={readout.leading_strategy.contacts_observed.toLocaleString()} />
          </div>
        </section>
      </div>
      <section className="reliability-note">
        <h3>How reliable is the current winner?</h3>
        <p>
          Do not send 100% of traffic to the current winner unless confidence is high. High confidence generally means
          the leading strategy has remained stable over additional traffic and reached roughly 80-90% simulated
          probability best. Traditional statistical significance can still be reported in a real deployment, but this
          prototype uses Bayesian-style probability best because it is easier to interpret for live allocation decisions.
        </p>
      </section>
    </section>
  );
}

function LiveSimulationStatus({ paused, onTogglePaused, lastUpdated, nextUpdateIn, simulationComplete, onReplay, onFastForward, progress }) {
  return (
    <div className={paused ? "live-status paused" : "live-status running"}>
      <div>
        <strong>{simulationComplete ? "Simulation complete" : paused ? "Simulation paused" : "Live simulation running"}</strong>
        <span>Last updated: {lastUpdated || "Loading"}</span>
        <span>{simulationComplete ? "Winner locked in" : paused ? "Updates paused" : `Next update in ${nextUpdateIn}s`}</span>
        <span>Simulation progress: {formatWholePercent(progress)}</span>
      </div>
      <div className="simulation-progress" aria-label={`Simulation progress ${formatWholePercent(progress)}`}>
        <i style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      {simulationComplete ? (
        <button onClick={onReplay} type="button">Replay simulation</button>
      ) : (
        <div className="live-actions">
          <button onClick={onTogglePaused} type="button">{paused ? "Resume updates" : "Pause updates"}</button>
          <button onClick={onFastForward} type="button">Fast forward to winner</button>
        </div>
      )}
    </div>
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
  return <StrategyRateChart rows={rows} strategies={[]} />;
}

function StrategyRateChart({ rows, strategies, allocationRows = [], probabilityBest = 0 }) {
  const [hoveredId, setHoveredId] = useState("");
  const [isolatedId, setIsolatedId] = useState("");
  const [pointTooltip, setPointTooltip] = useState(null);
  const series = rows[0]?.series ?? [];
  const trafficByStrategy = Object.fromEntries(strategies.map((strategy) => [strategy.id, strategy.traffic_share]));
  const trafficByDate = Object.fromEntries(
    allocationRows.map((row) => [
      row.experiment_date,
      Object.fromEntries(row.series.map((point) => [point.id, point.traffic_share])),
    ])
  );
  const max = 12;
  const width = 820;
  const height = 316;
  const padding = { top: 34, right: 36, bottom: 74, left: 86 };
  const ticks = [0, 2, 4, 6, 8, 10, 12];
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  return (
    <section className="panel line-panel">
      <div className="chart-heading">
        <div>
          <h2>Net donation value per contact over time by allocation strategy</h2>
          <p>X-axis: dates. Y-axis: net donation value per contact. Line thickness reflects current traffic allocation share.</p>
          <p className="chart-helper">Thicker lines indicate higher traffic allocation as the experiment shifts outreach toward stronger-performing strategies.</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Net donation value per contact over time by allocation strategy">
        <text className="axis-title" x={padding.left + chartWidth / 2} y={height - 10}>Date</text>
        <text className="axis-title y-title" x="20" y={padding.top + chartHeight / 2}>Net value</text>
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} className="axis" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} className="axis" />
        {ticks.map((tick) => {
          const y = height - padding.bottom - (tick / max) * chartHeight;
          return (
            <g key={tick}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} className="grid-line" />
              <text className="axis-label y-axis-label" x={padding.left - 12} y={y + 4}>{formatMoneyNoDecimals(tick)}</text>
            </g>
          );
        })}
        {series.map((item, seriesIndex) => {
          const points = rows
            .map((row, rowIndex) => {
              const value = row.series.find((point) => point.id === item.id)?.net_expected_value ?? 0;
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
              strokeWidth={lineWidth(trafficByStrategy[item.id] ?? 0, hoveredId === item.id)}
            />
          );
        })}
        {rows.flatMap((row, rowIndex) =>
          row.series.map((point, seriesIndex) => {
            const x = padding.left + (rowIndex / Math.max(1, rows.length - 1)) * chartWidth;
            const y = height - padding.bottom - (point.net_expected_value / max) * chartHeight;
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
                    text: `${point.label}\n${formatAxisDate(row.experiment_date)}\nNet value/contact: ${formatMoney(point.net_expected_value)}\nTraffic allocation: ${formatWholePercent(trafficByDate[row.experiment_date]?.[point.id] ?? trafficByStrategy[point.id] ?? 0)}\nProbability best: ${formatWholePercent(probabilityBest)}`,
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
          return (
            <text className="axis-label x-axis-label" key={row.experiment_date} transform={`translate(${x}, ${height - 32}) rotate(-38)`}>
              {formatAxisDate(row.experiment_date)}
            </text>
          );
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
            {item.label} — {formatPercent(trafficByStrategy[item.id] ?? 0)} traffic
          </button>
        ))}
      </div>
      {pointTooltip && <div className="chart-tooltip" style={chartTooltipStyle(pointTooltip)}>{pointTooltip.text}</div>}
    </section>
  );
}

function Metric({ label, value, help, className = "" }) {
  return (
    <div className={className}>
      <span><LabelWithHelp label={label} help={help} /></span>
      <strong>{value}</strong>
    </div>
  );
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function formatMoneyNoDecimals(value) {
  return `$${Number(value).toFixed(0)}`;
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

function formatSignificanceCheck(check) {
  if (!check) return "Loading";
  return check.statistically_significant ? "Yes" : "Not yet";
}

function strategyGroupLabel(id) {
  if (id === "control") return "Control";
  if (id === "static_ab") return "Static benchmark";
  return "Adaptive strategy";
}

function strategyGroupClass(id) {
  if (id === "control") return "control-group";
  if (id === "static_ab") return "static-group";
  return "adaptive-group";
}

function allocationStatusClass(status = "") {
  const normalized = status.toLowerCase();
  if (normalized.includes("reduced") || normalized.includes("low")) return "status-reduced";
  if (normalized.includes("leader") || normalized.includes("scale") || normalized.includes("active")) return "status-active";
  return "status-monitor";
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

function lineWidth(trafficShare, isHovered) {
  const base = 1.5 + Math.min(trafficShare, 1) * 3.5;
  return Math.min(5, base + (isHovered ? 0.55 : 0)).toFixed(2);
}

function chartTooltipStyle(point) {
  const width = 260;
  const height = 132;
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
