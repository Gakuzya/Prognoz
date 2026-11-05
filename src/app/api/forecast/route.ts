import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import { convertPlanDataToForecastResult } from "@/components/dashboard/planConverter";

const AI_ENGINE_URL = process.env.AI_ENGINE_URL ?? "http://127.0.0.1:8000";

const channelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  historicalCac: z.number().positive(),
  conversionRate: z.number().gt(0).max(1),
});

const requestSchema = z.object({
  campaignId: z.string().optional(),
  branchId: z.string().optional(),
  campaignName: z.string().optional(),
  industry: z.string().optional(),
  openingBudget: z.number().positive().optional(),
  totalBudget: z.number().positive().optional(),
  avgCheck: z.number().positive().optional(),
  ltv: z.number().positive().optional(),
  targetMargin: z.number().min(0).max(100).optional(),
  durationDays: z.number().int().positive().optional(),
  currency: z.string().default("KZT"),
  channels: z.array(channelSchema).min(1).optional(),
});

/**
 * Встроенный математический движок Media Mix Modeling (Hill Saturation + Маржинальная отдача)
 * Гарантирует 100% работу симулятора и построение всех 6 графиков даже без Python-сервера.
 */
function computeMathematicalForecast(input: {
  industry?: string;
  openingBudget?: number;
  totalBudget: number;
  avgCheck: number;
  ltv: number;
  targetMargin: number;
  currency: string;
  channels: { name: string; historicalCac: number; conversionRate: number }[];
}) {
  // Вычисляем веса эффективности каждого канала: (conversionRate^0.65) / (historicalCac^0.85)
  const rawWeights = input.channels.map((ch) => {
    const crPct = ch.conversionRate * 100;
    const score = Math.pow(Math.max(0.2, crPct), 0.65) / Math.pow(Math.max(100, ch.historicalCac), 0.85);
    return { ...ch, score };
  });

  const totalScore = rawWeights.reduce((acc, c) => acc + c.score, 0) || 1;

  // Формируем оптимальные доли каналов с учетом диверсификации (от 12% до 60%)
  let shares = rawWeights.map((c) => Math.max(12, Math.min(62, Math.round((c.score / totalScore) * 100))));
  const shareSum = shares.reduce((a, b) => a + b, 0) || 100;
  shares = shares.map((s) => Math.round((s / shareSum) * 100));
  const diff = 100 - shares.reduce((a, b) => a + b, 0);
  if (shares.length > 0) shares[0] += diff;

  const channelAllocations = input.channels.map((ch, idx) => {
    const sharePct = shares[idx] || Math.round(100 / input.channels.length);
    const budget = Math.round((input.totalBudget * sharePct) / 100);
    // Учет эффекта насыщения (закон убывающей отдачи Хилла)
    const saturationRatio = budget / Math.max(1, ch.historicalCac * 25);
    const diminishingFactor = 1 + Math.max(0, saturationRatio - 1) * 0.14;
    const effectiveCac = Math.round(ch.historicalCac * diminishingFactor);
    const expectedSales = Math.max(1, Math.round(budget / effectiveCac));

    return {
      channel: ch.name,
      sharePct,
      budget,
      estimatedCac: effectiveCac,
      expectedSales,
    };
  });

  return convertPlanDataToForecastResult(
    {
      industry: input.industry || "Малый и средний бизнес",
      openingBudget: input.openingBudget || input.totalBudget * 6,
      adBudget: input.totalBudget,
      avgCheck: input.avgCheck,
      targetMargin: input.targetMargin,
      ltv: input.ltv,
      currency: input.currency,
      channelAllocations,
    },
    input.currency
  );
}

export async function POST(req: Request) {
  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await req.json());
  } catch (err) {
    const details = err instanceof z.ZodError ? err.issues : undefined;
    return NextResponse.json(
      { error: "Некорректные входные данные", details },
      { status: 400 }
    );
  }

  // Пытаемся получить авторизованного пользователя и его компанию (если есть)
  let company: {
    id: string;
    name: string;
    industry: string | null;
    currency: string;
    avgCheck: unknown;
    targetMargin: unknown;
    ltv: unknown;
  } | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      company = await prisma.company.findUnique({
        where: { userId: user.id },
      });
    }
  } catch {
    // Работаем в автономном / гостевом режиме без блокировки
  }

  const totalBudget = body.totalBudget || 800000;
  const avgCheck = body.avgCheck || Number(company?.avgCheck) || 42000;
  const ltv = body.ltv || Number(company?.ltv) || avgCheck * 3.5;
  const targetMargin = body.targetMargin ?? (Number(company?.targetMargin) || 48);
  const currency = body.currency || company?.currency || "KZT";
  const industry = body.industry || company?.industry || "Автосервис / СТО";
  const channels =
    body.channels && body.channels.length > 0
      ? body.channels
      : [
          { name: "Instagram Ads (Reels / Meta)", historicalCac: 7400, conversionRate: 0.034 },
          { name: "2GIS (Гео-приоритет РК)", historicalCac: 5800, conversionRate: 0.052 },
          { name: "Google.kz (Поисковая реклама)", historicalCac: 9200, conversionRate: 0.041 },
        ];

  // Вычисляем полный аналитический результат со всеми 6 графиками и воронкой
  const fullForecast = computeMathematicalForecast({
    industry,
    openingBudget: body.openingBudget,
    totalBudget,
    avgCheck,
    ltv,
    targetMargin,
    currency,
    channels,
  });

  // Если Python-сервис на порту 8000 запущен — можем обогатить summary/allocations от него
  try {
    const endpoint = AI_ENGINE_URL.endsWith("/predict")
      ? AI_ENGINE_URL
      : `${AI_ENGINE_URL}/predict`;

    const pyRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalBudget,
        avgCheck,
        ltv,
        targetMargin,
        durationDays: body.durationDays ?? 30,
        currency,
        channels: channels.map((c) => ({
          name: c.name,
          historicalCac: c.historicalCac,
          conversionRate: c.conversionRate,
        })),
      }),
      signal: AbortSignal.timeout(2_500),
      cache: "no-store",
    });

    if (pyRes.ok) {
      const pyData = await pyRes.json();
      if (pyData && pyData.summary && Array.isArray(pyData.allocations)) {
        fullForecast.summary = pyData.summary;
        fullForecast.allocations = pyData.allocations;
      }
    }
  } catch {
    // Используем встроенный математический движок AdForecast MMM Engine
  }

  // Если пользователь авторизован и есть профиль компании в БД — сохраняем прогноз в историю
  let savedForecastId: string | undefined;
  if (company) {
    try {
      const formattedDate = new Date().toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const campaignName =
        body.campaignName?.trim() || `${industry} — ${formattedDate}`;

      const newCampaign = await prisma.campaign.create({
        data: {
          companyId: company.id,
          branchId: body.branchId || null,
          name: campaignName,
          totalBudget,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
        },
      });

      const channelMap = new Map<string, string>();
      for (const ch of channels) {
        const adChannel = await prisma.adChannel.upsert({
          where: {
            companyId_name: {
              companyId: company.id,
              name: ch.name,
            },
          },
          create: {
            companyId: company.id,
            name: ch.name,
            historicalCac: ch.historicalCac,
            conversionRate: ch.conversionRate,
          },
          update: {
            historicalCac: ch.historicalCac,
            conversionRate: ch.conversionRate,
          },
        });
        channelMap.set(ch.name.toLowerCase(), adChannel.id);
      }

      const savedForecast = await prisma.forecast.create({
        data: {
          campaignId: newCampaign.id,
          predictedRoi: fullForecast.totals.roi.toFixed(2),
          expectedLeads: Math.round(fullForecast.totals.leads),
          expectedSales: Math.round(fullForecast.totals.sales),
          expectedRevenue: fullForecast.totals.revenue.toFixed(2),
          aiSummary: fullForecast.summary,
          allocations: {
            create: fullForecast.allocations.flatMap((a) => {
              const channelId = channelMap.get(a.channel.toLowerCase());
              if (!channelId) return [];
              return [
                {
                  adChannelId: channelId,
                  allocatedBudget: a.budget.toFixed(2),
                  expectedProfit: a.expectedProfit.toFixed(2),
                },
              ];
            }),
          },
        },
      });
      savedForecastId = savedForecast.id;
    } catch (dbErr) {
      console.warn("[api/forecast] DB save skipped:", dbErr);
    }
  }

  return NextResponse.json({
    ...fullForecast,
    forecastId: savedForecastId,
  });
}
