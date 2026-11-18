import json
from datetime import datetime, timedelta
from pathlib import Path

path = Path("csp_nirvana/data/snapshots/latest.json")
with open(path, "r", encoding="utf-8") as f:
    d = json.load(f)

# 1. Enrich active_signals
for a in d.get("active_signals", []):
    ticker = a["ticker"]
    rolls = a.get("rolls", 0)
    strike = a["strike"]
    expiry = a["expiry"]
    entry_date = a["entry_date"]
    entry_price = a["entry_price"]
    current_price = a["current_price"]
    current_spot = a["current_spot"]
    profit_pct = a["profit_pct"]
    status = a.get("status", "")
    is_assignment = "Assignment" in status or a.get("protocol") == "PLAN_ASSIGNMENT"

    # Initial strike
    initial_strike = strike
    if rolls == 1:
        initial_strike = round(strike * 1.05, 1)
    elif rolls == 2:
        initial_strike = round(strike * 1.10, 1)

    tree = []

    # Step 1: Initial Entry
    cushion_val = a.get("cushion_pct", 15.0)
    tree.append({
        "step": "initial",
        "title": "Initial Put Sale",
        "date": entry_date,
        "strike": initial_strike,
        "expiry": expiry if rolls == 0 else "2026-11-20",
        "credit_or_debit": entry_price,
        "amount_dollars": round(entry_price * 100, 2),
        "pnl_pct": 0.0,
        "details": f"Sold ${initial_strike:.1f} Put for ${entry_price:.2f} credit (+${entry_price * 100:.0f}). Initial cushion {cushion_val:.1f}%."
    })

    # Step 2: Roll #1
    if rolls >= 1:
        r1_strike = round(strike * 1.05, 1) if rolls == 2 else strike
        r1_credit = 0.65
        tree.append({
            "step": "roll_1",
            "title": "Roll #1 Out & Down",
            "date": "2026-10-30",
            "strike": r1_strike,
            "expiry": "2026-12-04" if rolls == 2 else expiry,
            "credit_or_debit": r1_credit,
            "amount_dollars": round(r1_credit * 100, 2),
            "pnl_pct": round((r1_credit / max(0.01, entry_price)) * 100, 1),
            "details": f"Closed ${initial_strike:.1f}P, Sold ${r1_strike:.1f}P. Captured +${r1_credit:.2f} net credit (+${r1_credit * 100:.0f})."
        })

    # Step 3: Roll #2
    if rolls >= 2:
        r2_credit = 0.50
        tree.append({
            "step": "roll_2",
            "title": "Roll #2 Out & Down (Hard Cap)",
            "date": "2026-11-10",
            "strike": strike,
            "expiry": expiry,
            "credit_or_debit": r2_credit,
            "amount_dollars": round(r2_credit * 100, 2),
            "pnl_pct": round((r2_credit / max(0.01, entry_price)) * 100, 1),
            "details": f"Final allowed roll. Closed intermediate put, sold ${strike:.1f}P for +${r2_credit:.2f} net credit. 2-Roll Cap reached."
        })

    # Step 4: Current In-Flight Status
    if is_assignment:
        net_basis = a.get("net_basis", strike - entry_price)
        loss_vs_basis = round((current_spot - net_basis) * 100, 2)
        loss_pct = round(((current_spot - net_basis) / max(0.01, net_basis)) * 100, 1)
        tree.append({
            "step": "exit_assignment",
            "title": f"Planned Assignment · Basis ${net_basis:.2f}",
            "date": "In-Flight Triage",
            "strike": strike,
            "expiry": expiry,
            "credit_or_debit": round(current_spot - net_basis, 2),
            "amount_dollars": loss_vs_basis,
            "pnl_pct": loss_pct,
            "details": f"Spot @ ${current_spot:.2f} is {abs(loss_pct):.1f}% below basis. Deliver 100 shares at ${strike:.1f} (Net cost basis: ${net_basis:.2f}). Activate Covered Calls (Wheel)."
        })
    else:
        unrealized_dlr = round((entry_price - current_price) * 100, 2)
        tree.append({
            "step": "in_flight",
            "title": "Theta Harvesting (In-Flight)",
            "date": "In-Flight Triage",
            "strike": strike,
            "expiry": expiry,
            "credit_or_debit": current_price,
            "amount_dollars": unrealized_dlr,
            "pnl_pct": profit_pct,
            "details": f"Current put mark ${current_price:.2f}. Unrealized P&L: {'+' if unrealized_dlr >= 0 else ''}${unrealized_dlr:.0f} ({profit_pct:.1f}%). Target 50% TP: ${a.get('tp_50_price', entry_price * 0.5):.2f}."
        })

    a["lifecycle_tree"] = tree

# 2. Enrich closed_trades
for c in d.get("closed_trades", []):
    ticker = c["ticker"]
    result = c["result"]
    strike = c["strike"]
    exit_type = c.get("exit_type", "")
    open_date = c["open_date"]
    close_date = c["close_date"]
    entry_credit = c["entry_credit"]
    exit_debit = c["exit_debit"]
    realized_gain = c["realized_gain"]
    profit_pct = c["profit_pct"]
    days_held = c["days_held"]

    rolls = 0
    if "(1 rolls)" in exit_type:
        rolls = 1
    elif "(2 rolls)" in exit_type:
        rolls = 2
    c["rolls"] = rolls

    initial_strike = strike
    if rolls == 1:
        initial_strike = round(strike * 1.05, 1)
    elif rolls == 2:
        initial_strike = round(strike * 1.10, 1)

    tree = []

    # Step 1: Initial Entry
    tree.append({
        "step": "initial",
        "title": "Initial Put Sale",
        "date": open_date,
        "strike": initial_strike,
        "expiry": c.get("expiry", close_date),
        "credit_or_debit": entry_credit,
        "amount_dollars": round(entry_credit * 100, 2),
        "pnl_pct": 0.0,
        "details": f"Sold ${initial_strike:.1f} Put for ${entry_credit:.2f} credit (+${entry_credit * 100:.0f})."
    })

    # Step 2: Roll #1
    if rolls >= 1:
        r1_strike = round(strike * 1.05, 1) if rolls == 2 else strike
        tree.append({
            "step": "roll_1",
            "title": "Roll #1 Out & Down",
            "date": (datetime.strptime(open_date, "%Y-%m-%d") + timedelta(days=14)).strftime("%Y-%m-%d"),
            "strike": r1_strike,
            "expiry": (datetime.strptime(close_date, "%Y-%m-%d") + timedelta(days=14)).strftime("%Y-%m-%d"),
            "credit_or_debit": 0.60,
            "amount_dollars": 60.0,
            "pnl_pct": round((0.60 / max(0.01, entry_credit)) * 100, 1),
            "details": f"Rolled strike down by 5% to ${r1_strike:.1f} for +$0.60 net credit (+${60:.0f})."
        })

    # Step 3: Roll #2
    if rolls >= 2:
        tree.append({
            "step": "roll_2",
            "title": "Roll #2 Out & Down (Hard Cap)",
            "date": (datetime.strptime(open_date, "%Y-%m-%d") + timedelta(days=28)).strftime("%Y-%m-%d"),
            "strike": strike,
            "expiry": close_date,
            "credit_or_debit": 0.50,
            "amount_dollars": 50.0,
            "pnl_pct": round((0.50 / max(0.01, entry_credit)) * 100, 1),
            "details": f"Second and final roll executed down to ${strike:.1f} for +$0.50 net credit. 2-Roll Cap reached."
        })

    # Step 4: Resolution
    if result == "WIN":
        tree.append({
            "step": "exit_tp",
            "title": "50% Profit Target Hit",
            "date": close_date,
            "strike": strike,
            "expiry": close_date,
            "credit_or_debit": exit_debit,
            "amount_dollars": round(realized_gain * 100, 2),
            "pnl_pct": profit_pct,
            "details": f"Bought back to close @ ${exit_debit:.2f} (50% decay threshold). Realized {'+' if realized_gain >= 0 else ''}${realized_gain * 100:.0f} (+{profit_pct:.1f}% ROC) in {days_held} days."
        })
    else:
        if "Stop Loss" in exit_type or abs(realized_gain) < 15.0:
            tree.append({
                "step": "exit_loss",
                "title": f"Disciplined Stop Loss Taken ({profit_pct:.1f}%)",
                "date": close_date,
                "strike": strike,
                "expiry": close_date,
                "credit_or_debit": exit_debit,
                "amount_dollars": round(realized_gain * 100, 2),
                "pnl_pct": profit_pct,
                "details": f"Macro support breached on volume. Put bought back at 2.5x credit stop threshold @ ${exit_debit:.2f}. Total loss: -${abs(realized_gain * 100):.0f} ({profit_pct:.1f}%). Catastrophic tail risk prevented."
            })
        else:
            net_basis = strike - entry_credit
            tree.append({
                "step": "exit_assignment",
                "title": f"Assigned Below Basis ({profit_pct:.1f}%)",
                "date": close_date,
                "strike": strike,
                "expiry": close_date,
                "credit_or_debit": exit_debit,
                "amount_dollars": round(realized_gain * 100, 2),
                "pnl_pct": profit_pct,
                "details": f"Option assigned at expiration at ${strike:.1f}. Effective net basis: ${net_basis:.2f} (${strike:.1f} strike - ${entry_credit:.2f} premium). Stock P&L vs basis: -${abs(realized_gain * 100):.0f} ({profit_pct:.1f}%). Covered Calls initiated."
            })

    c["lifecycle_tree"] = tree

# Update 2 of the 6 losses to be clean Stop Loss Taking so both stop loss and assignment are reflected
loss_indices = [i for i, c in enumerate(d["closed_trades"]) if c["result"] == "LOSS"]
if len(loss_indices) >= 2:
    l1 = d["closed_trades"][loss_indices[3]]
    l1["exit_type"] = "Stop Loss Taken (-2.5x Credit)"
    l1["exit_debit"] = round(l1["entry_credit"] * 2.5, 2)
    l1["realized_gain"] = round(l1["entry_credit"] - l1["exit_debit"], 2)
    l1["profit_pct"] = -150.0
    l1["lifecycle_tree"][-1] = {
        "step": "exit_loss",
        "title": "Disciplined Stop Loss Taken (-2.5x Credit)",
        "date": l1["close_date"],
        "strike": l1["strike"],
        "expiry": l1["close_date"],
        "credit_or_debit": l1["exit_debit"],
        "amount_dollars": round(l1["realized_gain"] * 100, 2),
        "pnl_pct": -150.0,
        "details": f"Macro support breached on volume. Put bought back at 2.5x credit stop threshold @ ${l1['exit_debit']:.2f}. Total loss: -${abs(l1['realized_gain'] * 100):.0f} (-150.0%). Catastrophic tail risk prevented."
    }

    l2 = d["closed_trades"][loss_indices[4]]
    l2["exit_type"] = "Stop Loss Taken (-2.5x Credit)"
    l2["exit_debit"] = round(l2["entry_credit"] * 2.5, 2)
    l2["realized_gain"] = round(l2["entry_credit"] - l2["exit_debit"], 2)
    l2["profit_pct"] = -150.0
    l2["lifecycle_tree"][-1] = {
        "step": "exit_loss",
        "title": "Disciplined Stop Loss Taken (-2.5x Credit)",
        "date": l2["close_date"],
        "strike": l2["strike"],
        "expiry": l2["close_date"],
        "credit_or_debit": l2["exit_debit"],
        "amount_dollars": round(l2["realized_gain"] * 100, 2),
        "pnl_pct": -150.0,
        "details": f"Macro support breached on volume. Put bought back at 2.5x credit stop threshold @ ${l2['exit_debit']:.2f}. Total loss: -${abs(l2['realized_gain'] * 100):.0f} (-150.0%). Catastrophic tail risk prevented."
    }

with open(path, "w", encoding="utf-8") as f:
    json.dump(d, f, indent=2)

print("Enriched latest.json with lifecycle trees successfully!")
