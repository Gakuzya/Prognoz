"use client";

import { useState } from "react";
import {
  Compass,
  Sparkles,
  Users,
  Flame,
  ShieldAlert,
  Video,
  MessageSquare,
  Copy,
  Check,
  Briefcase,
  CheckSquare,
  Square,
  ArrowRight,
  Award,
  TrendingUp,
} from "lucide-react";
import { ForecastResult, formatMoney } from "./types";
import { resolveSphereBenchmark } from "./planConverter";

interface PromotionHubProps {
  data: ForecastResult;
  currency?: string;
  onOpenChatWithMode?: (mode: "creatives" | "funnel_scripts" | "competitors_swot" | "finance_capex") => void;
}

export default function PromotionHub({
  data,
  currency = "KZT",
  onOpenChatWithMode,
}: PromotionHubProps) {
  const sphere = resolveSphereBenchmark(data.industry);
  const strategy = data.promotionStrategy || {
    industry: data.industry || sphere.name,
    positioningUsp: sphere.usp,
    targetAudience: {
      segments: sphere.segments,
      corePains: sphere.pains,
      purchaseTriggers: sphere.triggers,
      dealCycle: sphere.dealCycle,
    },
    creatives: sphere.creatives,
    salesFunnelScripts: sphere.scripts,
    competitorEdge: sphere.competitorEdge,
    capexBreakdown: sphere.capexShares.map((s) => ({
      category: s.category,
      sharePct: s.sharePct,
      amount: Math.round(((data.openingBudget || sphere.defaultOpenBudget) * s.sharePct) / 100),
      description: s.description,
    })),
    recommendedKpis: {
      targetCtr: "2.8% – 5.2%",
      targetCrWebsite: "7.0% – 11.5%",
      targetCrSale: "25% – 38%",
      optimalLtvCacRatio: "4.2:1",
      paybackPeriodMonths: data.paybackMonths || 3.5,
    },
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({
    "w1-0": true,
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const allChecklistItems = (data.flightPlan || []).flatMap((w) =>
    w.actionItems.map((item, idx) => ({
      id: `w${w.week}-${idx}`,
      week: `Неделя ${w.week}`,
      text: item,
    }))
  );

  const completedCount = Object.values(checkedTasks).filter(Boolean).length;
  const progressPct =
    allChecklistItems.length > 0
      ? Math.round((completedCount / allChecklistItems.length) * 100)
      : 25;

  return (
    <div className="space-y-6">
      {/* 1. ГЛАВНЫЙ ПАСПОРТ ПОЗИЦИОНИРОВАНИЯ И УТП СФЕРЫ */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E2DDD3] bg-white p-6 nordic-shadow">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D5DFDA] bg-[#EAF0ED] px-3 py-1 text-xs font-bold text-[#1F3A33]">
              <Compass className="h-3.5 w-3.5 text-[#1F3A33]" />
              <span>Полное руководство по продвижению сферы: {strategy.industry}</span>
            </div>

            <h2 className="text-xl font-extrabold text-[#1C242B] sm:text-2xl">
              Уникальное Торговое Предложение (УТП):
            </h2>
            <p className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-4 text-sm font-medium leading-relaxed text-[#1C242B]">
              «{strategy.positioningUsp}»
            </p>
          </div>

          {/* Целевые KPI воронки */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-auto shrink-0">
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-[#7A827E] block">
                Норма CTR
              </span>
              <span className="mt-1 block text-sm font-extrabold text-[#1F3A33]">
                {strategy.recommendedKpis.targetCtr}
              </span>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-[#7A827E] block">
                Конверсия в лид
              </span>
              <span className="mt-1 block text-sm font-extrabold text-[#3B6E8C]">
                {strategy.recommendedKpis.targetCrWebsite}
              </span>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-[#7A827E] block">
                Лид → Продажа
              </span>
              <span className="mt-1 block text-sm font-extrabold text-[#B85D3B]">
                {strategy.recommendedKpis.targetCrSale}
              </span>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-[#7A827E] block">
                LTV / CAC
              </span>
              <span className="mt-1 block text-sm font-extrabold text-[#1F3A33]">
                {strategy.recommendedKpis.optimalLtvCacRatio}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. РЕНТГЕН ЦЕЛЕВОЙ АУДИТОРИИ: СЕГМЕНТЫ, БОЛИ И ТРИГГЕРЫ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Сегменты ЦА */}
        <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 nordic-shadow">
          <div className="flex items-center gap-2.5 border-b border-[#ECE9E2] pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF0ED] text-[#1F3A33]">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#1C242B]">Кто ваши покупатели (Сегменты ЦА)</h3>
              <p className="text-[11px] text-[#5C6460]">Цикл сделки: {strategy.targetAudience.dealCycle}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs text-[#5C6460]">
            {strategy.targetAudience.segments.map((seg, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-[#FBF9F5] border border-[#ECE9E2] p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF0ED] text-[10px] font-bold text-[#1F3A33]">
                  {i + 1}
                </span>
                <span className="leading-relaxed text-[#1C242B]">{seg}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Боли и страхи клиентов */}
        <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 nordic-shadow">
          <div className="flex items-center gap-2.5 border-b border-[#ECE9E2] pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF2EE] text-[#B85D3B]">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#1C242B]">Главные боли и страхи клиентов</h3>
              <p className="text-[11px] text-[#5C6460]">На что давить в рекламных роликах</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs text-[#5C6460]">
            {strategy.targetAudience.corePains.map((pain, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-[#FAF2EE]/60 border border-[#E6CFC4] p-2.5">
                <span className="text-[#B85D3B] font-bold">✕</span>
                <span className="leading-relaxed text-[#1C242B]">{pain}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Триггеры мгновенной покупки */}
        <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 nordic-shadow">
          <div className="flex items-center gap-2.5 border-b border-[#ECE9E2] pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF0ED] text-[#1F3A33]">
              <Flame className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#1C242B]">Триггеры высокой конверсии</h3>
              <p className="text-[11px] text-[#5C6460]">Что заставляет оставить заявку сразу</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs text-[#5C6460]">
            {strategy.targetAudience.purchaseTriggers.map((trig, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-[#EAF0ED]/60 border border-[#D5DFDA] p-2.5">
                <span className="text-[#1F3A33] font-bold">⚡</span>
                <span className="leading-relaxed text-[#1C242B]">{trig}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3. ГОТОВЫЕ РЕКЛАМНЫЕ КРЕАТИВЫ И СЦЕНАРИИ ПО КАНАЛАМ */}
      <div className="rounded-3xl border border-[#E2DDD3] bg-white p-6 nordic-shadow">
        <div className="flex flex-col gap-3 border-b border-[#ECE9E2] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0ED] text-[#1F3A33]">
              <Video className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#1C242B]">
                Готовые рекламные креативы и офферы для запуска
              </h3>
              <p className="text-xs text-[#5C6460]">
                Скопируйте сценарий и передайте таргетологу или используйте для съемки Reels / настройки 2GIS
              </p>
            </div>
          </div>

          {onOpenChatWithMode && (
            <button
              type="button"
              onClick={() => onOpenChatWithMode("creatives")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F3A33] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#162B25]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Сгенерировать ещё креативы с ИИ</span>
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {strategy.creatives.map((cr, idx) => {
            const copyId = `cr-${idx}`;
            const fullText = `Канал: ${cr.channel} (${cr.format})\nЗаголовок: ${cr.headline}\nХук: ${cr.hook}\nОффер: ${cr.offer}\nПризыв (CTA): ${cr.cta}`;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-5 transition hover:border-[#1F3A33]/40"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-[#EAF0ED] px-2.5 py-1 text-[11px] font-bold text-[#1F3A33]">
                      {cr.channel}
                    </span>
                    <span className="text-[11px] font-semibold text-[#3B6E8C]">
                      CTR: {cr.expectedCtr}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#7A827E]">{cr.format}</p>

                  <div className="rounded-xl border border-[#E2DDD3] bg-white p-3">
                    <span className="text-[10px] uppercase tracking-wider text-[#1F3A33] font-semibold block">
                      Заголовок объявления:
                    </span>
                    <p className="mt-0.5 text-xs font-bold text-[#1C242B]">«{cr.headline}»</p>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="text-[#5C6460]">
                      <strong className="text-[#1C242B]">Хук (первые 3 сек):</strong> {cr.hook}
                    </p>
                    <p className="text-[#1F3A33]">
                      <strong className="font-bold">Оффер:</strong> {cr.offer}
                    </p>
                    <p className="text-[#B85D3B]">
                      <strong className="font-bold">Призыв (CTA):</strong> {cr.cta}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(copyId, fullText)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#D8D2C5] bg-white py-2 text-xs font-semibold text-[#1C242B] transition hover:border-[#1F3A33] hover:text-[#1F3A33]"
                >
                  {copiedId === copyId ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#1F3A33]" />
                      <span className="text-[#1F3A33]">Скопировано в буфер!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Скопировать ТЗ креатива</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. СКРИПТЫ ПРОДАЖ В WHATSAPP И CRM + КОНКУРЕНТНАЯ ОТСТРОЙКА */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Скрипты отдела продаж (7 колонок) */}
        <div className="rounded-3xl border border-[#E2DDD3] bg-white p-6 nordic-shadow lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[#ECE9E2] pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0ED] text-[#1F3A33]">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[#1C242B]">
                  Скрипты закрытия заявок (WhatsApp / Отдел продаж)
                </h3>
                <p className="text-xs text-[#5C6460]">
                  Пошаговый сценарий общения для максимальной конверсии в оплату
                </p>
              </div>
            </div>

            {onOpenChatWithMode && (
              <button
                type="button"
                onClick={() => onOpenChatWithMode("funnel_scripts")}
                className="text-xs font-bold text-[#1F3A33] hover:text-[#162B25] flex items-center gap-1"
              >
                <span>Доработать в ИИ</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3.5">
            {strategy.salesFunnelScripts.map((sc, idx) => {
              const sId = `sc-${idx}`;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#1F3A33]">{sc.step}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white border border-[#E2DDD3] px-2 py-0.5 text-[10px] text-[#5C6460]">
                        ⏱ {sc.timing}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(sId, sc.script)}
                        className="rounded-md border border-[#D8D2C5] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#1C242B] hover:border-[#1F3A33] hover:text-[#1F3A33]"
                      >
                        {copiedId === sId ? "Скопировано ✓" : "Копировать"}
                      </button>
                    </div>
                  </div>

                  <p className="rounded-xl bg-white p-3 text-xs italic leading-relaxed text-[#1C242B] border-l-2 border-[#1F3A33]">
                    {sc.script}
                  </p>

                  <p className="text-[11px] text-[#1F3A33] font-semibold">
                    🎯 Цель шага: <span className="font-normal text-[#5C6460]">{sc.goal}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Смета открытия CAPEX + Конкурентное преимущество (5 колонок) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Распределение CAPEX */}
          <div className="rounded-3xl border border-[#E2DDD3] bg-white p-6 nordic-shadow">
            <div className="flex items-center gap-3 border-b border-[#ECE9E2] pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF2EE] text-[#B85D3B]">
                <Briefcase className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#1C242B]">
                  Смета стартовых вложений (CAPEX)
                </h3>
                <p className="text-xs text-[#5C6460]">
                  Общий бюджет запуска:{" "}
                  <strong className="text-[#1F3A33]">
                    {formatMoney(data.openingBudget || sphere.defaultOpenBudget, currency)}
                  </strong>
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {strategy.capexBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1C242B]">{item.category}</span>
                    <span className="font-bold text-[#1F3A33]">
                      {item.sharePct}% ({formatMoney(item.amount, currency)})
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#ECE9E2] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1F3A33]"
                      style={{ width: `${item.sharePct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#7A827E]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Отстройка от конкурентов */}
          <div className="rounded-3xl border border-[#D5DFDA] bg-[#EAF0ED]/60 p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <Award className="h-5 w-5 text-[#1F3A33]" />
              <h3 className="text-sm font-bold text-[#1C242B]">
                Как обойти 90% конкурентов в этой сфере
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-[#1C242B]">
              {strategy.competitorEdge.map((edge, idx) => (
                <li key={idx} className="flex items-start gap-2 rounded-xl bg-white p-3 border border-[#D5DFDA]">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#1F3A33]" />
                  <span>{edge}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 5. ИНТЕРАКТИВНЫЙ ТРЕКЕР ЗАПУСКА ПРОЕКТА */}
      {allChecklistItems.length > 0 && (
        <div className="rounded-3xl border border-[#E2DDD3] bg-white p-6 nordic-shadow">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#ECE9E2] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#1C242B]">
                Интерактивный Чек-лист готовности бизнеса к запуску
              </h3>
              <p className="text-xs text-[#5C6460]">
                Отмечайте выполненные задачи по продвижению вашей сферы «{strategy.industry}»
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-36 h-2.5 rounded-full bg-[#ECE9E2] overflow-hidden">
                <div
                  className="h-full bg-[#1F3A33] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-extrabold text-[#1F3A33]">
                {progressPct}% готово
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {allChecklistItems.map((item) => {
              const checked = !!checkedTasks[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setCheckedTasks((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                  }
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left text-xs transition ${
                    checked
                      ? "border-[#D5DFDA] bg-[#EAF0ED]/70 text-[#5C6460]"
                      : "border-[#E2DDD3] bg-[#FBF9F5] text-[#1C242B] hover:border-[#1F3A33]/40"
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#1F3A33]" />
                  ) : (
                    <Square className="mt-0.5 h-4 w-4 shrink-0 text-[#7A827E]" />
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F3A33] block">
                      {item.week}
                    </span>
                    <span className={checked ? "line-through text-[#7A827E]" : "font-medium"}>
                      {item.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
