"""
Snapshot Pydantic Contract & Validation Models
==============================================
Defines the strict schema for CSP-Nirvana snapshots (data/snapshots/latest.json).
Refuses to publish invalid snapshots.
"""

from __future__ import annotations
from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field, model_validator

class RunError(BaseModel):
    ticker: str
    stage: str
    message: str

class RunMetadata(BaseModel):
    run_id: str
    as_of_et: str
    status: Literal["ok", "partial", "failed"]
    sources: Dict[str, str]
    errors: List[RunError] = Field(default_factory=list)

class RulesConfig(BaseModel):
    preset: str = "core"
    target_dte: int = 35
    cushion_min_pct: float = 12.0
    min_credit: float = 1.50
    min_roc_pct: float = 1.2

class Levels(BaseModel):
    sma50: Optional[float] = None
    sma200: Optional[float] = None
    avwap: Optional[float] = None
    vwap20: Optional[float] = None
    ote_618: Optional[float] = None
    ote_786: Optional[float] = None

class HeldPositionSummary(BaseModel):
    strike: float
    expiry: str
    itm: bool

class WatchoutItem(BaseModel):
    severity: Literal["high", "medium", "low"]
    title: str
    detail: str

class TradePlan(BaseModel):
    tp50: float
    tp60: float
    roll_trigger_price: float
    stress_drop_pct: float = 30.0
    stress_loss: float

class SetupModel(BaseModel):
    ticker: str
    name: str
    spot: float
    spot_ts: str
    expiry: str
    dte: int
    strike: float
    bid: float
    ask: float
    mid: float
    iv: float
    delta: float
    open_interest: int
    cushion_pct: float
    credit: float
    collateral: float
    roc_cycle_pct: float
    roc_annual_pct: float
    cost_basis: float
    odds_otm_market_pct: float
    odds_touch_market_pct: float
    odds_model_pct: float
    one_sigma_low: float
    levels: Levels
    score: float
    score_parts: Dict[str, List[float]]
    trend: Literal["downtrend", "pullback", "test_200", "range", "breakout"]
    held_position: Optional[HeldPositionSummary] = None
    watchouts: List[WatchoutItem] = Field(default_factory=list)
    plan: TradePlan

class HeldBackModel(BaseModel):
    ticker: str
    reason: str

class PositionModel(BaseModel):
    ticker: str
    strike: float
    expiry: str
    dte: int
    contracts: int
    rolls: int = 0
    rolls_max: int = 2
    open_credit: float
    mark_bid: float
    mark_ask: float
    mark_mid: float
    mark_source: str = "alpaca:indicative"
    spot: float
    spot_vs_strike_pct: float
    pnl: float
    status: Literal["itm", "near", "otm"]
    next_step: Literal["decide", "hold", "plan_assignment"]

class PortfolioModel(BaseModel):
    open_count: int
    collateral: float
    credit_collected: float
    unrealized: float
    out_of_rolls: int
    itm_assignment_value: float

class MonthlyPnl(BaseModel):
    month: str
    pnl: float

class BacktestModel(BaseModel):
    as_of: str
    label: str = "Simulated"
    trades: int
    win_rate: float
    breakeven_win_rate: float
    avg_win: float
    avg_loss: float
    net_pnl: float
    monthly_pnl: List[MonthlyPnl] = Field(default_factory=list)
    score_quintiles: Optional[Any] = None

class Snapshot(BaseModel):
    run: RunMetadata
    rules: RulesConfig
    setups: List[SetupModel] = Field(default_factory=list)
    held_back: List[HeldBackModel] = Field(default_factory=list)
    positions: List[PositionModel] = Field(default_factory=list)
    portfolio: PortfolioModel
    backtest: BacktestModel
