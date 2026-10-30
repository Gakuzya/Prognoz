import {
  ForecastResult,
  AllocationResult,
  ScenarioDetail,
  ResponseCurveRow,
  FlightPlanWeek,
  formatMoney,
} from "./types";

export interface ChannelAllocation {
  channel: string;
  sharePct: number;
  budget: number;
  estimatedCac: number;
  expectedSales: number;
}

export interface ActionTask {
  task: string;
  phase: string;
}

export interface StructuredPlanData {
  industry?: string;
  openingBudget?: number;
  adBudget?: number;
  currency?: string;
  breakEvenSales?: number;
  estimatedRevenue?: number;
  estimatedProfit?: number;
  estimatedRoi?: number;
  channelAllocations?: ChannelAllocation[];
  actionChecklist?: ActionTask[];
}

/**
 * Преобразует структурированные данные из ответа ИИ в полноценный
 * интерактивный объект ForecastResult для графиков Recharts и симулятора.
 */
export function convertPlanDataToForecastResult(
  plan: StructuredPlanData,
  fallbackCurrency = "KZT"
): ForecastResult {
  const currency = plan.currency || fallbackCurrency;
  const adBudget = Number(plan.adBudget) && Number(plan.adBudget) > 0 ? Number(plan.adBudget) : 600000;
  const breakEven = Number(plan.breakEvenSales) || 30;
  
  // Реалистичные продажи выше точки безубыточности
  const sales = Math.round(breakEven * 1.55);
  const leads = Math.round(sales * 12);
  
  // Выручка и прибыль
  const revenue =
    Number(plan.estimatedRevenue) && Number(plan.estimatedRevenue) > 0
      ? Number(plan.estimatedRevenue)
      : Math.round(adBudget * 3.8);
      
  const profit =
    Number(plan.estimatedProfit) && Number(plan.estimatedProfit) > 0
      ? Number(plan.estimatedProfit)
      : Math.round(revenue * 0.45 - adBudget);

  const roi =
    Number(plan.estimatedRoi) && Number(plan.estimatedRoi) > 0
      ? Number(plan.estimatedRoi)
      : Math.round((profit / adBudget) * 100);

  // Распределение каналов
  let allocations: AllocationResult[] = [];

  if (plan.channelAllocations && plan.channelAllocations.length > 0) {
    allocations = plan.channelAllocations.map((ch, idx) => {
      const share = Number(ch.sharePct) || Math.round(100 / plan.channelAllocations!.length);
      const chBudget = Number(ch.budget) || Math.round((adBudget * share) / 100);
      const chSales = Number(ch.expectedSales) || Math.max(1, Math.round((sales * share) / 100));
      const chLeads = Math.round(chSales * 12);
      const chRev = Math.round((revenue * share) / 100);
      const chProfit = Math.round(chRev * 0.45 - chBudget);

      return {
        channel: ch.channel,
        sharePct: share,
        budget: chBudget,
        expectedLeads: chLeads,
        expectedSales: chSales,
        expectedRevenue: chRev,
        expectedProfit: chProfit,
        effectiveCac: Number(ch.estimatedCac) || Math.round(chBudget / Math.max(1, chSales)),
        saturationPoint: Math.round(chBudget * 2.2),
        reasoning: `Канал «${ch.channel}» оптимизирован ИИ для рынка Казахстана с долей ${share}% рекламного бюджета.`,
      };
    });
  } else {
    // Дефолтный проверенный микс для Казахстана
    allocations = [
      {
        channel: "Instagram Ads (Reels / Meta)",
        sharePct: 50,
        budget: Math.round(adBudget * 0.5),
        expectedLeads: Math.round(leads * 0.5),
        expectedSales: Math.round(sales * 0.5),
        expectedRevenue: Math.round(revenue * 0.5),
        expectedProfit: Math.round(profit * 0.5),
        effectiveCac: 8500,
        saturationPoint: Math.round(adBudget * 0.5 * 2.4),
        reasoning: "Основной визуальный канал вовлечения и конверсии в Казахстане.",
      },
      {
        channel: "2GIS (Казахстан)",
        sharePct: 35,
        budget: Math.round(adBudget * 0.35),
        expectedLeads: Math.round(leads * 0.35),
        expectedSales: Math.round(sales * 0.35),
        expectedRevenue: Math.round(revenue * 0.35),
        expectedProfit: Math.round(profit * 0.35),
        effectiveCac: 6500,
        saturationPoint: Math.round(adBudget * 0.35 * 2.0),
        reasoning: "Горячий локальный спрос на картах в городах Алматы, Астана, Шымкент.",
      },
      {
        channel: "TikTok Ads (РК)",
        sharePct: 15,
        budget: Math.round(adBudget * 0.15),
        expectedLeads: Math.round(leads * 0.15),
        expectedSales: Math.round(sales * 0.15),
        expectedRevenue: Math.round(revenue * 0.15),
        expectedProfit: Math.round(profit * 0.15),
        effectiveCac: 7200,
        saturationPoint: Math.round(adBudget * 0.15 * 1.8),
        reasoning: "Масштабирование и охват активной мобильной аудитории.",
      },
    ];
  }

  // Сценарии
  const balanced: ScenarioDetail = {
    name: "balanced",
    label: "Сбалансированный",
    description: "Оптимум по чистой прибыли с учетом насыщения каналов в Казахстане.",
    expectedSales: sales,
    expectedRevenue: revenue,
    expectedProfit: profit,
    predictedRoi: roi,
    allocations,
  };

  const conservative: ScenarioDetail = {
    name: "conservative",
    label: "Консервативный",
    description: "Диверсифицированное распределение рисков с упором на проверенные каналы с низким CAC.",
    expectedSales: Math.round(sales * 0.88),
    expectedRevenue: Math.round(revenue * 0.88),
    expectedProfit: Math.round(profit * 0.94),
    predictedRoi: Math.round(roi * 0.95),
    allocations: allocations.map((a) => {
      const equalShare = Math.round(100 / allocations.length);
      const b = Math.round((adBudget * equalShare) / 100);
      return {
        ...a,
        sharePct: equalShare,
        budget: b,
        expectedSales: Math.round(a.expectedSales * 0.88),
        expectedRevenue: Math.round(a.expectedRevenue * 0.88),
        expectedProfit: Math.round(a.expectedProfit * 0.94),
      };
    }),
  };

  const aggressive: ScenarioDetail = {
    name: "aggressive",
    label: "Агрессивный",
    description: "Максимальный захват доли рынка с масштабированием лидирующего источника трафика.",
    expectedSales: Math.round(sales * 1.25),
    expectedRevenue: Math.round(revenue * 1.3),
    expectedProfit: Math.round(profit * 1.15),
    predictedRoi: Math.round(roi * 0.92),
    allocations: allocations.map((a, i) => {
      const share = i === 0 ? 60 : Math.round(40 / Math.max(1, allocations.length - 1));
      const b = Math.round((adBudget * share) / 100);
      return {
        ...a,
        sharePct: share,
        budget: b,
        expectedSales: Math.round(a.expectedSales * (i === 0 ? 1.35 : 0.95)),
        expectedRevenue: Math.round(a.expectedRevenue * (i === 0 ? 1.35 : 0.95)),
        expectedProfit: Math.round(a.expectedProfit * (i === 0 ? 1.25 : 0.95)),
      };
    }),
  };

  // Кривые насыщения (Response Curves)
  const spendPercentages = [25, 50, 75, 100, 125, 150];
  const responseCurves: ResponseCurveRow[] = spendPercentages.map((pct) => {
    const factor = pct / 100;
    const hillFactor = Math.pow(factor, 0.72);
    const totalSpend = Math.round(adBudget * factor);
    const channelsRecord: Record<string, any> = {};

    allocations.forEach((a) => {
      channelsRecord[a.channel] = {
        spend: Math.round(a.budget * factor),
        revenue: Math.round(a.expectedRevenue * hillFactor),
        profit: Math.round(a.expectedProfit * hillFactor),
        effectiveCac: Math.round((a.effectiveCac || 8000) * (1 + factor * 0.12)),
      };
    });

    return {
      spendPct: pct,
      totalSpend,
      channels: channelsRecord,
    };
  });

  // Календарный медиаплан (Flight Plan)
  const checklist = plan.actionChecklist?.map((c) => c.task) || [];
  const flightPlan: FlightPlanWeek[] = [
    {
      week: 1,
      title: "Неделя 1: Тестирование креативов и посадочных",
      sharePct: 20,
      budget: Math.round(adBudget * 0.2),
      goal: "Проверка конверсии связок, запуск карточек 2GIS и Instagram Reels",
      actionItems: checklist.slice(0, 2).length > 0
        ? checklist.slice(0, 2)
        : [
            "Оформить профиль и прайс-лист в 2GIS с акцией на первый заказ",
            "Запустить 5 тестовых креативов в Instagram Reels на локальную гео-точку",
          ],
    },
    {
      week: 2,
      title: "Неделя 2: Оптимизация и отсечение неэффективных объявлений",
      sharePct: 25,
      budget: Math.round(adBudget * 0.25),
      goal: "Снижение CAC и фиксация конверсии звонков и заявок",
      actionItems: [
        "Отключить креативы с ценой заявки выше целевой",
        "Перенести высвобожденный бюджет в лучший канал трафика",
      ],
    },
    {
      week: 3,
      title: "Неделя 3: Масштабирование связок-победителей",
      sharePct: 35,
      budget: Math.round(adBudget * 0.35),
      goal: "Пик продаж и достижение точки безубыточности",
      actionItems: [
        "Увеличить суточные лимиты на 2 самых результативных объявления",
        "Подключить ретаргетинг на посетителей профиля и сайта",
      ],
    },
    {
      week: 4,
      title: "Неделя 4: Ретаргетинг, дожим и повторные продажи",
      sharePct: 20,
      budget: Math.round(adBudget * 0.2),
      goal: "Дожим теплой аудитории и анализ окупаемости месяца",
      actionItems: [
        "Запустить рассылку спецпредложения в WhatsApp по базе лидов",
        "Подвести итоги фактического CAC и зафиксировать чистую прибыль",
      ],
    },
  ];

  return {
    summary: `Комплексная предиктивная стратегия для ниши «${plan.industry || "Бизнес в РК"}». Рекомендованный рекламный бюджет ${formatMoney(adBudget, currency)} обеспечивает прогнозную выручку ${formatMoney(revenue, currency)} с рентабельностью ROI +${roi}%.`,
    risks: [
      "При резком превышении суточного бюджета более чем на 30% возможно насыщение и удорожание кликов.",
      "Для офлайн-бизнеса (СТО, кофейни, салоны) держите рейтинг в 2GIS выше 4.6 звезд.",
      "Контролируйте скорость ответа на заявки в WhatsApp: ответ дольше 15 минут снижает конверсию на 40%.",
    ],
    totals: {
      leads,
      sales,
      revenue,
      profit,
      roi,
    },
    allocations,
    scenarios: {
      balanced,
      conservative,
      aggressive,
    },
    responseCurves,
    flightPlan,
  };
}
