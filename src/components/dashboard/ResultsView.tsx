"use client";

import { useRef, useState, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  AlertTriangle,
  Lightbulb,
  FileDown,
  Loader2,
  LineChart as LineChartIcon,
  Sliders,
  ShieldCheck,
  Zap,
  Target,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ForecastResult,
  formatMoney,
  formatNumber,
} from "./types";

interface ResultsViewProps {
  data: ForecastResult;
  currency?: string;
}

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];

type ActiveTab = "overview" | "scenarios" | "curves" | "flightplan";
type ScenarioType = "balanced" | "conservative" | "aggressive";

export default function ResultsView({ data, currency = "KZT" }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("balanced");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Сценарии моделирования
  const scenarios = data.scenarios;
  const currentScenarioData = scenarios?.[selectedScenario];

  // Активные данные (либо из выбранного сценария, либо базовые)
  const activeAllocations = currentScenarioData?.allocations ?? data.allocations;
  const activeTotals = currentScenarioData
    ? {
        leads: data.totals.leads,
        sales: currentScenarioData.expectedSales,
        revenue: currentScenarioData.expectedRevenue,
        profit: currentScenarioData.expectedProfit,
        roi: currentScenarioData.predictedRoi,
      }
    : data.totals;

  // Экспорт аналитического отчета в PDF
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AdForecast_Report_${selectedScenario}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: unknown) {
      console.error("Ошибка при генерации PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Данные для круговой диаграммы (распределение бюджета)
  const pieData = useMemo(() => {
    return activeAllocations.map((a) => ({
      name: a.channel,
      value: a.budget,
      sharePct: a.sharePct,
    }));
  }, [activeAllocations]);

  // Данные для столбчатой диаграммы (Бюджет vs Ожидаемая выручка)
  const barData = useMemo(() => {
    return activeAllocations.map((a) => ({
      name: a.channel,
      Бюджет: a.budget,
      Выручка: a.expectedRevenue,
      Прибыль: a.expectedProfit,
    }));
  }, [activeAllocations]);

  // Данные для графика кривых насыщения (Response Curves)
  const curveChartData = useMemo(() => {
    if (!data.responseCurves || data.responseCurves.length === 0) return [];
    return data.responseCurves.map((row) => {
      const item: Record<string, number | string> = {
        spendPct: `${row.spendPct}%`,
        totalSpend: row.totalSpend,
      };
      Object.entries(row.channels).forEach(([chName, cData]) => {
        item[`${chName} (Выручка)`] = cData.revenue;
        item[`${chName} (CAC)`] = cData.effectiveCac;
      });
      return item;
    });
  }, [data.responseCurves]);

  return (
    <div className="space-y-4">
      {/* Верхняя командная панель: вкладки и кнопка экспорта */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
        {/* Табы */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === "overview"
                ? "bg-white font-semibold text-slate-900 shadow-xs"
                : "hover:text-slate-900"
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-indigo-600" />
            <span>Медиаплан</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("scenarios")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === "scenarios"
                ? "bg-white font-semibold text-slate-900 shadow-xs"
                : "hover:text-slate-900"
            }`}
          >
            <Target className="h-3.5 w-3.5 text-purple-600" />
            <span>Сценарии (What-If)</span>
            <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-700">3</span>
          </button>

          {data.responseCurves && (
            <button
              type="button"
              onClick={() => setActiveTab("curves")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === "curves"
                  ? "bg-white font-semibold text-slate-900 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-cyan-600" />
              <span>Кривые отдачи</span>
            </button>
          )}

          {data.flightPlan && (
            <button
              type="button"
              onClick={() => setActiveTab("flightplan")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === "flightplan"
                  ? "bg-white font-semibold text-slate-900 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span>Понедельный план</span>
            </button>
          )}
        </div>

        {/* Кнопка экспорта в PDF */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-slate-900/10 transition hover:bg-slate-800 active:scale-95 disabled:opacity-60"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Формирование PDF...
            </>
          ) : (
            <>
              <FileDown className="h-3.5 w-3.5 text-indigo-400" />
              Скачать отчет (PDF)
            </>
          )}
        </button>
      </div>

      {/* Быстрый переключатель сценариев в шапке */}
      {scenarios && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Активная стратегия:</span>
            <span className="text-xs text-slate-500">
              {scenarios[selectedScenario]?.description}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedScenario("conservative")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedScenario === "conservative"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              Консервативный
            </button>

            <button
              type="button"
              onClick={() => setSelectedScenario("balanced")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedScenario === "balanced"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Target className="h-3 w-3" />
              Сбалансированный
            </button>

            <button
              type="button"
              onClick={() => setSelectedScenario("aggressive")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedScenario === "aggressive"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Zap className="h-3 w-3" />
              Агрессивный
            </button>
          </div>
        </div>
      )}

      {/* Контейнер отчета (рендерится в PDF) */}
      <div ref={reportRef} className="space-y-6 rounded-2xl bg-white p-4 sm:p-6 shadow-xs border border-slate-200/60">
        {/* Фирменный хедер отчета */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs">
              <LineChartIcon className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">AdForecast Media Mix Modeling Report</span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  {scenarios?.[selectedScenario]?.label ?? "Оптимум"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Предиктивное моделирование рекламного бюджета</p>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {/* 4 Ключевые метрики (Summary Cards) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Выручка</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {formatMoney(activeTotals.revenue, currency)}
            </p>
            <span className="text-xs text-slate-400">Прогнозируемая</span>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Продажи</span>
              <ShoppingCart className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {formatNumber(activeTotals.sales)}
            </p>
            <span className="text-xs text-slate-400">клиентов / сделок</span>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Ожидаемый ROI</span>
              <Percent className="h-4 w-4 text-amber-600" />
            </div>
            <p
              className={`mt-2 text-xl font-bold ${
                activeTotals.roi >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              +{activeTotals.roi.toFixed(1)}%
            </p>
            <span className="text-xs text-slate-400">Окупаемость вложений</span>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Чистая прибыль</span>
              <TrendingUp className="h-4 w-4 text-cyan-600" />
            </div>
            <p
              className={`mt-2 text-xl font-bold ${
                activeTotals.profit >= 0 ? "text-slate-900" : "text-rose-600"
              }`}
            >
              {formatMoney(activeTotals.profit, currency)}
            </p>
            <span className="text-xs text-slate-400">После вычета рекламы</span>
          </div>
        </div>

        {/* ───────── ВКЛАДКА 1: МЕДИАПЛАН И МЕТРИКИ ───────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Резюме ИИ и Риски */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-indigo-950">
                    Резюме модели оптимизации
                  </h4>
                  <p className="text-sm leading-relaxed text-indigo-900/90">{data.summary}</p>
                </div>
              </div>

              {data.risks && data.risks.length > 0 && (
                <div className="mt-3 border-t border-indigo-100 pt-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Возможные риски и ограничения:
                  </div>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-amber-900/80">
                    {data.risks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Графики */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Pie Chart: Распределение бюджета */}
              <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-sm font-semibold text-slate-800">
                  Распределение бюджета по каналам
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Оптимальные доли ({scenarios?.[selectedScenario]?.label ?? "Оптимум"})
                </p>
                <div className="h-64 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown, name: unknown, item: { payload?: { sharePct?: number } }) => [
                          `${formatMoney(Number(val) || 0, currency)} (${item.payload?.sharePct ?? 0}%)`,
                          String(name),
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Бюджет vs Выручка */}
              <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-sm font-semibold text-slate-800">
                  Сравнение: Вложения vs Выручка
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Ожидаемый финансовый эффект по источникам
                </p>
                <div className="h-64 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip
                        formatter={(value: unknown) => [
                          formatMoney(Number(value) || 0, currency),
                          "",
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="Бюджет" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Выручка" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Таблица детализации по каналам с метриками CAC и отдачи */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Детализация каналов</h4>
                  <p className="text-[11px] text-slate-400">Метрики с учетом эффекта убывающей отдачи</p>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  Всего каналов: {activeAllocations.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Канал</th>
                      <th className="px-4 py-3 text-right">Доля</th>
                      <th className="px-4 py-3 text-right">Бюджет</th>
                      <th className="px-4 py-3 text-right">Лиды</th>
                      <th className="px-4 py-3 text-right">Продажи</th>
                      <th className="px-4 py-3 text-right">Эфф. CAC</th>
                      <th className="px-4 py-3 text-right">Выручка</th>
                      <th className="px-4 py-3 text-right">Прибыль</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeAllocations.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span>{a.channel}</span>
                          </div>
                          <span className="block text-[11px] font-normal text-slate-400">
                            {a.reasoning}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                          {a.sharePct}%
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatMoney(a.budget, currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">{formatNumber(a.expectedLeads)}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                          {formatNumber(a.expectedSales)}
                        </td>
                        <td className="px-4 py-3 text-right text-indigo-700 font-medium">
                          {a.effectiveCac ? formatMoney(a.effectiveCac, currency) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-indigo-600 font-medium">
                          {formatMoney(a.expectedRevenue, currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                          {formatMoney(a.expectedProfit, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ───────── ВКЛАДКА 2: СЦЕНАРНЫЙ АНАЛИЗ (WHAT-IF) ───────── */}
        {activeTab === "scenarios" && scenarios && (
          <div className="space-y-6">
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4">
              <h4 className="text-sm font-bold text-purple-950">Сценарное моделирование (What-If Анализ)</h4>
              <p className="mt-1 text-xs text-purple-900/80 leading-relaxed">
                Сравните 3 различных стратегии расходования бюджета. Выберите ту, которая наилучшим образом отвечает
                текущим бизнес-целям компании: защита от риска, максимальная прибыль или агрессивный захват рынка.
              </p>
            </div>

            {/* Карточки 3 сценариев */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Консервативный */}
              <div
                onClick={() => setSelectedScenario("conservative")}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  selectedScenario === "conservative"
                    ? "border-emerald-500 bg-emerald-50/30 shadow-md ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Min Риск
                  </span>
                </div>
                <h5 className="mt-3 text-sm font-bold text-slate-900">Консервативный</h5>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {scenarios.conservative.description}
                </p>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Прогнозируемый ROI:</span>
                    <span className="font-bold text-emerald-600">+{scenarios.conservative.predictedRoi}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Чистая прибыль:</span>
                    <span className="font-bold text-slate-900">
                      {formatMoney(scenarios.conservative.expectedProfit, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Клиентов:</span>
                    <span className="font-semibold text-slate-800">{scenarios.conservative.expectedSales}</span>
                  </div>
                </div>
              </div>

              {/* Сбалансированный */}
              <div
                onClick={() => setSelectedScenario("balanced")}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  selectedScenario === "balanced"
                    ? "border-indigo-500 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                    <Target className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    ML-Оптимум
                  </span>
                </div>
                <h5 className="mt-3 text-sm font-bold text-slate-900">Сбалансированный</h5>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {scenarios.balanced.description}
                </p>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Прогнозируемый ROI:</span>
                    <span className="font-bold text-indigo-600">+{scenarios.balanced.predictedRoi}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Чистая прибыль:</span>
                    <span className="font-bold text-slate-900">
                      {formatMoney(scenarios.balanced.expectedProfit, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Клиентов:</span>
                    <span className="font-semibold text-slate-800">{scenarios.balanced.expectedSales}</span>
                  </div>
                </div>
              </div>

              {/* Агрессивный */}
              <div
                onClick={() => setSelectedScenario("aggressive")}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  selectedScenario === "aggressive"
                    ? "border-purple-500 bg-purple-50/30 shadow-md ring-2 ring-purple-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                    <Zap className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                    Scale / Рост
                  </span>
                </div>
                <h5 className="mt-3 text-sm font-bold text-slate-900">Агрессивный</h5>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {scenarios.aggressive.description}
                </p>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Прогнозируемый ROI:</span>
                    <span className="font-bold text-purple-600">+{scenarios.aggressive.predictedRoi}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Выручка:</span>
                    <span className="font-bold text-slate-900">
                      {formatMoney(scenarios.aggressive.expectedRevenue, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Клиентов:</span>
                    <span className="font-semibold text-purple-700 font-bold">{scenarios.aggressive.expectedSales}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Сравнительная таблица долей каналов в разных сценариях */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  Сравнение долей бюджета между стратегиями
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Канал трафика</th>
                      <th className="px-4 py-3 text-right">Консервативный</th>
                      <th className="px-4 py-3 text-right">Сбалансированный</th>
                      <th className="px-4 py-3 text-right">Агрессивный</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.allocations.map((a, i) => {
                      const consAlloc = scenarios.conservative.allocations.find((x) => x.channel === a.channel);
                      const balAlloc = scenarios.balanced.allocations.find((x) => x.channel === a.channel);
                      const aggAlloc = scenarios.aggressive.allocations.find((x) => x.channel === a.channel);

                      return (
                        <tr key={i} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-medium text-slate-900">{a.channel}</td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-700">
                            {consAlloc ? `${consAlloc.sharePct}% (${formatMoney(consAlloc.budget, currency)})` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-indigo-700">
                            {balAlloc ? `${balAlloc.sharePct}% (${formatMoney(balAlloc.budget, currency)})` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-purple-700">
                            {aggAlloc ? `${aggAlloc.sharePct}% (${formatMoney(aggAlloc.budget, currency)})` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ───────── ВКЛАДКА 3: КРИВЫЕ ОТДАЧИ (RESPONSE CURVES) ───────── */}
        {activeTab === "curves" && data.responseCurves && (
          <div className="space-y-6">
            <div className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-4">
              <h4 className="text-sm font-bold text-cyan-950">Кривые отдачи каналов (Diminishing Returns)</h4>
              <p className="mt-1 text-xs text-cyan-900/80 leading-relaxed">
                График наглядно демонстрирует закон убывающей отдачи: при масштабировании расходов выше определенного
                порога аудитория начинает выгорать, а стоимость привлечения клиента (CAC) возрастает.
              </p>
            </div>

            {/* График Response Curves */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h4 className="text-sm font-semibold text-slate-800">
                Рост прогнозируемой выручки по каналам от объема вложений
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Шкала от 15% до 150% базового бюджета
              </p>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curveChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="spendPct" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [formatMoney(Number(val) || 0, currency), ""]}
                    />
                    <Legend />
                    {data.allocations.map((a, i) => (
                      <Line
                        key={a.channel}
                        type="monotone"
                        dataKey={`${a.channel} (Выручка)`}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ───────── ВКЛАДКА 4: ПОНЕДЕЛЬНЫЙ ПЛАН (FLIGHT PLAN) ───────── */}
        {activeTab === "flightplan" && data.flightPlan && (
          <div className="space-y-6">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
              <h4 className="text-sm font-bold text-emerald-950">
                Календарный медиаплан кампании (Flight Plan)
              </h4>
              <p className="mt-1 text-xs text-emerald-900/80 leading-relaxed">
                Поэтапный график расходования бюджета с четкими целями и тактическими чек-листами для маркетологов.
                Позволяет избежать быстрого слива бюджета в первую же неделю.
              </p>
            </div>

            {/* Карточки 4 недель */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.flightPlan.map((week) => (
                <div
                  key={week.week}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                        {week.week}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900">{week.title}</h5>
                    </div>
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                      {week.sharePct}% ({formatMoney(week.budget, currency)})
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    Цель: <span className="text-slate-700">{week.goal}</span>
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Чек-лист маркетолога:
                    </span>
                    <ul className="space-y-1">
                      {week.actionItems.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
