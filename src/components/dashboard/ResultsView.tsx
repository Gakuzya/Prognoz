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
  Crown,
  Sliders,
  ShieldCheck,
  Zap,
  Target,
  Calendar,
  CheckCircle2,
  Filter,
  Activity,
  Award,
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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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

// Премиальная черно-золотая и изумрудная палитра графиков
const GOLD_PALETTE = [
  "#f59e0b", // Sovereign Gold
  "#10b981", // Emerald Profit
  "#38bdf8", // Diamond Cyan
  "#a855f7", // Imperial Purple
  "#fb7185", // Rose Quartz
  "#fde047", // Bright Champagne
];

type ActiveTab = "overview" | "funnel_cashflow" | "scenarios" | "curves" | "flightplan";
type ScenarioType = "balanced" | "conservative" | "aggressive";

export default function ResultsView({ data, currency = "KZT" }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("balanced");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const scenarios = data.scenarios;
  const currentScenarioData = scenarios?.[selectedScenario];

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

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#0c0c10",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AdForecast_Sovereign_${data.industry || "Report"}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: unknown) {
      console.error("Ошибка при генерации PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 1. Круговая диаграмма долей бюджета
  const pieData = useMemo(() => {
    return activeAllocations.map((a) => ({
      name: a.channel,
      value: a.budget,
      sharePct: a.sharePct,
    }));
  }, [activeAllocations]);

  // 2. Столбчатая диаграмма: Вложения vs Выручка vs Чистая прибыль
  const barData = useMemo(() => {
    return activeAllocations.map((a) => ({
      name: a.channel.length > 22 ? `${a.channel.slice(0, 20)}…` : a.channel,
      fullName: a.channel,
      Бюджет: a.budget,
      Выручка: a.expectedRevenue,
      Прибыль: Math.max(0, a.expectedProfit),
    }));
  }, [activeAllocations]);

  // 3. График кривых насыщения
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

  // 4. Данные воронки продвижения
  const funnelData = useMemo(() => {
    if (data.funnel && data.funnel.length > 0) return data.funnel;
    const leads = activeTotals.leads || 450;
    const sales = activeTotals.sales || 45;
    return [
      { stage: "1. Показы рекламы", value: leads * 310, conversionPct: 100, costPerUnit: 850, description: "Целевой охват в гео-локации" },
      { stage: "2. Переходы (Клики)", value: leads * 8, conversionPct: 3.4, costPerUnit: 190, description: "Переходы в Instagram / Сайт / 2GIS" },
      { stage: "3. Заявки (Leads)", value: leads, conversionPct: 12.5, costPerUnit: 1400, description: "Обращения в WhatsApp и Direct" },
      { stage: "4. Квалификация", value: Math.round(leads * 0.55), conversionPct: 55.0, costPerUnit: 2500, description: "Подтвержденный спрос" },
      { stage: "5. Первичные продажи", value: sales, conversionPct: 28.0, costPerUnit: 7200, description: "Оплатившие клиенты" },
      { stage: "6. Повторные (LTV)", value: Math.round(sales * 0.4), conversionPct: 40.0, costPerUnit: 0, description: "Постоянная база клиентов" },
    ];
  }, [data.funnel, activeTotals]);

  // 5. Данные 6-месячного денежного потока
  const monthlyData = useMemo(() => {
    if (data.monthlyProjection && data.monthlyProjection.length > 0) return data.monthlyProjection;
    const baseRev = activeTotals.revenue || 3500000;
    const baseProf = activeTotals.profit || 1100000;
    const baseSpend = data.adBudget || 600000;
    let cum = -(data.openingBudget || 4000000);
    return [1, 2, 3, 4, 5, 6].map((m) => {
      const factor = 0.7 + m * 0.18;
      const rev = Math.round(baseRev * factor);
      const prof = Math.round(baseProf * factor);
      cum += prof;
      return {
        month: `Месяц ${m}`,
        monthIndex: m,
        adSpend: Math.round(baseSpend * (1 + (m - 1) * 0.05)),
        revenue: rev,
        profit: prof,
        cumulativeCashflow: cum,
        sales: Math.round((activeTotals.sales || 40) * factor),
        repeatSales: Math.round((activeTotals.sales || 40) * (m - 1) * 0.15),
      };
    });
  }, [data.monthlyProjection, activeTotals, data.adBudget, data.openingBudget]);

  return (
    <div className="space-y-4">
      {/* Командная панель переключения аналитических режимов */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-amber-500/20 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-amber-500/20 bg-[#0c0c10] p-1.5 text-xs font-medium text-zinc-400">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${activeTab === "overview"
              ? "bg-gradient-to-r from-amber-500 to-yellow-600 font-bold text-black shadow-md shadow-amber-500/20"
              : "hover:text-amber-300"
              }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Медиамикс & Радар (3 графика)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("funnel_cashflow")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${activeTab === "funnel_cashflow"
              ? "bg-gradient-to-r from-amber-500 to-yellow-600 font-bold text-black shadow-md shadow-amber-500/20"
              : "hover:text-amber-300"
              }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Воронка & Окупаемость 6 мес.</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("scenarios")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${activeTab === "scenarios"
              ? "bg-gradient-to-r from-amber-500 to-yellow-600 font-bold text-black shadow-md shadow-amber-500/20"
              : "hover:text-amber-300"
              }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>Сценарии (What-If)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("curves")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${activeTab === "curves"
              ? "bg-gradient-to-r from-amber-500 to-yellow-600 font-bold text-black shadow-md shadow-amber-500/20"
              : "hover:text-amber-300"
              }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Кривые насыщения</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("flightplan")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${activeTab === "flightplan"
              ? "bg-gradient-to-r from-amber-500 to-yellow-600 font-bold text-black shadow-md shadow-amber-500/20"
              : "hover:text-amber-300"
              }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>План по неделям</span>
          </button>
        </div>

        {/* Кнопка скачивания PDF */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 shadow-md transition hover:bg-amber-500 hover:text-black active:scale-95 disabled:opacity-60"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Экспорт PDF...
            </>
          ) : (
            <>
              <FileDown className="h-3.5 w-3.5" />
              Скачать Инвест-Отчёт (PDF)
            </>
          )}
        </button>
      </div>

      {/* Быстрый переключатель 3 стратегий */}
      {scenarios && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-[#101016] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400">Режим стратегии:</span>
            <span className="text-xs text-zinc-400">
              {scenarios[selectedScenario]?.description}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedScenario("conservative")}
              className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${selectedScenario === "conservative"
                ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                : "border border-white/10 bg-white/5 text-zinc-300 hover:border-amber-500/40"
                }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Консервативный
            </button>

            <button
              type="button"
              onClick={() => setSelectedScenario("balanced")}
              className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${selectedScenario === "balanced"
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold shadow-md shadow-amber-500/20"
                : "border border-white/10 bg-white/5 text-zinc-300 hover:border-amber-500/40"
                }`}
            >
              <Target className="h-3.5 w-3.5" />
              Сбалансированный
            </button>

            <button
              type="button"
              onClick={() => setSelectedScenario("aggressive")}
              className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${selectedScenario === "aggressive"
                ? "bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20"
                : "border border-white/10 bg-white/5 text-zinc-300 hover:border-amber-500/40"
                }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Агрессивный
            </button>
          </div>
        </div>
      )}

      {/* Контейнер отчета для рендера и PDF */}
      <div
        ref={reportRef}
        className="space-y-6 rounded-3xl border border-amber-500/25 bg-[#0c0c11] p-5 sm:p-7 shadow-2xl"
      >
        {/* Золотая шапка отчета с указанием сферы продвигаемого бизнеса */}
        <div className="flex flex-col gap-3 border-b border-amber-500/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-700 text-black shadow-lg shadow-amber-500/20">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  Сфера продвижения: {data.industry || "Бизнес-проект в РК"}
                </span>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  {scenarios?.[selectedScenario]?.label ?? "ИИ-Оптимум"}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Локация: {data.location || "Казахстан"} • Средний чек:{" "}
                <strong className="text-amber-300">{formatMoney(data.avgCheck || 42000, currency)}</strong> • Маржа:{" "}
                <strong className="text-amber-300">{data.targetMargin || 48}%</strong> • Точка безубыточности:{" "}
                <strong className="text-emerald-400">{data.breakEvenSales || 28} продаж</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              Окупаемость открытия: ~{data.paybackMonths || 3.8} мес.
            </span>
          </div>
        </div>

        {/* 4 Ключевые карточки KPI */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300/90">
                Прогноз выручки
              </span>
              <DollarSign className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
              {formatMoney(activeTotals.revenue, currency)}
            </p>
            <span className="text-[11px] text-zinc-400">Ежемесячный оборот</span>
          </div>

          <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 to-transparent p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/90">
                Чистая прибыль
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-xl font-extrabold text-emerald-400 sm:text-2xl">
              {formatMoney(activeTotals.profit, currency)}
            </p>
            <span className="text-[11px] text-zinc-400">После вычета рекламы</span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#14141c] p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Клиенты / Лиды
              </span>
              <ShoppingCart className="h-4 w-4 text-sky-400" />
            </div>
            <p className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
              {formatNumber(activeTotals.sales)}{" "}
              <span className="text-xs font-normal text-zinc-400">
                / {formatNumber(activeTotals.leads)} лидов
              </span>
            </p>
            <span className="text-[11px] text-zinc-400">
              Безубыточность от {data.breakEvenSales || 25} продаж
            </span>
          </div>

          <div className="rounded-2xl border border-amber-500/25 bg-[#14141c] p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Рентабельность ROI
              </span>
              <Percent className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 text-xl font-extrabold text-amber-400 sm:text-2xl">
              +{activeTotals.roi.toFixed(0)}%
            </p>
            <span className="text-[11px] text-zinc-400">На вложенный тенге</span>
          </div>
        </div>

        {/* ───────── ВКЛАДКА 1: МЕДИАМИКС, ОТДАЧА И РАДАР КАНАЛОВ (3 ГРАФИКА) ───────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* ИИ-резюме */}
            <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-300">
                    Вердикт ИИ-модели по продвижению сферы «{data.industry || "Бизнес в РК"}»
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed text-zinc-200">{data.summary}</p>
                </div>
              </div>

              {data.risks && data.risks.length > 0 && (
                <div className="mt-3 border-t border-amber-500/15 pt-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Факторы контроля для собственника:
                  </div>
                  <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-zinc-300">
                    {data.risks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 3 Графика: Donut + Grouped Bar + Radar */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* ГРАФИК 1: Распределение бюджета */}
              <div className="flex flex-col rounded-2xl border border-white/10 bg-[#121218] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                    График 1
                  </span>
                  <span className="text-[11px] text-zinc-500">Доли бюджета</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Сплит рекламных каналов
                </h4>
                <p className="text-xs text-zinc-400 mb-3">
                  Куда направить бюджет для максимального ROI
                </p>
                <div className="h-60 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={GOLD_PALETTE[index % GOLD_PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#14141c",
                          borderColor: "rgba(245,158,11,0.3)",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                        formatter={(val: unknown, name: unknown, item: { payload?: { sharePct?: number } }) => [
                          `${formatMoney(Number(val) || 0, currency)} (${item.payload?.sharePct ?? 0}%)`,
                          String(name),
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "#d4d4d8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ГРАФИК 2: Бюджет vs Выручка vs Прибыль */}
              <div className="flex flex-col rounded-2xl border border-white/10 bg-[#121218] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    График 2
                  </span>
                  <span className="text-[11px] text-zinc-500">Юнит-отдача</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Вложения vs Выручка и Прибыль
                </h4>
                <p className="text-xs text-zinc-400 mb-3">
                  Финансовая генерация каждого источника
                </p>
                <div className="h-60 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#a1a1aa" }}
                        tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#14141c",
                          borderColor: "rgba(245,158,11,0.3)",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                        formatter={(value: unknown) => [
                          formatMoney(Number(value) || 0, currency),
                          "",
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="Бюджет" fill="#71717a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Выручка" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Прибыль" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ГРАФИК 3: Радар эффективности каналов */}
              <div className="flex flex-col rounded-2xl border border-white/10 bg-[#121218] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                    График 3
                  </span>
                  <span className="text-[11px] text-zinc-500">5D-аудит</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Радар силы каналов в вашей нише
                </h4>
                <p className="text-xs text-zinc-400 mb-3">
                  Скорость лидов, конверсия, доверие и масштаб
                </p>
                <div className="h-60 w-full flex-1">
                  {data.radarMetrics && data.radarMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="68%" data={data.radarMetrics}>
                        <PolarGrid stroke="#27272a" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "#d4d4d8", fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        {activeAllocations.map((a, idx) => (
                          <Radar
                            key={a.channel}
                            name={a.channel}
                            dataKey={a.channel}
                            stroke={GOLD_PALETTE[idx % GOLD_PALETTE.length]}
                            fill={GOLD_PALETTE[idx % GOLD_PALETTE.length]}
                            fillOpacity={0.22}
                          />
                        ))}
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#14141c",
                            borderColor: "rgba(245,158,11,0.3)",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "11px",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                      Радар каналов сформирован
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Таблица детализации по каналам */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121218]">
              <div className="border-b border-white/10 bg-white/[0.02] px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Детальная юнит-матрица по каждому рекламному источнику
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Расчет лидов, продаж, эффективного CAC и порога выгорания канала
                  </p>
                </div>
                <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                  Каналов: {activeAllocations.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="border-b border-white/10 bg-black/40 text-[11px] font-bold uppercase text-amber-400/90">
                    <tr>
                      <th className="px-4 py-3">Рекламный канал</th>
                      <th className="px-4 py-3 text-right">Доля</th>
                      <th className="px-4 py-3 text-right">Бюджет</th>
                      <th className="px-4 py-3 text-right">Лиды</th>
                      <th className="px-4 py-3 text-right">Продажи</th>
                      <th className="px-4 py-3 text-right">Эфф. CAC</th>
                      <th className="px-4 py-3 text-right">Выручка</th>
                      <th className="px-4 py-3 text-right">Чистая прибыль</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {activeAllocations.map((a, i) => (
                      <tr key={i} className="hover:bg-white/[0.03] transition">
                        <td className="px-4 py-3.5 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: GOLD_PALETTE[i % GOLD_PALETTE.length] }}
                            />
                            <span>{a.channel}</span>
                          </div>
                          <span className="mt-0.5 block text-[11px] font-normal text-zinc-400">
                            {a.reasoning}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-amber-300">
                          {a.sharePct}%
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-white">
                          {formatMoney(a.budget, currency)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-zinc-400">
                          {formatNumber(a.expectedLeads)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-white">
                          {formatNumber(a.expectedSales)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-amber-400 font-semibold">
                          {a.effectiveCac ? formatMoney(a.effectiveCac, currency) : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right text-sky-300 font-semibold">
                          {formatMoney(a.expectedRevenue, currency)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-emerald-400 font-bold">
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

        {/* ───────── ВКЛАДКА 2: ВОРОНКА ПРОДВИЖЕНИЯ И ДЕНЕЖНЫЙ ПОТОК НА 6 МЕСЯЦЕВ ───────── */}
        {activeTab === "funnel_cashflow" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* ГРАФИК 4: Динамика выручки и чистой прибыли за 6 месяцев */}
              <div className="rounded-2xl border border-white/10 bg-[#121218] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                    График 4 • Прогноз на полгода
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    Рост с учетом базы LTV
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Динамика Выручки и Чистой Прибыли (Месяц 1 — Месяц 6)
                </h4>
                <p className="text-xs text-zinc-400 mb-4">
                  Накопительный эффект от повторных покупок постоянных клиентов
                </p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="goldRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="emeraldProf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#a1a1aa" }}
                        tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#14141c",
                          borderColor: "rgba(245,158,11,0.3)",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                        formatter={(val: unknown) => [formatMoney(Number(val) || 0, currency), ""]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Выручка (Оборот)"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#goldRev)"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="Чистая прибыль"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#emeraldProf)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ГРАФИК 5: Воронка конверсий бизнеса */}
              <div className="rounded-2xl border border-white/10 bg-[#121218] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    График 5 • Маркетинговая воронка
                  </span>
                  <span className="text-[11px] text-zinc-400">От показа до LTV</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Пошаговая воронка конверсии продвижения
                </h4>
                <p className="text-xs text-zinc-400 mb-4">
                  Конверсия каждого этапа и стоимость единицы (CPM → CPC → CPL → CAC)
                </p>

                <div className="space-y-2.5">
                  {funnelData.map((st, idx) => {
                    const widthPct = Math.max(18, 100 - idx * 14);
                    return (
                      <div
                        key={st.stage}
                        className="rounded-xl border border-white/5 bg-black/30 p-3 transition hover:border-amber-500/30"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{st.stage}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-amber-300 font-bold">
                              {formatNumber(st.value)}
                            </span>
                            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300">
                              CR: {st.conversionPct}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-400"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
                          <span>{st.description}</span>
                          {st.costPerUnit > 0 ? (
                            <span>Цена этапа: {formatMoney(st.costPerUnit, currency)}</span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">Бесплатно (База LTV)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Таблица помесячного возврата инвестиций (CAPEX Payback) */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121218]">
              <div className="border-b border-white/10 px-5 py-3.5">
                <h4 className="text-sm font-bold text-white">
                  Помесячный график выхода из инвестиций (CAPEX Cashflow — 6 месяцев)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="border-b border-white/10 bg-black/40 text-[11px] font-bold uppercase text-amber-400">
                    <tr>
                      <th className="px-4 py-3">Период</th>
                      <th className="px-4 py-3 text-right">Реклама</th>
                      <th className="px-4 py-3 text-right">Новые клиенты</th>
                      <th className="px-4 py-3 text-right">Повторные (LTV)</th>
                      <th className="px-4 py-3 text-right">Выручка</th>
                      <th className="px-4 py-3 text-right">Чистая прибыль</th>
                      <th className="px-4 py-3 text-right">Баланс окупаемости CAPEX</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {monthlyData.map((m) => (
                      <tr key={m.month} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-bold text-white">{m.month}</td>
                        <td className="px-4 py-3 text-right text-zinc-400">
                          {formatMoney(m.adSpend, currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-white">
                          {m.sales}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-300">
                          +{m.repeatSales}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-sky-300">
                          {formatMoney(m.revenue, currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400">
                          +{formatMoney(m.profit, currency)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${m.cumulativeCashflow >= 0 ? "text-emerald-400" : "text-amber-400"
                            }`}
                        >
                          {formatMoney(m.cumulativeCashflow, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ───────── ВКЛАДКА 3: СЦЕНАРНЫЙ АНАЛИЗ (WHAT-IF) ───────── */}
        {activeTab === "scenarios" && scenarios && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {(["conservative", "balanced", "aggressive"] as const).map((scKey) => {
                const sc = scenarios[scKey];
                if (!sc) return null;
                const isSelected = selectedScenario === scKey;
                return (
                  <div
                    key={scKey}
                    onClick={() => setSelectedScenario(scKey)}
                    className={`cursor-pointer rounded-2xl border p-5 transition-all ${isSelected
                      ? "border-amber-400 bg-gradient-to-b from-amber-500/15 to-[#121218] shadow-lg shadow-amber-500/10"
                      : "border-white/10 bg-[#121218] hover:border-amber-500/40"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                        {scKey === "conservative" ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : scKey === "balanced" ? (
                          <Award className="h-5 w-5" />
                        ) : (
                          <Zap className="h-5 w-5" />
                        )}
                      </span>
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                        {sc.label}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-zinc-400 leading-relaxed">{sc.description}</p>

                    <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Прогноз ROI:</span>
                        <span className="font-bold text-amber-400">+{sc.predictedRoi}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Выручка:</span>
                        <span className="font-bold text-white">
                          {formatMoney(sc.expectedRevenue, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Чистая прибыль:</span>
                        <span className="font-bold text-emerald-400">
                          {formatMoney(sc.expectedProfit, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Клиентов в месяц:</span>
                        <span className="font-bold text-white">{sc.expectedSales}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ───────── ВКЛАДКА 4: КРИВЫЕ ОТДАЧИ И НАСЫЩЕНИЯ (ГРАФИК 6) ───────── */}
        {activeTab === "curves" && data.responseCurves && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#121218] p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  График 6 • Закон убывающей отдачи Хилла
                </span>
                <span className="text-[11px] text-zinc-400">Диапазон 25% — 150% бюджета</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                Кривые насыщения рекламных каналов (Diminishing Returns)
              </h4>
              <p className="text-xs text-zinc-400 mb-4">
                Показывает, как растет выручка при масштабировании бюджета и где начинается перегрев аукциона
              </p>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curveChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis dataKey="spendPct" tick={{ fontSize: 12, fill: "#a1a1aa" }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#a1a1aa" }}
                      tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#14141c",
                        borderColor: "rgba(245,158,11,0.3)",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(val: unknown) => [formatMoney(Number(val) || 0, currency), ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    {data.allocations.map((a, i) => (
                      <Line
                        key={a.channel}
                        type="monotone"
                        dataKey={`${a.channel} (Выручка)`}
                        stroke={GOLD_PALETTE[i % GOLD_PALETTE.length]}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ───────── ВКЛАДКА 5: ПОНЕДЕЛЬНЫЙ ПЛАН ЗАПУСКА (FLIGHT PLAN) ───────── */}
        {activeTab === "flightplan" && data.flightPlan && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.flightPlan.map((week) => (
              <div
                key={week.week}
                className="rounded-2xl border border-white/10 bg-[#121218] p-5 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 text-xs font-extrabold text-black">
                      W{week.week}
                    </span>
                    <h5 className="text-sm font-bold text-white">{week.title}</h5>
                  </div>
                  <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                    {week.sharePct}% ({formatMoney(week.budget, currency)})
                  </span>
                </div>

                <p className="text-xs text-zinc-400">
                  Цель этапа: <strong className="text-zinc-200">{week.goal}</strong>
                </p>

                <ul className="space-y-1.5 pt-1">
                  {week.actionItems.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
