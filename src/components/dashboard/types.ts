/** Типы данных для предиктивной платформы AdForecast Sovereign AI 3.0 */

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

export type FunnelStage = {
  stage: string;
  value: number;
  conversionPct: number;
  costPerUnit: number;
  description: string;
};

export type MonthlyProjectionPoint = {
  month: string;
  monthIndex: number;
  adSpend: number;
  revenue: number;
  profit: number;
  cumulativeCashflow: number;
  sales: number;
  repeatSales: number;
};

export type ChannelRadarMetric = {
  metric: string;
  [channelName: string]: string | number;
};

export type AdCreativeTemplate = {
  channel: string;
  format: string;
  headline: string;
  hook: string;
  offer: string;
  cta: string;
  expectedCtr: string;
};

export type SalesScriptStep = {
  step: string;
  timing: string;
  script: string;
  goal: string;
};

export type CapexItem = {
  category: string;
  sharePct: number;
  amount: number;
  description: string;
};

export type PromotionStrategyDetail = {
  industry: string;
  positioningUsp: string;
  targetAudience: {
    segments: string[];
    corePains: string[];
    purchaseTriggers: string[];
    dealCycle: string;
  };
  creatives: AdCreativeTemplate[];
  salesFunnelScripts: SalesScriptStep[];
  competitorEdge: string[];
  capexBreakdown: CapexItem[];
  recommendedKpis: {
    targetCtr: string;
    targetCrWebsite: string;
    targetCrSale: string;
    optimalLtvCacRatio: string;
    paybackPeriodMonths: number;
  };
};

export type ForecastResult = {
  forecastId?: string;
  industry?: string;
  location?: string;
  openingBudget?: number;
  adBudget?: number;
  avgCheck?: number;
  targetMargin?: number;
  ltv?: number;
  breakEvenSales?: number;
  paybackMonths?: number;
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
  funnel?: FunnelStage[];
  monthlyProjection?: MonthlyProjectionPoint[];
  radarMetrics?: ChannelRadarMetric[];
  promotionStrategy?: PromotionStrategyDetail;
};

/** Форматирование денег в валюте компании (по умолчанию казахстанский тенге ₸) */
export function formatMoney(value: number, currency = "KZT") {
  try {
    return new Intl.NumberFormat("ru-KZ", {
      style: "currency",
      currency: currency || "KZT",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${Math.round(value || 0).toLocaleString("ru-RU")} ₸`;
  }
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-KZ", { maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0
  );
}
