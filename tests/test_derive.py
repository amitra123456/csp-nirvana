"""
Test Suite: Fixed Fixtures for core/derive.py
=============================================
Validates exact mathematical derivation of all Setup and Position metrics.
"""

import math
import pytest
import pandas as pd
from core.derive import derive_setup, derive_position

def test_derive_setup_exact_fixtures():
    # Fixed known inputs
    spot = 100.0
    strike = 88.0
    bid = 1.84
    ask = 1.96
    dte = 38
    iv = 0.45
    delta = -0.174
    open_interest = 1240

    quote = {
        "ticker": "NOW",
        "name": "ServiceNow",
        "price": spot,
        "timestamp": "2026-11-12T15:35:00-05:00"
    }
    chain_row = {
        "strike": strike,
        "expiry": "2026-12-18",
        "dte": dte,
        "bid": bid,
        "ask": ask,
        "iv": iv,
        "delta": delta,
        "open_interest": open_interest
    }
    # Minimal synthetic bars for testing levels
    bars = pd.DataFrame({
        "Open": [100.0] * 60,
        "High": [105.0] * 60,
        "Low": [95.0] * 60,
        "Close": [100.0] * 60,
        "Volume": [1000000] * 60
    })
    fundamentals = {"fcf_yield_pct": 4.5}
    news = {"odds_model_pct": 99.0, "is_in_blackout": False}
    rules = {"cushion_min_pct": 12.0}

    setup = derive_setup(quote, chain_row, bars, fundamentals, news, rules)

    # 1. Exact mathematical checks
    expected_cushion = round(((100.0 - 88.0) / 100.0) * 100.0, 1)  # 12.0
    expected_credit = 184.0                                         # 1.84 * 100
    expected_collateral = 8800.0                                    # 88.0 * 100
    expected_cost_basis = 86.16                                     # 88.0 - 1.84
    expected_roc_cycle = round((1.84 / 88.0) * 100.0, 2)            # 2.09
    expected_roc_annual = round(expected_roc_cycle * (365.0 / 38), 1) # 20.1
    expected_mid = round((1.84 + 1.96) / 2.0, 2)                   # 1.90
    expected_tp50 = 0.92                                            # 1.84 * 0.50
    expected_tp60 = 0.74                                            # 1.84 * 0.40
    expected_roll_trigger = round(88.0 * 1.02, 2)                  # 89.76

    assert setup.cushion_pct == pytest.approx(expected_cushion, abs=1e-6)
    assert setup.credit == pytest.approx(expected_credit, abs=1e-6)
    assert setup.collateral == pytest.approx(expected_collateral, abs=1e-6)
    assert setup.cost_basis == pytest.approx(expected_cost_basis, abs=1e-6)
    assert setup.roc_cycle_pct == pytest.approx(expected_roc_cycle, abs=1e-6)
    assert setup.roc_annual_pct == pytest.approx(expected_roc_annual, abs=1e-6)
    assert setup.mid == pytest.approx(expected_mid, abs=1e-6)
    assert setup.plan.tp50 == pytest.approx(expected_tp50, abs=1e-6)
    assert setup.plan.tp60 == pytest.approx(expected_tp60, abs=1e-6)
    assert setup.plan.roll_trigger_price == pytest.approx(expected_roll_trigger, abs=1e-6)

def test_derive_position_exact_fixtures():
    # Fixed known ledger row and quotes matching contract specifications
    ledger_row = {
        "ticker": "INTC",
        "strike": 105.0,
        "expiry": "2026-11-13",
        "dte": 3,
        "contracts": 1,
        "rolls": 2,
        "rolls_max": 2,
        "open_credit": 3.47
    }
    quote = {"price": 57.59}
    option_quote = {
        "bid": 47.10,
        "ask": 47.60,
        "source": "alpaca:indicative"
    }

    pos = derive_position(ledger_row, quote, option_quote)

    expected_mid = round((47.10 + 47.60) / 2.0, 2)           # 47.35
    expected_pnl = round((3.47 - 47.35) * 100.0 * 1, 2)       # -4388.0
    expected_spot_vs_strike = round(((57.59 - 105.0) / 105.0) * 100.0, 1) # -45.2

    assert pos.mark_mid == pytest.approx(expected_mid, abs=1e-6)
    assert pos.pnl == pytest.approx(expected_pnl, abs=1e-6)
    assert pos.spot_vs_strike_pct == pytest.approx(expected_spot_vs_strike, abs=1e-6)
    assert pos.status == "itm"
    assert pos.next_step == "plan_assignment"  # rolls >= rolls_max (2 >= 2)


def test_derive_strike_ladder_recommended_plus_two_safer():
    from core.derive import derive_strike_ladder
    chain = [
        {"strike": 100.0, "bid": 5.00, "ask": 5.20, "iv": 0.40, "open_interest": 900},
        {"strike": 90.0, "bid": 2.00, "ask": 2.20, "iv": 0.45, "open_interest": 500},
        {"strike": 85.0, "bid": 1.10, "ask": 1.30, "iv": 0.48, "open_interest": 300},
        {"strike": 80.0, "bid": 0.60, "ask": 0.80, "iv": 0.50, "open_interest": 200},
        {"strike": 75.0, "bid": 0.30, "ask": 0.40, "iv": 0.52, "open_interest": 100},
    ]
    ladder = derive_strike_ladder(spot=103.0, dte=35, recommended_strike=90.0,
                                  chain_puts=chain, recommended_delta=-0.20)
    assert [r.strike for r in ladder] == [90.0, 85.0, 80.0]
    assert [r.role for r in ladder] == ["recommended", "safer", "safer"]
    top = ladder[0]
    assert top.mid == 2.10
    assert top.breakeven == 87.90
    assert top.roi_cycle_pct == round(2.10 / 90.0 * 100, 2)
    assert top.pos_pct == 80.0                      # 1 - |delta| from the recommended row
    # safer strikes: lower premium, higher probability of expiring worthless
    assert ladder[1].mid < top.mid and ladder[2].mid < ladder[1].mid
    assert ladder[2].pos_pct > ladder[1].pos_pct > 0


def test_derive_strike_ladder_missing_strike_returns_empty():
    from core.derive import derive_strike_ladder
    assert derive_strike_ladder(spot=100, dte=30, recommended_strike=95.0, chain_puts=[]) == []
