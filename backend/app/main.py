from __future__ import annotations

from functools import lru_cache
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .services.ai_synthesis import synthesize_recommendation
from .services.simulation import generate_experiment, summarize_experiment


def get_cors_origins() -> list[str]:
    defaults = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    configured = [
        origin.strip().rstrip("/")
        for origin in os.getenv("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]
    return configured + [origin for origin in defaults if origin not in configured]


app = FastAPI(title="Political Donation Adaptive Experimentation Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
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
