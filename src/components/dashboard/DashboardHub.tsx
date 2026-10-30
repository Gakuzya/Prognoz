"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Sparkles,
  Bot,
  BarChart3,
  FileText,
  RotateCcw,
  Zap,
  TrendingUp,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import AiChatClient from "./AiChatClient";
import SimulatorClient from "./SimulatorClient";
import ResultsView from "./ResultsView";
import {
  StructuredPlanData,
  convertPlanDataToForecastResult,
} from "./planConverter";
import { ForecastResult, formatMoney } from "./types";

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
  initialTab?: "chat" | "simulator" | "report";
}

interface ActiveProjectState {
  industry: string;
  location: string;
  openingBudget: number;
  adBudget: number;
  avgCheck: number;
  currency: string;
  channels: { name: string; historicalCac: number; conversionRate: number }[];
  forecastResult: ForecastResult | null;
  lastUpdated: string;
}

const STORAGE_KEY = "adforecast_active_project_state";

export default function DashboardHub({
  company,
  branches = [],
  initialTab = "chat",
}: DashboardHubProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "simulator" | "report">(initialTab);
  const [, startTransition] = useTransition();

  // Активный проект, который запоминает ИИ
  const [project, setProject] = useState<ActiveProjectState | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // Игнорируем ошибки парсинга
      }
    }
    return null;
  });

  // Сохраняем состояние проекта в localStorage при изменениях
  useEffect(() => {
    if (project) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    }
  }, [project]);

  // Обработчик получения нового структурированного плана от ИИ
  const handlePlanGenerated = (planData: StructuredPlanData) => {
    const currency = planData.currency || company.currency || "KZT";
    const generatedResult = convertPlanDataToForecastResult(planData, currency);

    const channels =
      planData.channelAllocations && planData.channelAllocations.length > 0
        ? planData.channelAllocations.map((c) => ({
            name: c.channel,
            historicalCac: c.estimatedCac,
            conversionRate: 2.8,
          }))
        : generatedResult.allocations.map((a) => ({
            name: a.channel,
            historicalCac: a.effectiveCac || 8000,
            conversionRate: 2.8,
          }));

    const newProject: ActiveProjectState = {
      industry: planData.industry || company.industry || "Бизнес в РК",
      location: "Казахстан",
      openingBudget: Number(planData.openingBudget) || 5000000,
      adBudget: Number(planData.adBudget) || 600000,
      avgCheck: company.avgCheck || 35000,
      currency,
      channels,
      forecastResult: generatedResult,
      lastUpdated: new Date().toISOString(),
    };

    setProject(newProject);
  };

  // Мгновенный переход к графикам из сообщения ИИ
  const handleOpenCharts = (planData?: StructuredPlanData) => {
    if (planData) {
      handlePlanGenerated(planData);
    }
    startTransition(() => {
      setActiveTab("simulator");
    });
  };

  // Сброс и очистка проекта для новой темы/бизнеса
  const handleResetProject = () => {
    if (
      confirm(
        "Очистить текущий проект и графики? Вы сможете начать расчёт нового бизнеса с чистого листа."
      )
    ) {
      setProject(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("adforecast_chat_history");
      startTransition(() => {
        setActiveTab("chat");
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 🌟 ВЕРХНЯЯ ИНТЕРАКТИВНАЯ ПАНЕЛЬ АКТИВНОГО ПРОЕКТА */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-slate-900/95 to-indigo-950 p-4 text-white shadow-xl backdrop-blur-xl">
        {/* Фоновые градиентные блики */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-purple-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Слева: Информация о текущем проекте, сохраненном ИИ */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
              {project ? (
                <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
              ) : (
                <Bot className="h-5 w-5" />
              )}
              {project && (
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white sm:text-base">
                  {project
                    ? `Активный проект: ${project.industry}`
                    : "ИИ-Штаб прогнозирования рекламы (Казахстан)"}
                </span>

                {project ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 shadow-xs">
                    Синхронизировано в памяти
                  </span>
                ) : (
                  <span className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                    Готов к диалогу
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                {project ? (
                  <>
                    <span className="text-slate-400">
                      Реклама:{" "}
                      <strong className="text-white">
                        {formatMoney(project.adBudget, project.currency)}
                      </strong>
                    </span>
                    <span className="text-slate-400">
                      Прогноз выручки:{" "}
                      <strong className="text-indigo-300">
                        {formatMoney(
                          project.forecastResult?.totals.revenue || 0,
                          project.currency
                        )}
                      </strong>
                    </span>
                    <span className="text-slate-400">
                      Чистая прибыль:{" "}
                      <strong className="text-emerald-300">
                        {formatMoney(
                          project.forecastResult?.totals.profit || 0,
                          project.currency
                        )}
                      </strong>
                    </span>
                    <span className="text-slate-400">
                      ROI:{" "}
                      <strong className="text-purple-300">
                        +{project.forecastResult?.totals.roi || 0}%
                      </strong>
                    </span>
                  </>
                ) : (
                  <span>
                    Напишите ИИ вашу идею (например: «Хочу открыть СТО в Астане») — ИИ
                    рассчитает каналы и построит графики.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Справа: Кнопка очистки / нового проекта */}
          <div className="flex items-center gap-2">
            {project && (
              <button
                type="button"
                onClick={handleResetProject}
                title="Очистить память проекта и начать новый бизнес"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 shadow-sm transition hover:bg-white/10 hover:text-white active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                <span>Новый проект / Сброс</span>
              </button>
            )}
          </div>
        </div>

        {/* 🧭 МГНОВЕННЫЙ ПЕРЕКЛЮЧАТЕЛЬ ВКЛАДОК (0ms задержки) */}
        <div className="mt-4 flex gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 scale-100 ring-1 ring-white/20"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>1. ИИ-Стратег (Диалог и план)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 ${
              activeTab === "simulator"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 scale-100 ring-1 ring-white/20"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>2. Интерактивные графики & Симулятор</span>
            {project && (
              <span className="rounded-full bg-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300">
                Готово
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 ${
              activeTab === "report"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 scale-100 ring-1 ring-white/20"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>3. Отчёт и PDF</span>
          </button>
        </div>
      </div>

      {/* 🚀 СОДЕРЖИМОЕ АКТИВНОЙ ВКЛАДКИ */}
      <div className="transition-all duration-150">
        {/* ВКЛАДКА 1: ИИ-СТРАТЕГ (ЧАТ) */}
        {activeTab === "chat" && (
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md">
            <AiChatClient
              initialCompany={{
                name: company.name,
                industry: project?.industry || company.industry,
                currency: project?.currency || company.currency,
              }}
              onPlanGenerated={handlePlanGenerated}
              onOpenCharts={handleOpenCharts}
              onResetProject={handleResetProject}
              activeProjectName={project?.industry}
            />
          </div>
        )}

        {/* ВКЛАДКА 2: ИНТЕРАКТИВНЫЕ ГРАФИКИ & СИМУЛЯТОР */}
        {activeTab === "simulator" && (
          <div className="space-y-4">
            <SimulatorClient
              company={{
                currency: project?.currency || company.currency,
                avgCheck: project?.avgCheck || company.avgCheck,
                targetMargin: company.targetMargin,
                ltv: company.ltv,
              }}
              branches={branches}
              externalResult={project?.forecastResult || null}
              externalParams={
                project
                  ? {
                      industry: project.industry,
                      totalBudget: project.adBudget,
                      avgCheck: project.avgCheck,
                      channels: project.channels,
                    }
                  : null
              }
              onSwitchToChat={() => setActiveTab("chat")}
              onClearProject={handleResetProject}
            />
          </div>
        )}

        {/* ВКЛАДКА 3: ЭКСПОРТ И PDF-ОТЧЕТ */}
        {activeTab === "report" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {project?.forecastResult ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Итоговый отчёт проекта: {project.industry}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Сгенерировано предиктивным ML-движком AdForecast и мультиагентной
                      ИИ-системой.
                    </p>
                  </div>

                  <span className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    Рентабельность ROI +{project.forecastResult.totals.roi}%
                  </span>
                </div>

                <ResultsView
                  data={project.forecastResult}
                  currency={project.currency}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  Отчёт ещё не сформирован
                </h3>
                <p className="mt-1.5 max-w-sm text-xs text-slate-500">
                  Перейдите во вкладку «ИИ-Стратег» и обсудите запуск или параметры бизнеса,
                  чтобы мгновенно построить отчёт и графики.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-95"
                >
                  <Bot className="h-4 w-4" />
                  <span>Перейти к диалогу с ИИ</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
