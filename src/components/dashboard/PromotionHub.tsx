"use client";

import { useState } from "react";
import {
  Crown,
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
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#14141d] via-[#0e0e14] to-[#1a1508] p-6 shadow-2xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span>Полное руководство по продвижению сферы: {strategy.industry}</span>
            </div>

            <h2 className="text-xl font-extrabold text-white sm:text-2xl">
              Уникальное Торговое Предложение (УТП):
            </h2>
            <p className="rounded-2xl border border-amber-500/25 bg-black/40 p-4 text-sm font-medium leading-relaxed text-amber-100">
              «{strategy.positioningUsp}»
            </p>
          </div>

          {/* Целевые KPI воронки */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-auto shrink-0">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                Норма CTR
              </span>
              <span className="mt-1 block text-sm font-extrabold text-amber-400">
                {strategy.recommendedKpis.targetCtr}
              </span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                Конверсия в лид
              </span>
              <span className="mt-1 block text-sm font-extrabold text-emerald-400">
                {strategy.recommendedKpis.targetCrWebsite}
              </span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                Лид → Продажа
              </span>
              <span className="mt-1 block text-sm font-extrabold text-sky-400">
                {strategy.recommendedKpis.targetCrSale}
              </span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                LTV / CAC
              </span>
              <span className="mt-1 block text-sm font-extrabold text-amber-300">
                {strategy.recommendedKpis.optimalLtvCacRatio}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. РЕНТГЕН ЦЕЛЕВОЙ АУДИТОРИИ: СЕГМЕНТЫ, БОЛИ И ТРИГГЕРЫ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Сегменты ЦА */}
        <div className="rounded-2xl border border-white/10 bg-[#101016] p-5">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Кто ваши покупатели (Сегменты ЦА)</h3>
              <p className="text-[11px] text-zinc-400">Цикл сделки: {strategy.targetAudience.dealCycle}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs text-zinc-300">
            {strategy.targetAudience.segments.map((seg, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{seg}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Боли и страхи клиентов */}
        <div className="rounded-2xl border border-white/10 bg-[#101016] p-5">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Главные боли и страхи клиентов</h3>
              <p className="text-[11px] text-zinc-400">На что давить в рекламных роликах</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs text-zinc-300">
            {strategy.targetAudience.corePains.map((pain, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-rose-500/[0.05] border border-rose-500/15 p-2.5">
                <span className="text-rose-400 font-bold">✕</span>
                <span className="leading-relaxed">{pain}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Триггеры мгновенной покупки */}
        <div className="rounded-2xl border border-white/10 bg-[#101016] p-5">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Flame className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Триггеры высокой конверсии</h3>
              <p className="text-[11px] text-zinc-400">Что заставляет оставить заявку сразу</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs text-zinc-300">
            {strategy.targetAudience.purchaseTriggers.map((trig, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15 p-2.5">
                <span className="text-emerald-400 font-bold">⚡</span>
                <span className="leading-relaxed">{trig}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3. ГОТОВЫЕ РЕКЛАМНЫЕ КРЕАТИВЫ И СЦЕНАРИИ ПО КАНАЛАМ */}
      <div className="rounded-3xl border border-amber-500/20 bg-[#0d0d13] p-6">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Video className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                Готовые рекламные креативы и офферы для запуска
              </h3>
              <p className="text-xs text-zinc-400">
                Скопируйте сценарий и передайте таргетологу или используйте для съемки Reels / настройки 2GIS
              </p>
            </div>
          </div>

          {onOpenChatWithMode && (
            <button
              type="button"
              onClick={() => onOpenChatWithMode("creatives")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500 hover:text-black"
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
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#14141d] p-5 transition hover:border-amber-500/40"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                      {cr.channel}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400">
                      CTR: {cr.expectedCtr}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400">{cr.format}</p>

                  <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 block">
                      Заголовок объявления:
                    </span>
                    <p className="mt-0.5 text-xs font-bold text-white">«{cr.headline}»</p>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="text-zinc-300">
                      <strong className="text-zinc-100">Хук (первые 3 сек):</strong> {cr.hook}
                    </p>
                    <p className="text-emerald-300">
                      <strong className="text-emerald-400">Оффер:</strong> {cr.offer}
                    </p>
                    <p className="text-amber-200">
                      <strong className="text-amber-400">Призыв (CTA):</strong> {cr.cta}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(copyId, fullText)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-zinc-200 transition hover:border-amber-500/40 hover:text-amber-300"
                >
                  {copiedId === copyId ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Скопировано в буфер!</span>
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
        <div className="rounded-3xl border border-white/10 bg-[#0d0d13] p-6 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">
                  Скрипты закрытия заявок (WhatsApp / Отдел продаж)
                </h3>
                <p className="text-xs text-zinc-400">
                  Пошаговый сценарий общения для максимальной конверсии в оплату
                </p>
              </div>
            </div>

            {onOpenChatWithMode && (
              <button
                type="button"
                onClick={() => onOpenChatWithMode("funnel_scripts")}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
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
                  className="rounded-2xl border border-white/10 bg-[#14141d] p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-300">{sc.step}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
                        ⏱ {sc.timing}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(sId, sc.script)}
                        className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-zinc-300 hover:border-amber-500/40 hover:text-amber-300"
                      >
                        {copiedId === sId ? "Скопировано ✓" : "Копировать"}
                      </button>
                    </div>
                  </div>

                  <p className="rounded-xl bg-black/40 p-3 text-xs italic leading-relaxed text-zinc-100 border-l-2 border-amber-400">
                    {sc.script}
                  </p>

                  <p className="text-[11px] text-emerald-400">
                    🎯 Цель шага: <span className="text-zinc-300">{sc.goal}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Смета открытия CAPEX + Конкурентное преимущество (5 колонок) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Распределение CAPEX */}
          <div className="rounded-3xl border border-white/10 bg-[#0d0d13] p-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Briefcase className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Смета стартовых вложений (CAPEX)
                </h3>
                <p className="text-xs text-zinc-400">
                  Общий бюджет запуска:{" "}
                  <strong className="text-amber-300">
                    {formatMoney(data.openingBudget || sphere.defaultOpenBudget, currency)}
                  </strong>
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {strategy.capexBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{item.category}</span>
                    <span className="font-bold text-amber-300">
                      {item.sharePct}% ({formatMoney(item.amount, currency)})
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-600"
                      style={{ width: `${item.sharePct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Отстройка от конкурентов */}
          <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-500/10 to-[#0d0d13] p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <Award className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Как обойти 90% конкурентов в этой сфере
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-zinc-200">
              {strategy.competitorEdge.map((edge, idx) => (
                <li key={idx} className="flex items-start gap-2 rounded-xl bg-black/40 p-3 border border-amber-500/15">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>{edge}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 5. ИНТЕРАКТИВНЫЙ ТРЕКЕР ЗАПУСКА ПРОЕКТА */}
      {allChecklistItems.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-[#0d0d13] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Интерактивный Чек-лист готовности бизнеса к запуску
              </h3>
              <p className="text-xs text-zinc-400">
                Отмечайте выполненные задачи по продвижению вашей сферы «{strategy.industry}»
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-36 h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-extrabold text-amber-300">
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
                      ? "border-emerald-500/30 bg-emerald-500/10 text-zinc-300"
                      : "border-white/10 bg-[#14141d] text-white hover:border-amber-500/40"
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Square className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                      {item.week}
                    </span>
                    <span className={checked ? "line-through text-zinc-400" : "font-medium"}>
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

