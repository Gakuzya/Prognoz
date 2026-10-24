/**
/** Типы данных для предиктивной платформы AdForecast 2.0 */

export type AllocationResult = {
  channel: string;
  sharePct: number;
  budget: number;
  expectedLeads: number;
  expectedSales: number;
  expectedRevenue: number;
  expectedProfit: number;
  effectiveCac?: number;
  saturationPoint?: number;
  reasoning: string;
};

export type ScenarioDetail = {
  name: string;
  label: string;
  description: string;
  expectedSales: number;
  expectedRevenue: number;
  expectedProfit: number;
  predictedRoi: number;
  allocations: AllocationResult[];
};

export type CurvePoint = {
  spend: number;
  revenue: number;
  profit: number;
  effectiveCac: number;
};

export type ResponseCurveRow = {
  spendPct: number;
  totalSpend: number;
  channels: Record<string, CurvePoint>;
};

export type FlightPlanWeek = {
  week: number;
  title: string;
  sharePct: number;
  budget: number;
  goal: string;
  actionItems: string[];
};

export type ForecastResult = {
  forecastId?: string;
  summary: string;
  risks: string[];
  totals: {
    leads: number;
    sales: number;
    revenue: number;
    profit: number;
    roi: number;
  };
  allocations: AllocationResult[];
  scenarios?: {
    balanced: ScenarioDetail;
    conservative: ScenarioDetail;
    aggressive: ScenarioDetail;
    [key: string]: ScenarioDetail;
  };
  responseCurves?: ResponseCurveRow[];
  flightPlan?: FlightPlanWeek[];
};

/** Форматирование денег в валюте компании */
export function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}
