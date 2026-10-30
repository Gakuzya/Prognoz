import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Percent,
  Plus,
  ArrowUpRight,
  Sparkles,
  Layers,
  MapPin,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import { formatMoney, formatNumber } from "@/components/dashboard/types";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  });

  if (!company) redirect("/onboarding");

  // Извлекаем историю прогнозов пользователя, отсортированную по дате (новые первыми)
  const forecasts = await prisma.forecast.findMany({
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

  return (
    <div className="space-y-6">
      {/* Шапка раздела */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            История прогнозов
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Сохраненные результаты предиктивного моделирования для вашей компании.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Новый прогноз
        </Link>
      </div>

      {forecasts.length === 0 ? (
        /* Пустое состояние */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            История прогнозов пока пуста
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Вы пока не создали ни одного прогноза. Перейдите в симулятор, настройте каналы и запустите предиктивную модель.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Создать первый прогноз
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        /* Сетка карточек с историей */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {forecasts.map((item) => {
            const roi = Number(item.predictedRoi);
            const budget = Number(item.campaign.totalBudget);
            const revenue = Number(item.expectedRevenue || 0);
            const profit = revenue * (Number(company.targetMargin) / 100) - budget;
            const formattedDate = new Date(item.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  {/* Верхняя строка: Название и статус */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">
                        {item.campaign.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formattedDate}</span>
                        </div>
                        {item.campaign.branch && (
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                            <MapPin className="h-2.5 w-2.5" />
                            {item.campaign.branch.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        roi >= 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-rose-50 text-rose-700 border border-rose-200/60"
                      }`}
                    >
                      <Percent className="h-3 w-3" />
                      ROI {roi.toFixed(1)}%
                    </span>
                  </div>

                  {/* Метрики в карточке */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-lg bg-slate-50 p-3 text-xs">
                    <div>
                      <span className="text-slate-400">Общий бюджет</span>
                      <p className="mt-0.5 font-semibold text-slate-800">
                        {formatMoney(budget, company.currency)}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">Ожид. выручка</span>
                      <p className="mt-0.5 font-semibold text-indigo-600">
                        {formatMoney(revenue, company.currency)}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">Продажи / Лиды</span>
                      <p className="mt-0.5 font-medium text-slate-700">
                        {formatNumber(item.expectedSales || 0)} / {formatNumber(item.expectedLeads)}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">Чистая прибыль</span>
                      <p
                        className={`mt-0.5 font-medium ${
                          profit >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {formatMoney(profit, company.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Распределение по каналам */}
                  {item.allocations.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        Каналы ({item.allocations.length})
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {item.allocations.map((a) => (
                          <span
                            key={a.id}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                          >
                            <Layers className="h-3 w-3 text-slate-400" />
                            {a.adChannel.name}: {formatMoney(Number(a.allocatedBudget), company.currency)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Текстовое резюме модели */}
                  {item.aiSummary && (
                    <p className="mt-3 text-xs leading-relaxed text-slate-500 line-clamp-3">
                      {item.aiSummary}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
