"use client";

import { useRef, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  AlertTriangle,
  Lightbulb,
  FileDown,
  Loader2,
  LineChart,
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

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function ResultsView({ data, currency = "USD" }: ResultsViewProps) {
  const { totals, allocations, summary, risks } = data;
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
      pdf.save(`AdForecast_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: unknown) {
      console.error("Ошибка при генерации PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Данные для круговой диаграммы (распределение бюджета)
  const pieData = allocations.map((a) => ({
    name: a.channel,
    value: a.budget,
    sharePct: a.sharePct,
  }));

  // Данные для столбчатой диаграммы (Бюджет vs Ожидаемая выручка)
  const barData = allocations.map((a) => ({
    name: a.channel,
    Бюджет: a.budget,
    Выручка: a.expectedRevenue,
    Прибыль: a.expectedProfit,
  }));

  return (
    <div className="space-y-4">
      {/* Шапка с кнопкой экспорта PDF */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Результаты моделирования
          </h3>
          <p className="text-xs text-slate-500">
            Предиктивный расчет оптимального медиаплана
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-slate-900/10 transition-all duration-200 hover:bg-slate-800 active:scale-95 disabled:opacity-60"
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

      {/* Контейнер, который захватывается для PDF */}
      <div ref={reportRef} className="space-y-6 rounded-2xl bg-white p-4 sm:p-6 shadow-xs">
        {/* Фирменный заголовок в PDF-отчете */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <LineChart className="h-4 w-4" />
            </span>
            <span className="font-bold text-slate-900 text-sm">AdForecast Analytics Report</span>
          </div>
          <span className="text-xs text-slate-400">
            {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {/* Метрики (Summary Cards) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Выручка</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {formatMoney(totals.revenue, currency)}
            </p>
            <span className="text-xs text-slate-400">Прогнозируемая</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Продажи</span>
              <ShoppingCart className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {formatNumber(totals.sales)}
            </p>
            <span className="text-xs text-slate-400">клиентов / заказов</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Общий ROI</span>
              <Percent className="h-4 w-4 text-amber-600" />
            </div>
            <p
              className={`mt-2 text-xl font-bold ${
                totals.roi >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {totals.roi.toFixed(1)}%
            </p>
            <span className="text-xs text-slate-400">Окупаемость инвестиций</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Чистая прибыль</span>
              <TrendingUp className="h-4 w-4 text-cyan-600" />
            </div>
            <p
              className={`mt-2 text-xl font-bold ${
                totals.profit >= 0 ? "text-slate-900" : "text-rose-600"
              }`}
            >
              {formatMoney(totals.profit, currency)}
            </p>
            <span className="text-xs text-slate-400">После вычета рекламы</span>
          </div>
        </div>

        {/* Резюме ИИ и Риски */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-indigo-950">
                Резюме модели оптимизации
              </h4>
              <p className="text-sm leading-relaxed text-indigo-900/90">{summary}</p>
            </div>
          </div>

          {risks && risks.length > 0 && (
            <div className="mt-3 border-t border-indigo-100 pt-3">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Возможные риски:
              </div>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-amber-900/80">
                {risks.map((risk, idx) => (
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
              Оптимальные доли для максимальной отдачи
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

        {/* Таблица детализации по каналам */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
            <h4 className="text-sm font-semibold text-slate-800">
              Детализация каналов
            </h4>
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
                  <th className="px-4 py-3 text-right">Выручка</th>
                  <th className="px-4 py-3 text-right">Прибыль</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((a, i) => (
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
                    <td className="px-4 py-3 text-right">
                      {formatMoney(a.budget, currency)}
                    </td>
                    <td className="px-4 py-3 text-right">{formatNumber(a.expectedLeads)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {formatNumber(a.expectedSales)}
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
    </div>
  );
}
