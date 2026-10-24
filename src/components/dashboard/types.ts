/** Ответ роута /api/forecast (контракт между фронтендом и бэкендом) */
export type AllocationResult = {
  channel: string;
  sharePct: number;
  budget: number;
  expectedLeads: number;
  expectedSales: number;
  expectedRevenue: number;
  expectedProfit: number;
  reasoning: string;
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
