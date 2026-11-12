"""
Test Suite: Snapshot Reconciliation
====================================
Loads data/snapshots/latest.json and verifies that every single derived field
matches the exact calculation from its raw components to within 1e-6.
"""

import json
from pathlib import Path
import pytest

SNAPSHOT_PATH = Path(__file__).resolve().parent.parent / "data" / "snapshots" / "latest.json"

@pytest.fixture
def latest_snapshot():
    if not SNAPSHOT_PATH.exists():
        # Generate initial snapshot if not present
        from scripts.daily_335pm_update import run_daily_pipeline
        run_daily_pipeline()
    with open(SNAPSHOT_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_reconcile_setups_raw_inputs(latest_snapshot):
    setups = latest_snapshot.get("setups", [])
    assert len(setups) > 0, "Snapshot must contain at least one setup to reconcile"

    for s in setups:
        spot = s["spot"]
        strike = s["strike"]
        bid = s["bid"]
        ask = s["ask"]
        dte = s["dte"]

        # Recompute derived metrics from raw numbers
        recalc_cushion = round(((spot - strike) / spot) * 100.0, 1)
        recalc_credit = round(bid * 100.0, 2)
        recalc_collateral = round(strike * 100.0, 2)
        recalc_cost_basis = round(strike - bid, 2)
        recalc_roc_cycle = round((bid / strike) * 100.0, 2)
        recalc_roc_annual = round(recalc_roc_cycle * (365.0 / max(1, dte)), 1)
        recalc_mid = round((bid + ask) / 2.0, 2)
        recalc_tp50 = round(bid * 0.50, 2)
        recalc_tp60 = round(bid * 0.40, 2)
        recalc_roll_trigger = round(strike * 1.02, 2)

        # Match to 1e-6
        assert s["cushion_pct"] == pytest.approx(recalc_cushion, abs=1e-6), f"{s['ticker']} cushion mismatch"
        assert s["credit"] == pytest.approx(recalc_credit, abs=1e-6), f"{s['ticker']} credit mismatch"
        assert s["collateral"] == pytest.approx(recalc_collateral, abs=1e-6), f"{s['ticker']} collateral mismatch"
        assert s["cost_basis"] == pytest.approx(recalc_cost_basis, abs=1e-6), f"{s['ticker']} cost basis mismatch"
        assert s["roc_cycle_pct"] == pytest.approx(recalc_roc_cycle, abs=1e-6), f"{s['ticker']} roc cycle mismatch"
        assert s["roc_annual_pct"] == pytest.approx(recalc_roc_annual, abs=1e-6), f"{s['ticker']} roc annual mismatch"
        assert s["mid"] == pytest.approx(recalc_mid, abs=1e-6), f"{s['ticker']} mid mismatch"
        assert s["plan"]["tp50"] == pytest.approx(recalc_tp50, abs=1e-6), f"{s['ticker']} tp50 mismatch"
        assert s["plan"]["tp60"] == pytest.approx(recalc_tp60, abs=1e-6), f"{s['ticker']} tp60 mismatch"
        assert s["plan"]["roll_trigger_price"] == pytest.approx(recalc_roll_trigger, abs=1e-6), f"{s['ticker']} roll trigger mismatch"

def test_reconcile_positions_raw_inputs(latest_snapshot):
    positions = latest_snapshot.get("positions", [])
    assert len(positions) > 0, "Snapshot must contain real positions to reconcile"

    for p in positions:
        spot = p["spot"]
        strike = p["strike"]
        open_credit = p["open_credit"]
        mark_bid = p["mark_bid"]
        mark_ask = p["mark_ask"]
        contracts = p["contracts"]

        recalc_mid = round((mark_bid + mark_ask) / 2.0, 2)
        recalc_pnl = round((open_credit - recalc_mid) * 100.0 * contracts, 2)
        recalc_spot_vs_strike = round(((spot - strike) / strike) * 100.0, 1)

        assert p["mark_mid"] == pytest.approx(recalc_mid, abs=1e-6), f"{p['ticker']} mark_mid mismatch"
        assert p["pnl"] == pytest.approx(recalc_pnl, abs=1e-6), f"{p['ticker']} pnl mismatch"
        assert p["spot_vs_strike_pct"] == pytest.approx(recalc_spot_vs_strike, abs=1e-6), f"{p['ticker']} spot vs strike mismatch"
