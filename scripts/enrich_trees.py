"""
Lifecycle rows for the Signals page (expand buttons on simulated open and closed trades).

Every row is built only from what the simulator recorded. Nothing is invented:
- no made-up roll dates, roll credits or earlier strikes (the simulator rolls at the same
  strike and does not record each roll's date or credit, so rolls are shown as a count);
- no relabelling of losses (the strategy has no stop-loss; a loss is an assignment below the
  net cost basis and is shown at its real size);
- the exit row uses the simulator's own exit type (take-profit, expired, assigned).

Replaces an earlier version (2026-11-18) that rewrote two losing trades as small
"stop loss" exits and filled in roll history with fixed dates and credits.
"""
import json
from pathlib import Path


def _rolls_from_exit_type(exit_type: str) -> int:
    for n in (2, 1):
        if f"({n} rolls)" in exit_type or f"({n} roll)" in exit_type:
            return n
    return 0


def _roll_row(rolls: int, strike: float) -> dict:
    return {
        "step": "roll_1" if rolls == 1 else "roll_2",
        "title": f"Rolled {rolls} time{'s' if rolls != 1 else ''} at the same strike",
        "date": "not recorded",
        "strike": strike,
        "expiry": "",
        "credit_or_debit": 0.0,
        "amount_dollars": 0.0,
        "pnl_pct": 0.0,
        "details": "Each roll bought back the put and sold a later expiry at the same strike for a net credit. "
                   "The simulator records only the total credit, not each roll's date or amount.",
    }


def enrich_snapshot_lifecycle_trees(d: dict) -> dict:
    """Attach factual lifecycle rows to active_signals and closed_trades in a snapshot dict."""
    for a in d.get("active_signals", []):
        rolls = int(a.get("rolls", 0) or 0)
        strike = a["strike"]
        entry_price = a["entry_price"]
        current_price = a["current_price"]
        unrealized = round((entry_price - current_price) * 100, 2)
        tree = [{
            "step": "initial",
            "title": "Put sold" if rolls == 0 else "Current contract (after rolls)",
            "date": a["entry_date"],
            "strike": strike,
            "expiry": a["expiry"],
            "credit_or_debit": entry_price,
            "amount_dollars": round(entry_price * 100, 2),
            "pnl_pct": 0.0,
            "details": (f"Sold the ${strike:.1f} put, expiring {a['expiry']}. Credit collected "
                        f"{'so far, including roll credits, ' if rolls else ''}${entry_price:.2f} (${entry_price * 100:.0f})."),
        }]
        if rolls:
            tree.append(_roll_row(rolls, strike))
        tree.append({
            "step": "in_flight",
            "title": "Open (model mark)",
            "date": "now",
            "strike": strike,
            "expiry": a["expiry"],
            "credit_or_debit": current_price,
            "amount_dollars": unrealized,
            "pnl_pct": a.get("profit_pct", 0.0),
            "details": (f"Put marked at ${current_price:.2f} by the simulator's Black-Scholes model. "
                        f"Unrealized {'+' if unrealized >= 0 else '-'}${abs(unrealized):.0f}. "
                        f"If assigned, cost basis would be ${strike - entry_price:.2f}."),
        })
        a["lifecycle_tree"] = tree

    for c in d.get("closed_trades", []):
        exit_type = c.get("exit_type", "") or ""
        rolls = int(c.get("rolls") or _rolls_from_exit_type(exit_type))
        c["rolls"] = rolls
        strike = c["strike"]
        realized = round(c["realized_gain"] * 100, 2)
        tree = [{
            "step": "initial",
            "title": "Put sold",
            "date": c["open_date"],
            "strike": strike,
            "expiry": c.get("expiry", ""),
            "credit_or_debit": c["entry_credit"],
            "amount_dollars": round(c["entry_credit"] * 100, 2),
            "pnl_pct": 0.0,
            "details": f"Sold the ${strike:.1f} put for a total credit of ${c['entry_credit']:.2f}"
                       f"{' (including roll credits)' if rolls else ''}.",
        }]
        if rolls:
            tree.append(_roll_row(rolls, strike))
        if "Assigned" in exit_type:
            step = "exit_assignment"
        elif c.get("result") == "LOSS":
            step = "exit_loss"
        else:
            step = "exit_tp"
        tree.append({
            "step": step,
            "title": exit_type or c.get("result", "Closed"),
            "date": c["close_date"],
            "strike": strike,
            "expiry": c.get("expiry", ""),
            "credit_or_debit": c.get("exit_debit", 0.0),
            "amount_dollars": realized,
            "pnl_pct": c.get("profit_pct", 0.0),
            "details": f"Closed {c['close_date']} after {c.get('days_held', '?')} days. "
                       f"Result {'+' if realized >= 0 else '-'}${abs(realized):.0f} for one contract.",
        })
        c["lifecycle_tree"] = tree
    return d


if __name__ == "__main__":
    snap_path = Path(__file__).resolve().parent.parent / "data" / "snapshots" / "latest.json"
    if snap_path.exists():
        data = json.loads(snap_path.read_text(encoding="utf-8"))
        snap_path.write_text(json.dumps(enrich_snapshot_lifecycle_trees(data), indent=2), encoding="utf-8")
        print("Rebuilt lifecycle rows in latest.json")
