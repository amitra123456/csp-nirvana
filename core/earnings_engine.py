"""
Earnings Blackout & Event Risk Management Engine
=================================================
Enforces Kirsten's Earnings Blackout Rules:
1. Should NOT sell options that are within 1 week of earnings (0 to 7 days before earnings).
2. Signals generated within 2 weeks before earnings to 1 week after earnings are classified
   and displayed on the UI as 'Within Blackout Period'.
"""

from __future__ import annotations
import os
import json
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional
from pathlib import Path
import yfinance as yf

logger = logging.getLogger("EarningsEngine")
logging.getLogger("yfinance").setLevel(logging.CRITICAL)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
EARNINGS_CACHE_FILE = PROJECT_ROOT / "data" / "earnings_calendar.json"

_MEMORY_EARNINGS_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_HOURS = 24


def _load_disk_cache() -> Dict[str, Any]:
    if EARNINGS_CACHE_FILE.exists():
        try:
            with open(EARNINGS_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_disk_cache(data: Dict[str, Any]) -> None:
    try:
        EARNINGS_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(EARNINGS_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
    except Exception as e:
        logger.warning(f"Could not persist earnings cache to disk: {e}")


def fetch_earnings_date(ticker: str, force_refresh: bool = False) -> Optional[date]:
    """
    Fetches the nearest relevant earnings date (upcoming or recent) for a symbol using yfinance,
    with local disk and in-memory caching.
    """
    sym = ticker.strip().upper()
    now_dt = datetime.now()

    # Check memory cache
    if not force_refresh and sym in _MEMORY_EARNINGS_CACHE:
        entry = _MEMORY_EARNINGS_CACHE[sym]
        cached_ts = datetime.fromisoformat(entry.get("cached_at", "2000-01-01"))
        if (now_dt - cached_ts).total_seconds() < CACHE_TTL_HOURS * 3600:
            date_str = entry.get("earnings_date")
            return date.fromisoformat(date_str) if date_str else None

    # Check disk cache
    disk_data = _load_disk_cache()
    if not force_refresh and sym in disk_data:
        entry = disk_data[sym]
        cached_ts = datetime.fromisoformat(entry.get("cached_at", "2000-01-01"))
        if (now_dt - cached_ts).total_seconds() < CACHE_TTL_HOURS * 3600:
            date_str = entry.get("earnings_date")
            _MEMORY_EARNINGS_CACHE[sym] = entry
            return date.fromisoformat(date_str) if date_str else None

    earn_dt = None
    try:
        t = yf.Ticker(sym)
        cal = t.calendar
        if isinstance(cal, dict) and "Earnings Date" in cal and cal["Earnings Date"]:
            raw_dt = cal["Earnings Date"][0]
            earn_dt = raw_dt if isinstance(raw_dt, date) else raw_dt.date()
    except Exception:
        pass

    if not earn_dt:
        try:
            t = yf.Ticker(sym)
            ed = t.earnings_dates
            if ed is not None and not ed.empty:
                # Find nearest future date or latest past date
                future_dates = [idx for idx in ed.index if (idx.date() if hasattr(idx, 'date') else idx) >= now_dt.date()]
                if future_dates:
                    earn_dt = future_dates[0].date() if hasattr(future_dates[0], 'date') else future_dates[0]
                else:
                    earn_dt = ed.index[0].date() if hasattr(ed.index[0], 'date') else ed.index[0]
        except Exception:
            pass

    date_str = earn_dt.isoformat() if earn_dt else None
    cache_entry = {
        "earnings_date": date_str,
        "cached_at": now_dt.isoformat()
    }
    _MEMORY_EARNINGS_CACHE[sym] = cache_entry
    disk_data[sym] = cache_entry
    _save_disk_cache(disk_data)

    return earn_dt


def compute_earnings_blackout(
    ticker: str,
    expiry_date_str: Optional[str] = None,
    force_refresh: bool = False
) -> Dict[str, Any]:
    """
    Evaluates Earnings Blackout conditions for a stock setup:
    1. Critical Rule 1: DO NOT SELL if within 1 week of earnings (0 <= days <= 7).
    2. General Blackout Window: Classified as 'Within Blackout Period' if:
       - Within 2 weeks before earnings (0 <= days <= 14), OR
       - Within 1 week after earnings (-7 <= days < 0).
    3. Option Spans Earnings: Checks if option expiration falls on or after earnings.
    """
    sym = ticker.strip().upper()
    today = date.today()
    earn_dt = fetch_earnings_date(sym, force_refresh=force_refresh)

    if not earn_dt:
        return {
            "ticker": sym,
            "has_earnings_date": False,
            "earnings_date": None,
            "earnings_date_str": "Unknown / N/A",
            "days_to_earnings": None,
            "is_in_blackout": False,
            "is_critical_blackout": False,
            "blackout_type": "CLEAR",
            "status_title": "Clear",
            "badge": "✅ Clear",
            "badge_color": "#10B981",
            "spans_earnings": False,
            "summary": "No proximate earnings date detected; standard options selling permitted."
        }

    days_diff = (earn_dt - today).days
    earn_str = earn_dt.strftime("%b %d, %Y")
    earn_short = earn_dt.strftime("%b %d")

    # Check if option expiration spans earnings
    spans_earnings = False
    if expiry_date_str:
        try:
            exp_dt = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
            if today <= earn_dt <= exp_dt:
                spans_earnings = True
        except Exception:
            pass

    # Blackout Classification Logic
    # 1. Critical Blackout (Rule 1: DO NOT SELL - within 1 week before earnings)
    if 0 <= days_diff <= 7:
        is_in_blackout = True
        is_critical_blackout = True
        blackout_type = "CRITICAL_DO_NOT_SELL"
        status_title = "DO NOT SELL"
        badge = f"🚫 DO NOT SELL ({earn_short}, {days_diff}d)"
        badge_color = "#EF4444"
        summary = (
            f"STRICT RULE 1 VIOLATION: Earnings is scheduled in {days_diff} day{'s' if days_diff != 1 else ''} ({earn_str}). "
            f"Do not sell cash-secured puts within 1 week of earnings due to unhedged binary gap risk."
        )

    # 2. Pre-Earnings Blackout (Between 1 and 2 weeks before earnings)
    elif 7 < days_diff <= 14:
        is_in_blackout = True
        is_critical_blackout = False
        blackout_type = "PRE_EARNINGS_BLACKOUT"
        status_title = "Blackout Period"
        badge = f"⚠️ Blackout Period ({earn_short}, {days_diff}d)"
        badge_color = "#F59E0B"
        summary = (
            f"WITHIN BLACKOUT PERIOD: Earnings scheduled in {days_diff} days ({earn_str}). "
            f"Elevated IV expansion risk; setup allowed to screen but flagged as within pre-earnings blackout window."
        )

    # 3. Post-Earnings Digestion Blackout (Within 1 week after earnings)
    elif -7 <= days_diff < 0:
        days_ago = abs(days_diff)
        is_in_blackout = True
        is_critical_blackout = False
        blackout_type = "POST_EARNINGS_DIGESTION"
        status_title = "Blackout Period"
        badge = f"⚠️ Blackout (Reported {days_ago}d ago)"
        badge_color = "#F59E0B"
        summary = (
            f"POST-EARNINGS BLACKOUT: Earnings was reported {days_ago} day{'s' if days_ago != 1 else ''} ago ({earn_str}). "
            f"Allow 1 full week for post-earnings gap and implied volatility crush to settle before opening new CSPs."
        )

    # 4. Outside Blackout Window (Clear)
    else:
        is_in_blackout = False
        is_critical_blackout = False
        blackout_type = "CLEAR"
        status_title = "Clear"
        if days_diff > 14:
            badge = f"✅ Clear ({earn_short}, {days_diff}d)"
            summary = f"Clear of blackout window. Next earnings scheduled in {days_diff} days on {earn_str}."
        else:
            badge = f"✅ Clear (Reported {abs(days_diff)}d ago)"
            summary = f"Clear of blackout window. Last earnings reported {abs(days_diff)} days ago on {earn_str}."
        badge_color = "#10B981"

    # Additional warning if option expiration spans earnings date
    if spans_earnings and not is_critical_blackout:
        summary += f" [Note: Option expiry spans across earnings event on {earn_short}]."

    return {
        "ticker": sym,
        "has_earnings_date": True,
        "earnings_date": earn_dt.isoformat(),
        "earnings_date_str": earn_str,
        "days_to_earnings": days_diff,
        "is_in_blackout": is_in_blackout,
        "is_critical_blackout": is_critical_blackout,
        "blackout_type": blackout_type,
        "status_title": status_title,
        "badge": badge,
        "badge_color": badge_color,
        "spans_earnings": spans_earnings,
        "summary": summary
    }
