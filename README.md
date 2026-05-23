# Political Donation Adaptive Experimentation Platform

A production-style prototype for adaptive campaign fundraising experiments that learns which donation messages, audience segments, and channels perform best while monitoring donor fatigue and expected donation value.

## What This Is

This is a lightweight interactive prototype for campaign fundraising and civic engagement experimentation. It simulates supporter records, assigns donation message frames across channels, observes synthetic donation outcomes, and summarizes which audiences, messages, and contact modes appear most promising.

The demo is inspired by three ideas:

- Campaign data science is mainly **resource allocation and optimization**, not election prediction.
- Donation solicitation can be modeled as a **contextual bandit** problem: different profiles receive different message treatments and the system learns which appeals perform best.
- Campaign analytics should translate research and modeling into clear outreach decisions: effective message frames, priority cohorts, and efficient channel allocation.

This is not production political technology. It is a portfolio simulation designed to explain adaptive experimentation, donation propensity thinking, message-frame testing, channel optimization, and human-reviewed AI-assisted recommendations.

## Technical Stack

- Python
- FastAPI
- React
- Vite
- pandas
- scikit-learn optional
- lightweight synthetic simulation data

## Product Framing

The prototype tests donation appeals across:

- Audience segments
- Issue affinities
- Message frames
- Outreach channels
- Donor fatigue risk
- Expected donation value

The app has four focused tabs:

- **Overview:** campaign experiment metrics, best message frame, best segment, channel performance, fatigue warning, and simple charts.
- **Experiment Design:** practical setup notes for audience data, message arms, channels, outcomes, assignment logic, fatigue guardrails, and leadership questions.
- **AI:** deterministic campaign research synthesis from approved templates and historical segment performance.
- **About:** project purpose, inspiration, and boundaries.

## Simulated Supporter Data

Each generated supporter has:

- `supporter_id`
- `age_band`
- `geography_type`
- `prior_donation_count`
- `prior_total_donated`
- `recent_engagement_score`
- `volunteer_history`
- `issue_affinity`
- `channel_preference`
- `political_engagement_level`
- `donor_fatigue_score`
- `civic_engagement_score`

## Message Frames

The experiment tests six donation message frames:

- Economic fairness
- Anti-corruption / accountability
- Democracy protection
- Affordability / cost of living
- Local community investment
- Candidate momentum / urgency

Channels:

- Email
- SMS
- Phone
- Digital ad

## Decision Engine

The assignment engine is intentionally simple and explainable. It uses segment-level beta priors in a Thompson-sampling-inspired style, combined with issue affinity, channel preference, and donor fatigue penalties.

It chooses and explains:

- Which message frame to send
- Which channel to use
- Which audience segment is highest priority
- Expected reward
- Uncertainty
- Exploration need
- Fatigue penalty
- Channel fit

It does **not** implement OPE, IPS, SNIPS, doubly robust estimation, or advanced causal claims.

## What It Demonstrates

- Adaptive experimentation
- Donation propensity thinking
- Message-frame testing
- Audience segmentation
- Channel optimization
- Campaign resource allocation
- Donor fatigue monitoring
- Human-reviewed AI-assisted recommendations

## Dashboard Flow

The Overview tab is designed to feel like a campaign experimentation control room. It leads with the donation conversion rate, expected donation value, best-performing frame, best segment, best channel, current exploration rate, donor fatigue warning, and recommended next allocation. A large cumulative conversion chart shows how message frames perform across experiment batches.

The Experiment Design tab answers, "How would we actually run this?" It keeps the demo practical for campaign leadership: available channels, audience data, approved message arms, outcome definitions, sample-size caveats, fatigue guardrails, human approval, and what should not be automated.

The AI tab is campaign messaging and research synthesis, not generic AI. It retrieves approved templates and prior segment performance, then produces a deterministic recommendation that requires human review.

## Run Locally

Create and activate a Python environment:

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r backend/requirements.txt
```

Run the API:

```powershell
$env:PYTHONPATH="backend"
uvicorn app.main:app --reload
```

Start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open:

- Dashboard: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`

Generate a local CSV of synthetic experiment events:

```powershell
python scripts/generate_demo_data.py
```

Run tests:

```powershell
pytest
```

## Interview-Friendly Explanation

Most campaign analytics examples focus on prediction. This prototype focuses on decisions: if campaign resources are scarce, which audience should receive which donation message through which channel?

The system simulates a controlled donation-message experiment and shows how an adaptive assignment engine can learn from response patterns while still remaining transparent. The AI tab is deliberately constrained: it retrieves approved templates and segment performance evidence, then generates a short rationale that requires human review.

That makes the project easy to explain:

- The campaign wants 3-4 high-performing message frames.
- The campaign needs priority cohorts, not just global averages.
- Channels matter because email, SMS, phone, and digital ads have different response and fatigue profiles.
- Donation conversion is the primary metric, but expected value and fatigue risk shape whether an outreach strategy is responsible.

## Boundaries

This is:

- A prototype
- A simulation
- A portfolio project
- A human-reviewed experimentation demo

This is not:

- An election prediction model
- A production campaign targeting system
- An autonomous persuasion system
- A replacement for compliance, legal review, or campaign governance
