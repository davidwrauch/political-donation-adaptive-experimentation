import React from "react";

export default function OverviewTab({ overview }) {
  return (
    <div className="tab-panel">
      <section className="panel narrative">
        <h2>What the system is optimizing</h2>
        <p>{overview.plain_english}</p>
      </section>

      <section className="metric-grid">
        <Metric label="Simulated supporters" value={overview.total_supporters.toLocaleString()} />
        <Metric label="Active experiment arms" value={overview.active_arms} />
        <Metric label="Donation conversion rate" value={formatPercent(overview.primary_metric.value)} />
        <Metric label="Expected donation amount" value={formatMoney(overview.secondary_metrics.expected_donation_amount)} />
        <Metric label="Net expected value" value={formatMoney(overview.secondary_metrics.net_expected_donation_value)} />
        <Metric label="Exploration rate" value={formatPercent(overview.exploration_rate)} />
      </section>

      <section className="panel decision-strip">
        <div>
          <span>Best-performing message frame</span>
          <strong>{overview.best_message_frame.label}</strong>
        </div>
        <div>
          <span>Best-performing segment</span>
          <strong>{overview.best_segment.label}</strong>
        </div>
        <div>
          <span>Donor fatigue warning</span>
          <strong className={overview.donor_fatigue_warning ? "warning" : "stable"}>
            {overview.donor_fatigue_warning ? "Monitor closely" : "Stable"}
          </strong>
        </div>
      </section>

      <section className="chart-grid">
        <BarChart
          title="Message performance"
          rows={overview.message_performance}
          valueKey="conversion_rate"
          formatter={formatPercent}
        />
        <BarChart
          title="Segment performance"
          rows={overview.segment_performance}
          valueKey="net_expected_value"
          formatter={formatMoney}
        />
      </section>

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

function Metric({ label, value }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
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
