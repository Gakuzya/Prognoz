import Link from "next/link";
import {
  Calendar,
  Percent,
  Plus,
  Crown,
  Layers,
  MapPin,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import { formatMoney, formatNumber } from "@/components/dashboard/types";
import { SPHERE_CATALOG } from "@/components/dashboard/planConverter";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  let currency = "KZT";
  let targetMargin = 48;
  let dbForecasts: {
    id: string;
    predictedRoi: unknown;
    expectedLeads: number;
    expectedSales: number | null;
    expectedRevenue: unknown;
    aiSummary: string | null;
    createdAt: Date;
    campaign: {
      name: string;
      totalBudget: unknown;
      branch: { name: string } | null;
    };
    allocations: {
      id: string;
      allocatedBudget: unknown;
      adChannel: { name: string };
    }[];
  }[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const company = await prisma.company.findUnique({
        where: { userId: user.id },
      });

      if (company) {
        currency = company.currency;
        targetMargin = Number(company.targetMargin);

        dbForecasts = await prisma.forecast.findMany({
          where: {
            campaign: {
              companyId: company.id,
            },
          },
          include: {
            campaign: {
              include: {
                branch: true,
              },
            },
            allocations: {
              include: {
                adChannel: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      }
    }
  } catch {
    // Используем демонстрационный архив эталонных расчетов, если БД пуста
  }

  // Если сохраненных в БД прогнозов еще нет, показываем эталонный архив по 3 ключевым нишам РК
  const displayItems =
    dbForecasts.length > 0
      ? dbForecasts.map((item) => {
          const roi = Number(item.predictedRoi);
          const budget = Number(item.campaign.totalBudget);
          const revenue = Number(item.expectedRevenue || 0);
          const profit = Math.round(revenue * (targetMargin / 100) - budget);
          return {
            id: item.id,
            title: item.campaign.name,
            date: new Date(item.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            branch: item.campaign.branch?.name || "Казахстан",
            roi,
            budget,
            revenue,
            profit,
            sales: item.expectedSales || 0,
            leads: item.expectedLeads,
            summary: item.aiSummary,
            channels: item.allocations.map((a) => ({
              name: a.adChannel.name,
              budget: Number(a.allocatedBudget),
            })),
          };
        })
      : SPHERE_CATALOG.slice(0, 3).map((sp, idx) => {
          const budget = sp.defaultAdBudget;
          const sales = Math.round(budget / sp.channels[0].cac);
          const revenue = sales * sp.avgCheck;
          const profit = Math.round(revenue * (sp.marginPct / 100) - budget);
          const roi = Math.round((profit / budget) * 100);
          return {
            id: `preset-${idx}`,
            title: `${sp.icon} ${sp.name}`,
            date: "Эталонная модель ИИ",
            branch: "Алматы / Астана",
            roi,
            budget,
            revenue,
            profit,
            sales,
            leads: sales * 12,
            summary: sp.usp,
            channels: sp.channels.map((c) => ({
              name: c.name,
              budget: Math.round((budget * c.sharePct) / 100),
            })),
          };
        });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
            База расчетов компании
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Архив прогнозов и медиапланов
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Сохраненные результаты предиктивного моделирования и эталонные кейсы окупаемости.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 px-4 py-2.5 text-xs font-extrabold text-black shadow-lg shadow-amber-500/20 transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Новый ИИ-прогноз
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-3xl border border-amber-500/25 bg-[#101016] p-5 shadow-xl transition hover:border-amber-400"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-white text-sm">{item.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-amber-400" />
                      <span>{item.date}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      <MapPin className="h-2.5 w-2.5" />
                      {item.branch}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-extrabold text-emerald-400">
                  <Percent className="h-3 w-3" />
                  ROI +{item.roi.toFixed(0)}%
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-2xl border border-white/10 bg-black/40 p-3.5 text-xs">
                <div>
                  <span className="text-zinc-400">Реклама</span>
                  <p className="mt-0.5 font-extrabold text-white">
                    {formatMoney(item.budget, currency)}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-400">Выручка</span>
                  <p className="mt-0.5 font-extrabold text-amber-400">
                    {formatMoney(item.revenue, currency)}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-400">Продажи / Лиды</span>
                  <p className="mt-0.5 font-bold text-zinc-200">
                    {formatNumber(item.sales)} / {formatNumber(item.leads)}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-400">Чистая прибыль</span>
                  <p className="mt-0.5 font-extrabold text-emerald-400">
                    {formatMoney(item.profit, currency)}
                  </p>
                </div>
              </div>

              {item.channels.length > 0 && (
                <div className="mt-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Сплит каналов ({item.channels.length})
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {item.channels.map((ch, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-zinc-300"
                      >
                        <Layers className="h-3 w-3 text-amber-400" />
                        {ch.name}: {formatMoney(ch.budget, currency)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.summary && (
                <p className="mt-3 text-xs leading-relaxed text-zinc-400 line-clamp-2">
                  {item.summary}
                </p>
              )}
            </div>

            <Link
              href="/dashboard?tab=simulator"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500 hover:text-black"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Открыть модель в Симуляторе</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
