"""
Test Suite: Snapshot Integrity & Failure Handling
=================================================
Validates:
1. Idempotency: Running the pipeline twice on same inputs produces identical derived fields.
2. Failure recovery: A forced Alpaca failure sets status='failed' without corrupting existing snapshot.
"""

import json
from pathlib import Path
import pytest
from scripts.daily_335pm_update import run_daily_pipeline

SNAPSHOT_PATH = Path(__file__).resolve().parent.parent / "data" / "snapshots" / "latest.json"

def test_pipeline_idempotency_on_same_inputs():
    """Validates that running derivation twice on the exact same inputs produces identical derived fields."""
    from core.derive import derive_setup, derive_position
    import pandas as pd

    quote = {"ticker": "NVDA", "name": "Nvidia", "price": 168.18, "timestamp": "2026-11-12T15:35:00-05:00"}
    chain = {"strike": 150.0, "expiry": "2026-12-18", "dte": 36, "bid": 3.15, "ask": 3.45, "iv": 0.48, "delta": -0.19, "open_interest": 4500}
    bars = pd.DataFrame({"Open": [168.0]*60, "High": [170.0]*60, "Low": [165.0]*60, "Close": [168.18]*60, "Volume": [20000000]*60})
    fund = {"fcf_yield_pct": 5.2}
    news = {"odds_model_pct": 98.5, "is_in_blackout": False}
    rules = {"cushion_min_pct": 12.0}

    # Run derivation twice
    r1 = derive_setup(quote, chain, bars, fund, news, rules)
    r2 = derive_setup(quote, chain, bars, fund, news, rules)

    assert r1.model_dump() == r2.model_dump()

    # Position derivation idempotency
    ledger = {"ticker": "INTC", "strike": 105.0, "expiry": "2026-11-13", "dte": 3, "contracts": 1, "rolls": 2, "rolls_max": 2, "open_credit": 3.47}
    p_quote = {"price": 57.59}
    opt_quote = {"bid": 47.10, "ask": 47.60, "source": "alpaca:indicative"}

    pos1 = derive_position(ledger, p_quote, opt_quote)
    pos2 = derive_position(ledger, p_quote, opt_quote)

    assert pos1.model_dump() == pos2.model_dump()

def test_missing_snapshot_shows_no_data_yet(monkeypatch):
    """Validates Acceptance Check 4: Deleting/missing snapshot yields None (No data yet), never a fake date."""
    import app
    monkeypatch.setattr(app, "load_latest_snapshot", lambda: None)
    
    # Temporarily hide last_update.json
    from unittest.mock import patch
    with patch.object(Path, "exists", return_value=False):
        meta = app.load_daily_metadata()
        assert meta is None, "Missing snapshot must return None to trigger 'No data yet' state"

def test_forced_alpaca_failure_handling():
    # Ensure a valid latest snapshot exists first
    run_daily_pipeline(force_alpaca_fail=False)
    assert SNAPSHOT_PATH.exists()
    
    with open(SNAPSHOT_PATH, "r", encoding="utf-8") as f:
        prev_snapshot_data = json.load(f)

    # Trigger forced failure run
    fail_snapshot = run_daily_pipeline(force_alpaca_fail=True)
    assert fail_snapshot.run.status == "failed"
    assert len(fail_snapshot.run.errors) > 0

    # Verify latest.json was NOT overwritten by the failed run
    with open(SNAPSHOT_PATH, "r", encoding="utf-8") as f:
        current_snapshot_data = json.load(f)

    assert current_snapshot_data["run"]["status"] in ["ok", "partial"]
    assert current_snapshot_data["run"]["run_id"] == prev_snapshot_data["run"]["run_id"]
