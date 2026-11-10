"""
Portfolio Tracker: Previous Open Signals & Historical Closed Trades
====================================================================
Tracks live active positions (with progress to 50% TP) and the audited 
historical closed trade ledger extracted directly from Kirsten's 2026 logs.
"""

from __future__ import annotations
from typing import List, Dict, Any
from datetime import datetime

# Audited Closed Trades from Kirsten & TheTravelingTrader 2026 Live Execution
HISTORICAL_CLOSED_TRADES: List[Dict[str, Any]] = [
    {
        "open_date": "2026-01-02",
        "close_date": "2026-01-05",
        "ticker": "HOOD",
        "strike": 90.0,
        "expiry": "2026-02-20",
        "entry_credit": 2.15,
        "exit_debit": 0.86,
        "realized_gain": 1.29,
        "profit_pct": 60.0,
        "days_held": 3,
        "exit_type": "60% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-06-03",
        "close_date": "2026-07-15",
        "ticker": "PLTR",
        "strike": 120.0,
        "expiry": "2026-07-17",
        "entry_credit": 2.05,
        "exit_debit": 0.82,
        "realized_gain": 1.23,
        "profit_pct": 60.0,
        "days_held": 42,
        "exit_type": "Rolled +4.80 credit -> 60% TP",
        "result": "WIN"
    },
    {
        "open_date": "2026-06-03",
        "close_date": "2026-07-15",
        "ticker": "NOW",
        "strike": 100.0,
        "expiry": "2026-07-17",
        "entry_credit": 2.60,
        "exit_debit": 1.04,
        "realized_gain": 1.56,
        "profit_pct": 60.0,
        "days_held": 42,
        "exit_type": "Rolled +4.60 credit -> 60% TP",
        "result": "WIN"
    },
    {
        "open_date": "2026-07-31",
        "close_date": "2026-08-07",
        "ticker": "AAPL",
        "strike": 290.0,
        "expiry": "2026-08-21",
        "entry_credit": 3.20,
        "exit_debit": 1.28,
        "realized_gain": 1.92,
        "profit_pct": 60.0,
        "days_held": 7,
        "exit_type": "60% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-08-03",
        "close_date": "2026-08-04",
        "ticker": "HOOD",
        "strike": 80.0,
        "expiry": "2026-08-21",
        "entry_credit": 3.50,
        "exit_debit": 1.40,
        "realized_gain": 2.10,
        "profit_pct": 60.0,
        "days_held": 1,
        "exit_type": "Next-Day Rebound Scalp",
        "result": "WIN"
    },
    {
        "open_date": "2026-08-05",
        "close_date": "2026-08-21",
        "ticker": "MU",
        "strike": 25.0,
        "expiry": "2026-08-21",
        "entry_credit": 2.30,
        "exit_debit": 0.00,
        "realized_gain": 2.30,
        "profit_pct": 100.0,
        "days_held": 16,
        "exit_type": "Expired Worthless (Max Profit)",
        "result": "WIN"
    },
    {
        "open_date": "2026-08-06",
        "close_date": "2026-08-14",
        "ticker": "INTC",
        "strike": 80.0,
        "expiry": "2026-09-11",
        "entry_credit": 2.05,
        "exit_debit": 1.12,
        "realized_gain": 0.93,
        "profit_pct": 45.4,
        "days_held": 8,
        "exit_type": "Early 45% Take-Profit",
        "result": "WIN"
    },
    {
        "open_date": "2026-08-10",
        "close_date": "2026-08-20",
        "ticker": "COIN",
        "strike": 165.0,
        "expiry": "2026-09-18",
        "entry_credit": 3.80,
        "exit_debit": 1.33,
        "realized_gain": 2.47,
        "profit_pct": 65.0,
        "days_held": 10,
        "exit_type": "65% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-08-13",
        "close_date": "2026-08-21",
        "ticker": "HOOD",
        "strike": 80.0,
        "expiry": "2026-09-11",
        "entry_credit": 2.60,
        "exit_debit": 0.73,
        "realized_gain": 1.87,
        "profit_pct": 71.9,
        "days_held": 8,
        "exit_type": "72% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-08-13",
        "close_date": "2026-08-27",
        "ticker": "NOW",
        "strike": 115.0,
        "expiry": "2026-09-18",
        "entry_credit": 3.90,
        "exit_debit": 1.56,
        "realized_gain": 2.34,
        "profit_pct": 60.0,
        "days_held": 14,
        "exit_type": "60% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-08-17",
        "close_date": "2026-08-28",
        "ticker": "CRWV",
        "strike": 65.0,
        "expiry": "2026-09-18",
        "entry_credit": 3.60,
        "exit_debit": 1.33,
        "realized_gain": 2.27,
        "profit_pct": 63.1,
        "days_held": 11,
        "exit_type": "63% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-08-17",
        "close_date": "2026-09-04",
        "ticker": "GOOGL",
        "strike": 315.0,
        "expiry": "2026-09-18",
        "entry_credit": 3.80,
        "exit_debit": 0.23,
        "realized_gain": 3.57,
        "profit_pct": 94.0,
        "days_held": 18,
        "exit_type": "Near Max Profit (94% TP)",
        "result": "WIN"
    },
    {
        "open_date": "2026-08-20",
        "close_date": "2026-09-03",
        "ticker": "COIN",
        "strike": 165.0,
        "expiry": "2026-10-02",
        "entry_credit": 4.10,
        "exit_debit": 1.31,
        "realized_gain": 2.79,
        "profit_pct": 68.0,
        "days_held": 14,
        "exit_type": "68% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-08-21",
        "close_date": "2026-09-08",
        "ticker": "NFLX",
        "strike": 72.0,
        "expiry": "2026-09-18",
        "entry_credit": 2.35,
        "exit_debit": 0.59,
        "realized_gain": 1.76,
        "profit_pct": 74.9,
        "days_held": 18,
        "exit_type": "75% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-08-25",
        "close_date": "2026-09-08",
        "ticker": "SOXL",
        "strike": 85.0,
        "expiry": "2026-09-25",
        "entry_credit": 4.60,
        "exit_debit": 1.61,
        "realized_gain": 2.99,
        "profit_pct": 65.0,
        "days_held": 14,
        "exit_type": "65% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-09-09",
        "close_date": "2026-09-22",
        "ticker": "NVDA",
        "strike": 205.0,
        "expiry": "2026-10-09",
        "entry_credit": 2.40,
        "exit_debit": 0.65,
        "realized_gain": 1.75,
        "profit_pct": 72.9,
        "days_held": 13,
        "exit_type": "73% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-09-10",
        "close_date": "2026-09-14",
        "ticker": "NOW",
        "strike": 120.0,
        "expiry": "2026-10-16",
        "entry_credit": 3.40,
        "exit_debit": 1.26,
        "realized_gain": 2.14,
        "profit_pct": 63.0,
        "days_held": 4,
        "exit_type": "63% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-09-10",
        "close_date": "2026-09-22",
        "ticker": "MU",
        "strike": 24.0,
        "expiry": "2026-10-16",
        "entry_credit": 1.45,
        "exit_debit": 0.44,
        "realized_gain": 1.01,
        "profit_pct": 69.7,
        "days_held": 12,
        "exit_type": "70% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-09-11",
        "close_date": "2026-09-21",
        "ticker": "HOOD",
        "strike": 100.0,
        "expiry": "2026-10-16",
        "entry_credit": 3.00,
        "exit_debit": 0.90,
        "realized_gain": 2.10,
        "profit_pct": 70.0,
        "days_held": 10,
        "exit_type": "70% Profit Target Hit",
        "result": "WIN"
    },
    {
        "open_date": "2026-09-18",
        "close_date": "2026-09-18",
        "ticker": "COIN",
        "strike": 160.0,
        "expiry": "2026-10-09",
        "entry_credit": 4.50,
        "exit_debit": 1.35,
        "realized_gain": 3.15,
        "profit_pct": 70.0,
        "days_held": 1,
        "exit_type": "Same-Day Scalp (+70% TP)",
        "result": "WIN"
    }
]

# Previous Open Signals currently in execution
RAW_PREVIOUS_SIGNALS: List[Dict[str, Any]] = [
    {
        "ticker": "HOOD",
        "strike": 75.0,
        "expiry": "2026-11-20",
        "entry_date": "2026-10-15",
        "entry_price": 2.32,
        "current_price": 0.95,
        "spot_at_entry": 85.50
    },
    {
        "ticker": "COIN",
        "strike": 125.0,
        "expiry": "2026-11-20",
        "entry_date": "2026-10-14",
        "entry_price": 3.60,
        "current_price": 1.45,
        "spot_at_entry": 142.00
    },
    {
        "ticker": "NVDA",
        "strike": 160.0,
        "expiry": "2026-11-27",
        "entry_date": "2026-10-20",
        "entry_price": 4.80,
        "current_price": 2.30,
        "spot_at_entry": 182.50
    },
    {
        "ticker": "NOW",
        "strike": 92.0,
        "expiry": "2026-11-27",
        "entry_date": "2026-10-18",
        "entry_price": 2.20,
        "current_price": 0.90,
        "spot_at_entry": 105.00
    },
    {
        "ticker": "AMZN",
        "strike": 255.0,
        "expiry": "2026-11-27",
        "entry_date": "2026-10-12",
        "entry_price": 4.10,
        "current_price": 1.80,
        "spot_at_entry": 278.00
    },
    {
        "ticker": "MRVL",
        "strike": 140.0,
        "expiry": "2026-12-04",
        "entry_date": "2026-10-24",
        "entry_price": 5.40,
        "current_price": 2.65,
        "spot_at_entry": 160.00
    },
    {
        "ticker": "PLTR",
        "strike": 150.0,
        "expiry": "2026-11-20",
        "entry_date": "2026-10-22",
        "entry_price": 3.10,
        "current_price": 1.50,
        "spot_at_entry": 172.00
    }
]

def get_active_previous_signals(ohlcv_cache: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Enriches previous open signals with live spot prices, profit captured %, and 50% TP progress."""
    active = []
    for sig in RAW_PREVIOUS_SIGNALS:
        sym = sig['ticker']
        entry_px = sig['entry_price']
        curr_px = sig['current_price']
        
        # Calculate current spot if available
        current_spot = sig['spot_at_entry']
        if ohlcv_cache and sym in ohlcv_cache and ohlcv_cache[sym] is not None:
            df = ohlcv_cache[sym]
            if len(df) > 0:
                current_spot = float(df['Close'].iloc[-1])

        # Profit calculations
        gain_dollar = entry_px - curr_px
        profit_pct = (gain_dollar / entry_px) * 100.0 if entry_px > 0 else 0.0
        tp_50_price = round(entry_px * 0.50, 2)
        
        # Progress towards 50% Take Profit target (0% to 100% of target)
        # 50% profit target = 100% on progress bar
        progress_to_target = min(100.0, max(0.0, (profit_pct / 50.0) * 100.0))

        if profit_pct >= 50.0:
            status = "🎯 50% TP Target Reached"
            badge_color = "#10B981"
        elif profit_pct >= 35.0:
            status = "⏳ Theta Harvesting"
            badge_color = "#38BDF8"
        else:
            status = "🟢 In Progress"
            badge_color = "#F59E0B"

        active.append({
            "ticker": sym,
            "strike": sig['strike'],
            "expiry": sig['expiry'],
            "entry_date": sig['entry_date'],
            "entry_price": entry_px,
            "current_price": curr_px,
            "current_spot": current_spot,
            "tp_50_price": tp_50_price,
            "profit_pct": profit_pct,
            "progress_to_target": progress_to_target,
            "status": status,
            "badge_color": badge_color
        })

    active.sort(key=lambda x: x['profit_pct'], reverse=True)
    return active
