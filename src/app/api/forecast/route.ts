import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";


const AI_ENGINE_URL = process.env.AI_ENGINE_URL ?? "http://127.0.0.1:8000";

// ───────── Валидация входных данных ─────────
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
  totalBudget: z.number().positive().optional(),
  avgCheck: z.number().positive().optional(),
  ltv: z.number().positive().optional(),
  targetMargin: z.number().min(0).max(100).optional(),
  durationDays: z.number().int().positive().optional(),
  currency: z.string().default("USD"),
  channels: z.array(channelSchema).min(1).optional(),
});

type Input = {
  totalBudget: number;
  avgCheck: number;
  ltv?: number;
  targetMargin?: number;
  durationDays?: number;
  currency: string;
  channels: z.infer<typeof channelSchema>[];
};

// ───────── Контракт ответа Python-сервиса ai-engine ─────────
const engineSchema = z.object({
  summary: z.string(),
  allocations: z.array(
    z.object({
      channel: z.string(),
      sharePct: z.number(),
      budget: z.number(),
      expectedLeads: z.number(),
      expectedSales: z.number(),
      expectedRevenue: z.number(),
      expectedProfit: z.number(),
      effectiveCac: z.number().optional(),
      saturationPoint: z.number().optional(),
      reasoning: z.string(),
    })
  ),
  risks: z.array(z.string()),
  expectedLeads: z.number(),
  expectedSales: z.number(),
  expectedRevenue: z.number(),
  expectedProfit: z.number(),
  predictedRoi: z.number(),
  scenarios: z.record(z.string(), z.any()).optional(),
  responseCurves: z.array(z.any()).optional(),
  flightPlan: z.array(z.any()).optional(),
});

// ───────── POST /api/forecast ─────────
export async function POST(req: Request) {
  // 1. Проверяем авторизацию пользователя через Supabase Auth
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Получаем профиль компании пользователя
  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  });

  if (!company) {
    return NextResponse.json(
      { error: "Профиль компании не найден. Пройдите онбординг." },
      { status: 404 }
    );
  }

  // 3. Валидация тела входящего запроса
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

  // 4. Подготовка параметров для передачи в Python ML-микросервис
  let input: Input;
  let targetCampaignId = body.campaignId;

  if (targetCampaignId) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: targetCampaignId, companyId: company.id },
      include: { company: { include: { adChannels: true } } },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Кампания не найдена" }, { status: 404 });
    }
    if (campaign.company.adChannels.length === 0) {
      return NextResponse.json(
        { error: "Добавьте хотя бы один канал трафика для кампании" },
        { status: 422 }
      );
    }
    input = {
      totalBudget: Number(campaign.totalBudget),
      avgCheck: Number(company.avgCheck),
      ltv: Number(company.ltv),
      targetMargin: Number(company.targetMargin),
      durationDays: Math.max(
        1,
        Math.round((campaign.endDate.getTime() - campaign.startDate.getTime()) / 86_400_000)
      ),
      currency: company.currency,
      channels: campaign.company.adChannels.map((c) => ({
        id: c.id,
        name: c.name,
        historicalCac: Number(c.historicalCac),
        conversionRate: Number(c.conversionRate),
      })),
    };
  } else {
    if (!body.totalBudget || !body.avgCheck || !body.channels) {
      return NextResponse.json(
        { error: "Необходимо указать бюджет, средний чек и каналы трафика" },
        { status: 400 }
      );
    }
    input = {
      totalBudget: body.totalBudget,
      avgCheck: body.avgCheck,
      ltv: body.ltv ?? Number(company.ltv),
      targetMargin: body.targetMargin ?? Number(company.targetMargin),
      durationDays: body.durationDays ?? 30,
      currency: company.currency,
      channels: body.channels,
    };
  }

  // 5. Запрос к Python-микросервису (ai-engine) на http://127.0.0.1:8000/predict
  let result: z.infer<typeof engineSchema>;
  try {
    const endpoint = AI_ENGINE_URL.endsWith("/predict")
      ? AI_ENGINE_URL
      : `${AI_ENGINE_URL}/predict`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalBudget: input.totalBudget,
        avgCheck: input.avgCheck,
        ltv: input.ltv,
        targetMargin: input.targetMargin,
        durationDays: input.durationDays,
        currency: input.currency,
        channels: input.channels.map((c) => ({
          name: c.name,
          historicalCac: c.historicalCac,
          conversionRate: c.conversionRate,
        })),
      }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[api/forecast] Python engine error:", res.status, errText);
      return NextResponse.json(
        { error: `Ошибка сервиса предиктивной аналитики: ${res.status}` },
        { status: 502 }
      );
    }

    result = engineSchema.parse(await res.json());
  } catch (err) {
    console.error("[api/forecast] Connection error:", err);
    return NextResponse.json(
      { error: "Python-микросервис аналитики (порт 8000) недоступен" },
      { status: 503 }
    );
  }

  // 6. Сохранение в базу данных через Prisma
  // А) Если кампания не была передана (симуляция с фронтенда) — создаем новую кампанию
  if (!targetCampaignId) {
    const formattedDate = new Date().toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const campaignName =
      body.campaignName?.trim() || `Кампания от ${formattedDate}`;

    const newCampaign = await prisma.campaign.create({
      data: {
        companyId: company.id,
        branchId: body.branchId || null,
        name: campaignName,
        totalBudget: input.totalBudget,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
    });
    targetCampaignId = newCampaign.id;
  }

  // Б) Синхронизируем каналы в AdChannel для компании (upsert по [companyId, name])
  const channelMap = new Map<string, string>();
  for (const ch of input.channels) {
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

  // В) Создаем запись Forecast и связанные ForecastAllocation
  const savedForecast = await prisma.forecast.create({
    data: {
      campaignId: targetCampaignId,
      predictedRoi: result.predictedRoi.toFixed(2),
      expectedLeads: Math.round(result.expectedLeads),
      expectedSales: Math.round(result.expectedSales),
      expectedRevenue: result.expectedRevenue.toFixed(2),
      aiSummary: result.summary,
      allocations: {
        create: result.allocations.flatMap((a) => {
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
    include: {
      allocations: {
        include: { adChannel: true },
      },
    },
  });

  // 7. Возвращаем клиенту полные сохраненные данные
  return NextResponse.json({
    forecastId: savedForecast.id,
    summary: result.summary,
    risks: result.risks,
    totals: {
      leads: result.expectedLeads,
      sales: result.expectedSales,
      revenue: result.expectedRevenue,
      profit: result.expectedProfit,
      roi: result.predictedRoi,
    },
    allocations: result.allocations,
    scenarios: result.scenarios,
    responseCurves: result.responseCurves,
    flightPlan: result.flightPlan,
  });
}
