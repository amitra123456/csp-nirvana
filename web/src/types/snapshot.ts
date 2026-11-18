export interface RunError {
  ticker: string;
  stage: string;
  message: string;
}

export interface RunMetadata {
  run_id: string;
  as_of_et: string;
  status: "ok" | "partial" | "failed";
  sources: {
    bars: string;
    options: string;
    fundamentals: string;
    [key: string]: string;
  };
  errors: RunError[];
}

export interface RulesConfig {
  preset: string;
  target_dte: number;
  cushion_min_pct: number;
  min_credit: number;
  min_roc_pct: number;
}

export interface Levels {
  sma50: number | null;
  sma200: number | null;
  avwap: number | null;
  vwap20: number | null;
  ote_618: number | null;
  ote_786: number | null;
  swing_low_252?: number | null;
  macro_support?: number | null;
  macro_vpoc?: number | null;
  is_near_macro_support?: boolean | null;
}

export interface HeldPositionSummary {
  strike: number;
  expiry: string;
  itm: boolean;
}

export interface WatchoutItem {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
}

export interface TradePlan {
  tp50: number;
  tp60: number;
  roll_trigger_price: number;
  stress_drop_pct: number;
  stress_loss: number;
}

export interface Setup {
  ticker: string;
  name: string;
  spot: number;
  spot_ts: string;
  expiry: string;
  dte: number;
  strike: number;
  bid: number;
  ask: number;
  mid: number;
  iv: number;
  delta: number;
  open_interest: number;
  cushion_pct: number;
  credit: number;
  collateral: number;
  roc_cycle_pct: number;
  roc_annual_pct: number;
  cost_basis: number;
  odds_otm_market_pct: number;
  odds_touch_market_pct: number;
  odds_model_pct: number;
  one_sigma_low: number;
  sizing_tier?: "1x" | "2x";
  sizing_reason?: string;
  recommended_contracts?: number;
  levels: Levels;
  score: number;
  score_parts: Record<string, [number, number]>;
  trend: "downtrend" | "pullback" | "test_200" | "range" | "breakout";
  held_position: HeldPositionSummary | null;
  watchouts: WatchoutItem[];
  plan: TradePlan;
}

export interface HeldBack {
  ticker: string;
  reason: string;
}

export interface Position {
  ticker: string;
  strike: number;
  expiry: string;
  dte: number;
  contracts: number;
  rolls: number;
  rolls_max: number;
  open_credit: number;
  mark_bid: number;
  mark_ask: number;
  mark_mid: number;
  mark_source: string;
  spot: number;
  spot_vs_strike_pct: number;
  pnl: number;
  status: "itm" | "near" | "otm";
  next_step: "decide" | "hold" | "plan_assignment";
}

export interface Portfolio {
  open_count: number;
  collateral: number;
  credit_collected: number;
  unrealized: number;
  out_of_rolls: number;
  itm_assignment_value: number;
}

export interface MonthlyPnl {
  month: string;
  pnl: number;
}

export interface ScoreQuintileItem {
  quintile: string;
  score_range: string;
  trades: number;
  win_rate: number;
  tp_50_rate: number;
  avg_days_to_tp: number;
  gross_win: number;
  gross_loss: number;
  net_pnl: number;
  profit_factor: number;
  avg_win: number;
  avg_loss: number;
  avg_mae: number;
}

export interface ScoreTierItem {
  tier: string;
  score_range: string;
  trades: number;
  win_rate: number;
  tp_50_rate: number;
  avg_days_to_tp: number;
  gross_win: number;
  gross_loss: number;
  net_pnl: number;
  profit_factor: number;
  avg_win: number;
  avg_loss: number;
}

export interface FactorAttributionItem {
  factor: string;
  condition: string;
  trades: number;
  win_rate: number;
  profit_factor: number;
  net_pnl: number;
}

export interface ScoreQuintilesSummary {
  top_40_win_rate: number;
  top_40_profit_factor: number;
  macro_shelf_loss_reduction_pct: number;
  golden_cross_profit_contribution_pct: number;
  avg_days_top_vs_bottom: string;
}

export interface ScoreQuintilesData {
  quintiles: ScoreQuintileItem[];
  tiers: ScoreTierItem[];
  factors: FactorAttributionItem[];
  summary: ScoreQuintilesSummary;
}

export interface Backtest {
  as_of: string;
  label: string;
  trades: number;
  win_rate: number;
  breakeven_win_rate: number;
  avg_win: number;
  avg_loss: number;
  net_pnl: number;
  monthly_pnl: MonthlyPnl[];
  score_quintiles: ScoreQuintilesData | null;
}

export interface ActiveSignal {
  ticker: string;
  strike: number;
  expiry: string;
  entry_date: string;
  entry_price: number;
  current_price: number;
  current_spot: number;
  tp_50_price: number;
  profit_pct: number;
  progress_to_target: number;
  status: string;
  badge_color: string;
  rolls: number;
  protocol?: string;
  triage_action?: string;
  net_basis?: number;
  itm_pct?: number;
  cushion_pct?: number;
}

export interface ClosedTrade {
  open_date: string;
  close_date: string;
  ticker: string;
  strike: number;
  expiry: string;
  entry_credit: number;
  exit_debit: number;
  realized_gain: number;
  profit_pct: number;
  days_held: number;
  exit_type: string;
  result: "WIN" | "LOSS";
}

export interface Snapshot {
  run: RunMetadata;
  rules: RulesConfig;
  setups: Setup[];
  held_back: HeldBack[];
  positions: Position[];
  portfolio: Portfolio;
  backtest: Backtest;
  active_signals?: ActiveSignal[];
  closed_trades?: ClosedTrade[];
}

export type SetupModel = Setup;
export type PositionModel = Position;
export type BacktestModel = Backtest;
export type PortfolioModel = Portfolio;
export type HeldBackModel = HeldBack;
