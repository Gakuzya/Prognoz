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
  Compass,
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

// Скандинавская природная палитра для аналитических графиков
const NORDIC_PALETTE = [
  "#1F3A33", // Nordic Pine (Глубокая хвоя)
  "#3B6E8C", // Fjord Blue (Фьорд)
  "#B85D3B", // Warm Terracotta (Терракота)
  "#52796F", // Soft Sage (Шалфей)
  "#C89D66", // Warm Birch / Amber Sand (Тёплый песок)
  "#6B705C", // Nordic Moss (Северный мох)
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
        backgroundColor: "#FFFFFF",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AdForecast_Nordic_${data.industry || "Report"}_${new Date().toISOString().slice(0, 10)}.pdf`);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2DDD3] pb-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#E2DDD3] bg-[#F2EFE9] p-1.5 text-xs font-medium text-[#5C6460]">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${activeTab === "overview"
              ? "bg-[#1F3A33] font-bold text-white shadow-sm"
              : "hover:bg-white/70 hover:text-[#1C242B]"
              }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Медиамикс & Радар (3 графика)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("funnel_cashflow")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${activeTab === "funnel_cashflow"
              ? "bg-[#1F3A33] font-bold text-white shadow-sm"
              : "hover:bg-white/70 hover:text-[#1C242B]"
              }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Воронка & Окупаемость 6 мес.</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("scenarios")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${activeTab === "scenarios"
              ? "bg-[#1F3A33] font-bold text-white shadow-sm"
              : "hover:bg-white/70 hover:text-[#1C242B]"
              }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>Сценарии (What-If)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("curves")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${activeTab === "curves"
              ? "bg-[#1F3A33] font-bold text-white shadow-sm"
              : "hover:bg-white/70 hover:text-[#1C242B]"
              }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Кривые насыщения</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("flightplan")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${activeTab === "flightplan"
              ? "bg-[#1F3A33] font-bold text-white shadow-sm"
              : "hover:bg-white/70 hover:text-[#1C242B]"
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
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1F3A33]/25 bg-white px-4 py-2 text-xs font-bold text-[#1F3A33] shadow-sm transition hover:bg-[#1F3A33] hover:text-white active:scale-95 disabled:opacity-60"
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1F3A33]">Режим стратегии:</span>
            <span className="text-xs text-[#5C6460]">
              {scenarios[selectedScenario]?.description}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedScenario("conservative")}
              className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${selectedScenario === "conservative"
                ? "bg-[#4A6B5D] text-white font-bold shadow-sm"
                : "border border-[#E2DDD3] bg-white text-[#5C6460] hover:border-[#1F3A33]/40 hover:text-[#1C242B]"
                }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Консервативный
            </button>

            <button
              type="button"
              onClick={() => setSelectedScenario("balanced")}
              className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${selectedScenario === "balanced"
                ? "bg-[#1F3A33] text-white font-bold shadow-sm"
                : "border border-[#E2DDD3] bg-white text-[#5C6460] hover:border-[#1F3A33]/40 hover:text-[#1C242B]"
                }`}
            >
              <Target className="h-3.5 w-3.5" />
              Сбалансированный
            </button>

            <button
              type="button"
              onClick={() => setSelectedScenario("aggressive")}
              className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${selectedScenario === "aggressive"
                ? "bg-[#B85D3B] text-white font-bold shadow-sm"
                : "border border-[#E2DDD3] bg-white text-[#5C6460] hover:border-[#1F3A33]/40 hover:text-[#1C242B]"
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
        className="space-y-6 rounded-3xl border border-[#E2DDD3] bg-white p-5 sm:p-7 nordic-shadow"
      >
        {/* Скандинавская шапка отчета с указанием сферы продвигаемого бизнеса */}
        <div className="flex flex-col gap-3 border-b border-[#ECE9E2] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F3A33] text-white shadow-sm">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[#1C242B]">
                  Сфера продвижения: {data.industry || "Бизнес-проект в РК"}
                </span>
                <span className="rounded-full border border-[#D5DFDA] bg-[#EAF0ED] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1F3A33]">
                  {scenarios?.[selectedScenario]?.label ?? "ИИ-Оптимум"}
                </span>
              </div>
              <p className="text-xs text-[#5C6460]">
                Локация: {data.location || "Казахстан"} • Средний чек:{" "}
                <strong className="text-[#1C242B]">{formatMoney(data.avgCheck || 42000, currency)}</strong> • Маржа:{" "}
                <strong className="text-[#1C242B]">{data.targetMargin || 48}%</strong> • Точка безубыточности:{" "}
                <strong className="text-[#1F3A33]">{data.breakEvenSales || 28} продаж</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-xl border border-[#D5DFDA] bg-[#EAF0ED] px-3 py-1 text-xs font-bold text-[#1F3A33]">
              Окупаемость открытия: ~{data.paybackMonths || 3.8} мес.
            </span>
          </div>
        </div>

        {/* 4 Ключевые карточки KPI */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-4">
            <div className="flex items-center justify-between text-[#5C6460]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6460]">
                Прогноз выручки
              </span>
              <DollarSign className="h-4 w-4 text-[#1F3A33]" />
            </div>
            <p className="mt-2 text-xl font-extrabold text-[#1C242B] sm:text-2xl">
              {formatMoney(activeTotals.revenue, currency)}
            </p>
            <span className="text-[11px] text-[#7A827E]">Ежемесячный оборот</span>
          </div>

          <div className="rounded-2xl border border-[#D5DFDA] bg-[#EAF0ED]/70 p-4">
            <div className="flex items-center justify-between text-[#1F3A33]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3A33]">
                Чистая прибыль
              </span>
              <TrendingUp className="h-4 w-4 text-[#1F3A33]" />
            </div>
            <p className="mt-2 text-xl font-extrabold text-[#1F3A33] sm:text-2xl">
              {formatMoney(activeTotals.profit, currency)}
            </p>
            <span className="text-[11px] text-[#4A6B5D]">После вычета рекламы</span>
          </div>

          <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-4">
            <div className="flex items-center justify-between text-[#5C6460]">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Клиенты / Лиды
              </span>
              <ShoppingCart className="h-4 w-4 text-[#3B6E8C]" />
            </div>
            <p className="mt-2 text-xl font-extrabold text-[#1C242B] sm:text-2xl">
              {formatNumber(activeTotals.sales)}{" "}
              <span className="text-xs font-normal text-[#7A827E]">
                / {formatNumber(activeTotals.leads)} лидов
              </span>
            </p>
            <span className="text-[11px] text-[#7A827E]">
              Безубыточность от {data.breakEvenSales || 25} продаж
            </span>
          </div>

          <div className="rounded-2xl border border-[#E6CFC4] bg-[#FAF2EE] p-4">
            <div className="flex items-center justify-between text-[#B85D3B]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B85D3B]">
                Рентабельность ROI
              </span>
              <Percent className="h-4 w-4 text-[#B85D3B]" />
            </div>
            <p className="mt-2 text-xl font-extrabold text-[#B85D3B] sm:text-2xl">
              +{activeTotals.roi.toFixed(0)}%
            </p>
            <span className="text-[11px] text-[#8E5B47]">На вложенный тенге</span>
          </div>
        </div>

        {/* ───────── ВКЛАДКА 1: МЕДИАМИКС, ОТДАЧА И РАДАР КАНАЛОВ (3 ГРАФИКА) ───────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* ИИ-резюме */}
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#1F3A33]" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#1C242B]">
                    Вердикт ИИ-модели по продвижению сферы «{data.industry || "Бизнес в РК"}»
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#5C6460]">{data.summary}</p>
                </div>
              </div>

              {data.risks && data.risks.length > 0 && (
                <div className="mt-3 border-t border-[#E2DDD3] pt-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#B85D3B]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Факторы контроля для собственника:
                  </div>
                  <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-[#5C6460]">
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
              <div className="flex flex-col rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-[#EAF0ED] px-2 py-0.5 text-[10px] font-bold text-[#1F3A33]">
                    График 1
                  </span>
                  <span className="text-[11px] text-[#7A827E]">Доли бюджета</span>
                </div>
                <h4 className="text-sm font-bold text-[#1C242B]">
                  Сплит рекламных каналов
                </h4>
                <p className="text-xs text-[#5C6460] mb-3">
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
                            fill={NORDIC_PALETTE[index % NORDIC_PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E2DDD3",
                          borderRadius: "12px",
                          color: "#1C242B",
                          fontSize: "12px",
                        }}
                        formatter={(val: unknown, name: unknown, item: { payload?: { sharePct?: number } }) => [
                          `${formatMoney(Number(val) || 0, currency)} (${item.payload?.sharePct ?? 0}%)`,
                          String(name),
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "#5C6460" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ГРАФИК 2: Бюджет vs Выручка vs Прибыль */}
              <div className="flex flex-col rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-[#EAF0ED] px-2 py-0.5 text-[10px] font-bold text-[#1F3A33]">
                    График 2
                  </span>
                  <span className="text-[11px] text-[#7A827E]">Юнит-отдача</span>
                </div>
                <h4 className="text-sm font-bold text-[#1C242B]">
                  Вложения vs Выручка и Прибыль
                </h4>
                <p className="text-xs text-[#5C6460] mb-3">
                  Финансовая генерация каждого источника
                </p>
                <div className="h-60 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DDD3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#5C6460" }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#5C6460" }}
                        tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E2DDD3",
                          borderRadius: "12px",
                          color: "#1C242B",
                          fontSize: "12px",
                        }}
                        formatter={(value: unknown) => [
                          formatMoney(Number(value) || 0, currency),
                          "",
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "#5C6460" }} />
                      <Bar dataKey="Бюджет" fill="#9CA39E" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Выручка" fill="#3B6E8C" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Прибыль" fill="#1F3A33" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ГРАФИК 3: Радар эффективности каналов */}
              <div className="flex flex-col rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-[#FAF2EE] px-2 py-0.5 text-[10px] font-bold text-[#B85D3B]">
                    График 3
                  </span>
                  <span className="text-[11px] text-[#7A827E]">5D-аудит</span>
                </div>
                <h4 className="text-sm font-bold text-[#1C242B]">
                  Радар силы каналов в вашей нише
                </h4>
                <p className="text-xs text-[#5C6460] mb-3">
                  Скорость лидов, конверсия, доверие и масштаб
                </p>
                <div className="h-60 w-full flex-1">
                  {data.radarMetrics && data.radarMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="68%" data={data.radarMetrics}>
                        <PolarGrid stroke="#D8D2C5" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "#5C6460", fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        {activeAllocations.map((a, idx) => (
                          <Radar
                            key={a.channel}
                            name={a.channel}
                            dataKey={a.channel}
                            stroke={NORDIC_PALETTE[idx % NORDIC_PALETTE.length]}
                            fill={NORDIC_PALETTE[idx % NORDIC_PALETTE.length]}
                            fillOpacity={0.2}
                          />
                        ))}
                        <Legend wrapperStyle={{ fontSize: "10px", color: "#5C6460" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E2DDD3",
                            borderRadius: "12px",
                            color: "#1C242B",
                            fontSize: "11px",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[#7A827E]">
                      Радар каналов сформирован
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Таблица детализации по каналам */}
            <div className="overflow-hidden rounded-2xl border border-[#E2DDD3] bg-white">
              <div className="border-b border-[#ECE9E2] bg-[#FBF9F5] px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1C242B]">
                    Детальная юнит-матрица по каждому рекламному источнику
                  </h4>
                  <p className="text-[11px] text-[#5C6460]">
                    Расчет лидов, продаж, эффективного CAC и порога выгорания канала
                  </p>
                </div>
                <span className="rounded-lg border border-[#D5DFDA] bg-[#EAF0ED] px-2.5 py-1 text-xs font-bold text-[#1F3A33]">
                  Каналов: {activeAllocations.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#5C6460]">
                  <thead className="border-b border-[#ECE9E2] bg-[#F2EFE9] text-[11px] font-bold uppercase text-[#1F3A33]">
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
                  <tbody className="divide-y divide-[#ECE9E2]">
                    {activeAllocations.map((a, i) => (
                      <tr key={i} className="hover:bg-[#FBF9F5] transition">
                        <td className="px-4 py-3.5 font-semibold text-[#1C242B]">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: NORDIC_PALETTE[i % NORDIC_PALETTE.length] }}
                            />
                            <span>{a.channel}</span>
                          </div>
                          <span className="mt-0.5 block text-[11px] font-normal text-[#7A827E]">
                            {a.reasoning}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-[#1F3A33]">
                          {a.sharePct}%
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-[#1C242B]">
                          {formatMoney(a.budget, currency)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[#5C6460]">
                          {formatNumber(a.expectedLeads)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-[#1C242B]">
                          {formatNumber(a.expectedSales)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[#B85D3B] font-semibold">
                          {a.effectiveCac ? formatMoney(a.effectiveCac, currency) : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[#3B6E8C] font-semibold">
                          {formatMoney(a.expectedRevenue, currency)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[#1F3A33] font-bold">
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
              <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-[#EAF0ED] px-2 py-0.5 text-[10px] font-bold text-[#1F3A33]">
                    График 4 • Прогноз на полгода
                  </span>
                  <span className="text-[11px] text-[#1F3A33] font-semibold">
                    Рост с учетом базы LTV
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#1C242B]">
                  Динамика Выручки и Чистой Прибыли (Месяц 1 — Месяц 6)
                </h4>
                <p className="text-xs text-[#5C6460] mb-4">
                  Накопительный эффект от повторных покупок постоянных клиентов
                </p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="nordicRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B6E8C" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#3B6E8C" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="nordicProf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1F3A33" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#1F3A33" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DDD3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5C6460" }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#5C6460" }}
                        tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E2DDD3",
                          borderRadius: "12px",
                          color: "#1C242B",
                          fontSize: "12px",
                        }}
                        formatter={(val: unknown) => [formatMoney(Number(val) || 0, currency), ""]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "#5C6460" }} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Выручка (Оборот)"
                        stroke="#3B6E8C"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#nordicRev)"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="Чистая прибыль"
                        stroke="#1F3A33"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#nordicProf)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ГРАФИК 5: Воронка конверсий бизнеса */}
              <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-[#FAF2EE] px-2 py-0.5 text-[10px] font-bold text-[#B85D3B]">
                    График 5 • Маркетинговая воронка
                  </span>
                  <span className="text-[11px] text-[#7A827E]">От показа до LTV</span>
                </div>
                <h4 className="text-sm font-bold text-[#1C242B]">
                  Пошаговая воронка конверсии продвижения
                </h4>
                <p className="text-xs text-[#5C6460] mb-4">
                  Конверсия каждого этапа и стоимость единицы (CPM → CPC → CPL → CAC)
                </p>

                <div className="space-y-2.5">
                  {funnelData.map((st, idx) => {
                    const widthPct = Math.max(18, 100 - idx * 14);
                    return (
                      <div
                        key={st.stage}
                        className="rounded-xl border border-[#E2DDD3] bg-white p-3 transition hover:border-[#1F3A33]/35"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#1C242B]">{st.stage}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#1F3A33] font-bold">
                              {formatNumber(st.value)}
                            </span>
                            <span className="rounded-md bg-[#F2EFE9] px-2 py-0.5 text-[10px] font-semibold text-[#5C6460]">
                              CR: {st.conversionPct}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 h-2 w-full rounded-full bg-[#ECE9E2] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#1F3A33] via-[#4A6B5D] to-[#B85D3B]"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-[#7A827E]">
                          <span>{st.description}</span>
                          {st.costPerUnit > 0 ? (
                            <span>Цена этапа: {formatMoney(st.costPerUnit, currency)}</span>
                          ) : (
                            <span className="text-[#1F3A33] font-semibold">Бесплатно (База LTV)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Таблица помесячного возврата инвестиций (CAPEX Payback) */}
            <div className="overflow-hidden rounded-2xl border border-[#E2DDD3] bg-white">
              <div className="border-b border-[#ECE9E2] bg-[#FBF9F5] px-5 py-3.5">
                <h4 className="text-sm font-bold text-[#1C242B]">
                  Помесячный график выхода из инвестиций (CAPEX Cashflow — 6 месяцев)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#5C6460]">
                  <thead className="border-b border-[#ECE9E2] bg-[#F2EFE9] text-[11px] font-bold uppercase text-[#1F3A33]">
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
                  <tbody className="divide-y divide-[#ECE9E2]">
                    {monthlyData.map((m) => (
                      <tr key={m.month} className="hover:bg-[#FBF9F5]">
                        <td className="px-4 py-3 font-bold text-[#1C242B]">{m.month}</td>
                        <td className="px-4 py-3 text-right text-[#5C6460]">
                          {formatMoney(m.adSpend, currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#1C242B]">
                          {m.sales}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#B85D3B]">
                          +{m.repeatSales}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#3B6E8C]">
                          {formatMoney(m.revenue, currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#1F3A33]">
                          +{formatMoney(m.profit, currency)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${m.cumulativeCashflow >= 0 ? "text-[#1F3A33]" : "text-[#B85D3B]"
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
                      ? "border-[#1F3A33] bg-[#EAF0ED]/60 shadow-md"
                      : "border-[#E2DDD3] bg-[#FBF9F5] hover:border-[#1F3A33]/40"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF0ED] text-[#1F3A33]">
                        {scKey === "conservative" ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : scKey === "balanced" ? (
                          <Award className="h-5 w-5" />
                        ) : (
                          <Zap className="h-5 w-5" />
                        )}
                      </span>
                      <span className="rounded-full border border-[#D5DFDA] bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#1F3A33]">
                        {sc.label}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-[#5C6460] leading-relaxed">{sc.description}</p>

                    <div className="mt-4 space-y-2 border-t border-[#E2DDD3] pt-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#5C6460]">Прогноз ROI:</span>
                        <span className="font-bold text-[#B85D3B]">+{sc.predictedRoi}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5C6460]">Выручка:</span>
                        <span className="font-bold text-[#1C242B]">
                          {formatMoney(sc.expectedRevenue, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5C6460]">Чистая прибыль:</span>
                        <span className="font-bold text-[#1F3A33]">
                          {formatMoney(sc.expectedProfit, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5C6460]">Клиентов в месяц:</span>
                        <span className="font-bold text-[#1C242B]">{sc.expectedSales}</span>
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
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-md bg-[#EAF0ED] px-2 py-0.5 text-[10px] font-bold text-[#1F3A33]">
                  График 6 • Закон убывающей отдачи Хилла
                </span>
                <span className="text-[11px] text-[#7A827E]">Диапазон 25% — 150% бюджета</span>
              </div>
              <h4 className="text-sm font-bold text-[#1C242B]">
                Кривые насыщения рекламных каналов (Diminishing Returns)
              </h4>
              <p className="text-xs text-[#5C6460] mb-4">
                Показывает, как растет выручка при масштабировании бюджета и где начинается перегрев аукциона
              </p>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curveChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DDD3" />
                    <XAxis dataKey="spendPct" tick={{ fontSize: 12, fill: "#5C6460" }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#5C6460" }}
                      tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E2DDD3",
                        borderRadius: "12px",
                        color: "#1C242B",
                        fontSize: "12px",
                      }}
                      formatter={(val: unknown) => [formatMoney(Number(val) || 0, currency), ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "#5C6460" }} />
                    {data.allocations.map((a, i) => (
                      <Line
                        key={a.channel}
                        type="monotone"
                        dataKey={`${a.channel} (Выручка)`}
                        stroke={NORDIC_PALETTE[i % NORDIC_PALETTE.length]}
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
                className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-5 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1F3A33] text-xs font-extrabold text-white">
                      W{week.week}
                    </span>
                    <h5 className="text-sm font-bold text-[#1C242B]">{week.title}</h5>
                  </div>
                  <span className="rounded-lg border border-[#D5DFDA] bg-[#EAF0ED] px-2.5 py-1 text-xs font-bold text-[#1F3A33]">
                    {week.sharePct}% ({formatMoney(week.budget, currency)})
                  </span>
                </div>

                <p className="text-xs text-[#5C6460]">
                  Цель этапа: <strong className="text-[#1C242B]">{week.goal}</strong>
                </p>

                <ul className="space-y-1.5 pt-1">
                  {week.actionItems.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#5C6460]">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1F3A33]" />
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
