# Adaptive Ballot Chase

Adaptive Ballot Chase is a contextual bandit prototype for prioritizing mail-ballot follow-up using uplift, contactability, fatigue, and county-level opportunity signals.

The demo simulates voters who requested mail ballots but have not yet returned them. The system estimates who is most movable, which reminder or channel is most appropriate, and whether adaptive allocation is outperforming a static baseline and a Control / holdout group.

This is a prototype / simulation / portfolio project, not production political technology, not an election prediction model, and not an autonomous persuasion system.

## Technical Stack

- Python
- FastAPI
- React
- Vite
- Lightweight synthetic data generation
- Contextual bandit-style adaptive allocation
- Deterministic template-based AI review workflow

## What It Demonstrates

- Adaptive experimentation for turnout operations
- Ballot chase prioritization
- Uplift / movability thinking
- Contactability and fatigue-aware outreach
- County and district opportunity monitoring
- Intervention/channel optimization
- Human-reviewed AI-assisted reminder adaptation
- Offline What If policy simulation

## Scenario

A New York Democratic campaign is running a ballot chase program. Every voter in the simulated universe has requested a mail ballot but has not yet returned it. The campaign has limited staff, volunteer, and paid-contact capacity, so it should not chase every outstanding ballot equally.

The core question is:

> Which voters are most likely to return their ballot because of the right contact?

## Simulated Voter Fields

Each generated voter includes:

- `voter_id`
- `county`
- `district`
- `support_score`
- `turnout_score`
- `ballot_requested_date`
- `ballot_returned`
- `days_since_request`
- `contactability_score`
- `fatigue_score`
- `prior_contact_count`
- `prior_vote_history`
- `preferred_channel`
- `baseline_return_probability`
- `estimated_return_probability_if_contacted`
- `uplift_score`
- `recommended_intervention`
- `urgency_score`
- `assignment_probability`
- `adaptive_policy_group`

## Interventions

The simulation compares approved ballot-chase interventions:

1. SMS reminder
2. Volunteer call
3. Door knock
4. Candidate call
5. Email reminder
6. Suppress / do not contact

## Allocation Strategies

The Overview compares:

1. Control / holdout
2. Static randomized test
3. LinUCB adaptive strategy

Control / holdout uses generic reminders with no adaptive allocation. Static randomized test splits contacts across approved interventions and channels. LinUCB uses voter context such as support, turnout, contactability, urgency, fatigue, and county opportunity to prioritize outreach.

## Key Metrics

- Outstanding ballots
- High-priority chase targets
- Estimated additional returned ballots
- Average uplift
- Top county opportunity
- Fatigue-risk voters suppressed
- Recommended contacts by channel
- Adaptive vs static estimated lift

## What If Tab

The What If tab is an offline policy simulation. It lets campaign leadership change turnout priorities and estimate how those choices would have shifted returned ballots, contact fatigue, and county-level opportunity on the simulated historical log.

It is decision support, not causal proof. Estimates are strongest when the logged experiment explored similar actions with enough assignment probability overlap.

## AI Review

The AI review surface demonstrates constrained, deterministic reminder adaptation. It does not call external LLM APIs and does not send messages automatically. Staff must review reminder language, intervention type, and suppression choices before execution.

## Run Locally

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Hosted backend build command:

```bash
pip install -r backend/requirements.txt
```

Hosted backend start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Production build:

```bash
cd frontend
npm run build
```

Hosted frontend build command:

```bash
npm install && npm run build
```

Tests:

```bash
pytest
```
