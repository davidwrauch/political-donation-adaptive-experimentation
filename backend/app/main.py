from __future__ import annotations

from functools import lru_cache

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .services.ai_synthesis import synthesize_recommendation
from .services.simulation import generate_experiment, summarize_experiment

app = FastAPI(title="Political Donation Adaptive Experimentation Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def demo_experiment() -> dict:
    return generate_experiment(seed=2026, n=3200, exploration_rate=0.18)


@lru_cache(maxsize=1)
def demo_summary() -> dict:
    return summarize_experiment(demo_experiment())


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/overview")
def overview() -> dict:
    return demo_summary()


@app.get("/api/supporters/sample")
def sample_supporters(limit: int = 12) -> dict:
    supporters = demo_experiment()["supporters"][: max(1, min(limit, 50))]
    return {"supporters": supporters}


@app.get("/api/ai/recommendation")
def ai_recommendation() -> dict:
    return synthesize_recommendation(demo_summary())
