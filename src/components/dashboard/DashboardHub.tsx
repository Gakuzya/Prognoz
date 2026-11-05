"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  BarChart3,
  FileText,
  RotateCcw,
  Crown,
  Rocket,
  ArrowLeft,
  TrendingUp,
  Layers,
} from "lucide-react";
import AiChatClient, { AiAgentMode } from "./AiChatClient";
import SimulatorClient from "./SimulatorClient";
import ResultsView from "./ResultsView";
import PromotionHub from "./PromotionHub";
import {
  StructuredPlanData,
  SPHERE_CATALOG,
  convertPlanDataToForecastResult,
  resolveSphereBenchmark,
} from "./planConverter";
import { ForecastResult, formatMoney } from "./types";

export type DashboardTab = "chat" | "simulator" | "promotion" | "report";

interface DashboardHubProps {
  company: {
    currency: string;
    avgCheck: number;
    targetMargin: number;
    ltv: number;
    name?: string;
    industry?: string;
  };
  branches?: { id: string; name: string }[];
  initialTab?: DashboardTab;
}

interface ActiveProjectState {
  industry: string;
  location: string;
  openingBudget: number;
  adBudget: number;
  avgCheck: number;
  currency: string;
  channels: { name: string; historicalCac: number; conversionRate: number }[];
  forecastResult: ForecastResult;
  lastUpdated: string;
}

const STORAGE_KEY = "adforecast_active_project_v3";
const QUICK_LAUNCH_KEY = "adforecast_quick_launch";

function buildDefaultProject(company: DashboardHubProps["company"]): ActiveProjectState {
  const sphere = resolveSphereBenchmark(company.industry);
  const currency = company.currency || "KZT";
  const forecast = convertPlanDataToForecastResult(
    {
      industry: company.industry || sphere.name,
      openingBudget: sphere.defaultOpenBudget,
      adBudget: sphere.defaultAdBudget,
      avgCheck: company.avgCheck || sphere.avgCheck,
      targetMargin: company.targetMargin || sphere.marginPct,
      ltv: company.ltv || sphere.ltv,
      currency,
    },
    currency
  );

  return {
    industry: company.industry || sphere.name,
    location: "Алматы / Астана, Казахстан",
    openingBudget: sphere.defaultOpenBudget,
    adBudget: sphere.defaultAdBudget,
    avgCheck: company.avgCheck || sphere.avgCheck,
    currency,
    channels: sphere.channels.map((c) => ({
      name: c.name,
      historicalCac: c.cac,
      conversionRate: c.cr,
    })),
    forecastResult: forecast,
    lastUpdated: new Date().toISOString(),
  };
}

export default function DashboardHub({
  company,
  branches = [],
  initialTab = "chat",
}: DashboardHubProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [, startTransition] = useTransition();
  const [externalPromptTrigger, setExternalPromptTrigger] = useState<{
    prompt: string;
    mode?: AiAgentMode;
    timestamp: number;
  } | null>(null);

  const [project, setProject] = useState<ActiveProjectState>(() =>
    buildDefaultProject(company)
  );

  // Загружаем сохраненный проект или переход с Первой страницы (Витрины /)
  useEffect(() => {
    try {
      const quickLaunchRaw = localStorage.getItem(QUICK_LAUNCH_KEY);
      if (quickLaunchRaw) {
        localStorage.removeItem(QUICK_LAUNCH_KEY);
        const ql = JSON.parse(quickLaunchRaw);
        const sphere = resolveSphereBenchmark(ql.industry || ql.prompt);
        const industryName = ql.industry || sphere.name;
        const openBudget = Number(ql.openingBudget) || sphere.defaultOpenBudget;
        const adBudget = Number(ql.adBudget) || sphere.defaultAdBudget;
        const avgCheck = Number(ql.avgCheck) || sphere.avgCheck;
        const currency = ql.currency || company.currency || "KZT";

        const forecast = convertPlanDataToForecastResult(
          {
            industry: industryName,
            location: ql.location || "Казахстан",
            openingBudget: openBudget,
            adBudget,
            avgCheck,
            targetMargin: sphere.marginPct,
            ltv: sphere.ltv,
            currency,
          },
          currency
        );

        const nextProj: ActiveProjectState = {
          industry: industryName,
          location: ql.location || "Казахстан",
          openingBudget: openBudget,
          adBudget,
          avgCheck,
          currency,
          channels: sphere.channels.map((c) => ({
            name: c.name,
            historicalCac: c.cac,
            conversionRate: c.cr,
          })),
          forecastResult: forecast,
          lastUpdated: new Date().toISOString(),
        };

        setProject(nextProj);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProj));

        if (ql.targetTab) {
          setActiveTab(ql.targetTab as DashboardTab);
        }
        if (ql.prompt) {
          setExternalPromptTrigger({
            prompt: ql.prompt,
            mode: "full_360",
            timestamp: Date.now(),
          });
        }
        return;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.forecastResult) {
          setProject(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [company]);

  useEffect(() => {
    if (project) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    }
  }, [project]);

  const handlePlanGenerated = (planData: StructuredPlanData) => {
    const currency = planData.currency || company.currency || "KZT";
    const generatedResult = convertPlanDataToForecastResult(planData, currency);

    const channels =
      planData.channelAllocations && planData.channelAllocations.length > 0
        ? planData.channelAllocations.map((c) => ({
          name: c.channel,
          historicalCac: c.estimatedCac,
          conversionRate: 3.2,
        }))
        : generatedResult.allocations.map((a) => ({
          name: a.channel,
          historicalCac: a.effectiveCac || 7500,
          conversionRate: 3.2,
        }));

    const newProject: ActiveProjectState = {
      industry: generatedResult.industry || planData.industry || project.industry,
      location: generatedResult.location || "Казахстан",
      openingBudget: Number(planData.openingBudget) || generatedResult.openingBudget || 5000000,
      adBudget: Number(planData.adBudget) || generatedResult.adBudget || 600000,
      avgCheck: Number(planData.avgCheck) || generatedResult.avgCheck || 42000,
      currency,
      channels,
      forecastResult: generatedResult,
      lastUpdated: new Date().toISOString(),
    };

    setProject(newProject);
  };

  // Быстрое переключение сферы прямо из верхней золотой панели
  const handleQuickSphereSwitch = (sphereId: string) => {
    const sp = SPHERE_CATALOG.find((s) => s.id === sphereId);
    if (!sp) return;
    handlePlanGenerated({
      industry: sp.name,
      openingBudget: sp.defaultOpenBudget,
      adBudget: sp.defaultAdBudget,
      avgCheck: sp.avgCheck,
      targetMargin: sp.marginPct,
      ltv: sp.ltv,
      currency: project.currency,
    });
  };

  const handleOpenCharts = (planData?: StructuredPlanData) => {
    if (planData) handlePlanGenerated(planData);
    startTransition(() => {
      setActiveTab("simulator");
    });
  };

  const handleOpenPromotion = (planData?: StructuredPlanData) => {
    if (planData) handlePlanGenerated(planData);
    startTransition(() => {
      setActiveTab("promotion");
    });
  };

  const handleOpenChatWithMode = (mode: AiAgentMode) => {
    startTransition(() => {
      setActiveTab("chat");
      setExternalPromptTrigger({
        prompt: `Проведи детальный разбор по режиму «${mode}» для моего проекта в сфере «${project.industry}» (рекламный бюджет ${project.adBudget.toLocaleString("ru-KZ")} ₸, стартовый капитал ${project.openingBudget.toLocaleString("ru-KZ")} ₸).`,
        mode,
        timestamp: Date.now(),
      });
    });
  };

  const handleResetProject = () => {
    const def = buildDefaultProject(company);
    setProject(def);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
  };

  return (
    <div className="space-y-5">
      {/* 👑 ЗОЛОТОЙ КОМАНДНЫЙ ЦЕНТР АКТИВНОГО БИЗНЕС-ПРОЕКТА */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/35 bg-gradient-to-br from-[#12121a] via-[#0c0c12] to-[#1a1406] p-5 text-white shadow-2xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-52 w-52 rounded-full bg-yellow-600/10 blur-3xl" />

        {/* Верхняя полоса связи Страницы 1 и Страницы 2 */}
        <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-bold text-amber-300 transition hover:bg-amber-500 hover:text-black"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>На Главную Витрину (Страница 1)</span>
            </Link>
            <span className="hidden sm:inline text-zinc-500">|</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-zinc-300 font-medium">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>Рабочий Терминал ИИ и Графиков (Страница 2)</span>
            </span>
          </div>

          {/* Быстрый селектор сферы бизнеса */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400">Быстрая смена сферы:</span>
            <select
              value={
                SPHERE_CATALOG.find((s) => s.name === project.industry)?.id ||
                SPHERE_CATALOG[0].id
              }
              onChange={(e) => handleQuickSphereSwitch(e.target.value)}
              className="rounded-xl border border-amber-500/40 bg-black/70 px-3 py-1.5 text-xs font-bold text-amber-200 outline-none focus:border-amber-400"
            >
              {SPHERE_CATALOG.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.icon} {sp.shortName}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleResetProject}
              title="Сбросить к базовым настройкам"
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-amber-500/40 hover:text-amber-300"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Сброс</span>
            </button>
          </div>
        </div>

        {/* Основная сводка по текущему продвигаемому бизнесу */}
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/25">
              <Crown className="h-6 w-6" />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-[#0c0c12]"></span>
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  Продвигаемый бизнес-проект:
                </span>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  6 графиков и ИИ синхронизированы
                </span>
              </div>

              <h1 className="mt-0.5 text-lg font-extrabold tracking-tight text-white sm:text-xl">
                {project.industry}
              </h1>

              <p className="mt-1 text-xs text-zinc-400 line-clamp-1">
                УТП: {project.forecastResult.promotionStrategy?.positioningUsp || project.forecastResult.summary}
              </p>
            </div>
          </div>

          {/* 5 Мини-карточек экономики в реальном времени */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/50 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                Старт (CAPEX)
              </span>
              <span className="mt-0.5 block text-xs sm:text-sm font-extrabold text-white">
                {formatMoney(project.openingBudget, project.currency)}
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/50 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                Реклама / мес
              </span>
              <span className="mt-0.5 block text-xs sm:text-sm font-extrabold text-amber-300">
                {formatMoney(project.adBudget, project.currency)}
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/50 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                Прогноз выручки
              </span>
              <span className="mt-0.5 block text-xs sm:text-sm font-extrabold text-sky-300">
                {formatMoney(project.forecastResult.totals.revenue, project.currency)}
              </span>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300 block">
                Чистая прибыль
              </span>
              <span className="mt-0.5 block text-xs sm:text-sm font-extrabold text-emerald-400">
                {formatMoney(project.forecastResult.totals.profit, project.currency)}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2.5">
              <span className="text-[10px] uppercase tracking-wider text-amber-300 block">
                ROI & Возврат
              </span>
              <span className="mt-0.5 block text-xs sm:text-sm font-extrabold text-amber-300">
                +{project.forecastResult.totals.roi}% ({project.forecastResult.paybackMonths || 3.5} мес)
              </span>
            </div>
          </div>
        </div>

        {/* 🧭 4 КЛЮЧЕВЫХ МОДУЛЯ ПЛАТФОРМЫ */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold transition-all ${activeTab === "chat"
              ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/25"
              : "border border-white/10 bg-white/5 text-zinc-300 hover:border-amber-500/40 hover:text-white"
              }`}
          >
            <Bot className="h-4 w-4 shrink-0" />
            <span>1. ИИ-Штаб (5 Агентов)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold transition-all ${activeTab === "simulator"
              ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/25"
              : "border border-white/10 bg-white/5 text-zinc-300 hover:border-amber-500/40 hover:text-white"
              }`}
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span>2. Симулятор & 6 Графиков</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("promotion")}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold transition-all ${activeTab === "promotion"
              ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/25"
              : "border border-white/10 bg-white/5 text-zinc-300 hover:border-amber-500/40 hover:text-white"
              }`}
          >
            <Rocket className="h-4 w-4 shrink-0" />
            <span>3. Продвижение & Креативы</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold transition-all ${activeTab === "report"
              ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/25"
              : "border border-white/10 bg-white/5 text-zinc-300 hover:border-amber-500/40 hover:text-white"
              }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>4. Инвест-Отчёт & PDF</span>
          </button>
        </div>
      </div>

      {/* 🚀 СОДЕРЖИМОЕ АКТИВНОГО МОДУЛЯ */}
      <div>
        {activeTab === "chat" && (
          <AiChatClient
            initialCompany={{
              name: company.name,
              industry: project.industry,
              currency: project.currency,
              avgCheck: project.avgCheck,
            }}
            onPlanGenerated={handlePlanGenerated}
            onOpenCharts={handleOpenCharts}
            onOpenPromotion={handleOpenPromotion}
            onResetProject={handleResetProject}
            activeProjectName={project.industry}
            externalPromptTrigger={externalPromptTrigger}
          />
        )}

        {activeTab === "simulator" && (
          <SimulatorClient
            company={{
              currency: project.currency,
              avgCheck: project.avgCheck,
              targetMargin: company.targetMargin,
              ltv: company.ltv,
            }}
            branches={branches}
            externalResult={project.forecastResult}
            externalParams={{
              industry: project.industry,
              openingBudget: project.openingBudget,
              totalBudget: project.adBudget,
              avgCheck: project.avgCheck,
              channels: project.channels,
            }}
            onForecastUpdated={(newResult, meta) => {
              setProject((prev) => ({
                ...prev,
                industry: meta.industry,
                openingBudget: meta.openingBudget,
                adBudget: meta.adBudget,
                avgCheck: meta.avgCheck,
                channels: meta.channels,
                forecastResult: newResult,
                lastUpdated: new Date().toISOString(),
              }));
            }}
            onSwitchToChat={() => setActiveTab("chat")}
          />
        )}

        {activeTab === "promotion" && (
          <PromotionHub
            data={project.forecastResult}
            currency={project.currency}
            onOpenChatWithMode={handleOpenChatWithMode}
          />
        )}

        {activeTab === "report" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-amber-500/30 bg-[#101016] p-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Готовый Меморандум для Инвестора и Руководства
                </span>
                <h2 className="mt-1 text-lg font-extrabold text-white">
                  Финансово-маркетинговый отчёт: {project.industry}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-extrabold text-emerald-400">
                  Прогноз ROI +{project.forecastResult.totals.roi}%
                </span>
              </div>
            </div>

            <ResultsView
              data={project.forecastResult}
              currency={project.currency}
            />
          </div>
        )}
      </div>
    </div>
  );
}
