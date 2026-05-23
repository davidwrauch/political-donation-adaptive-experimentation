from pathlib import Path
import csv
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.simulation import generate_experiment  # noqa: E402


def main() -> None:
    experiment = generate_experiment(seed=2026, n=3200, exploration_rate=0.18)
    out = ROOT / "data" / "supporter_experiment_events.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    rows = experiment["events"]
    with out.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} events to {out}")


if __name__ == "__main__":
    main()
