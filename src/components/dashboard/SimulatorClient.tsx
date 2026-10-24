"use client";

import { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  BarChart3,
  AlertCircle,
  RotateCcw,
  Sliders,
  Zap,
  Info,
  MapPin,
} from "lucide-react";
import ResultsView from "./ResultsView";
import AiCopilot from "./AiCopilot";
import { ForecastResult } from "./types";

interface ChannelInput {
  name: string;
  historicalCac: number | string;
  conversionRate: number | string; // в процентах для ввода (напр. 3.0)
}

interface CompanyInitial {
  currency: string;
  avgCheck: number;
  targetMargin: number;
  ltv: number;
}

interface SimulatorClientProps {
  company: CompanyInitial;
  branches?: { id: string; name: string }[];
}

// Предустановленные шаблоны для сфер бизнеса в Упрощенном режиме
const INDUSTRY_PRESETS = [
  {
    id: "edtech",
    label: "Онлайн-школы / EdTech",
    avgCheck: 120,
    margin: 45,
    ltv: 280,
    channels: [
      { name: "Meta (Instagram / FB)", historicalCac: 19, conversionRate: 2.5 },
      { name: "Google Search Ads", historicalCac: 28, conversionRate: 3.2 },
      { name: "TikTok Ads", historicalCac: 35, conversionRate: 1.5 },
    ],
  },
  {
    id: "ecommerce",
    label: "E-commerce / Ритейл",
    avgCheck: 45,
    margin: 35,
    ltv: 110,
    channels: [
      { name: "Meta Shopping", historicalCac: 12, conversionRate: 3.8 },
      { name: "Google Shopping (PMax)", historicalCac: 16, conversionRate: 3.0 },
      { name: "VK Реклама", historicalCac: 18, conversionRate: 2.1 },
    ],
  },
  {
    id: "b2b_saas",
    label: "B2B SaaS / IT-продукты",
    avgCheck: 350,
    margin: 80,
    ltv: 1400,
    channels: [
      { name: "Google Search Ads", historicalCac: 55, conversionRate: 4.0 },
      { name: "LinkedIn Ads", historicalCac: 95, conversionRate: 2.8 },
      { name: "Meta Lead Ads", historicalCac: 42, conversionRate: 2.0 },
    ],
  },
  {
    id: "services",
    label: "Услуги / Недвижимость / Авто",
    avgCheck: 450,
    margin: 50,
    ltv: 1200,
    channels: [
      { name: "Google Search Ads", historicalCac: 65, conversionRate: 3.5 },
      { name: "Meta Direct / WhatsApp", historicalCac: 48, conversionRate: 2.2 },
      { name: "Telegram Ads", historicalCac: 38, conversionRate: 1.8 },
    ],
  },
];

const DEFAULT_CHANNELS: ChannelInput[] = [
  { name: "Google Search Ads", historicalCac: 28, conversionRate: 3.5 },
  { name: "Meta (Facebook / Insta)", historicalCac: 19, conversionRate: 2.2 },
  { name: "TikTok Ads", historicalCac: 38, conversionRate: 1.4 },
];

export default function SimulatorClient({ company, branches = [] }: SimulatorClientProps) {
  // Режим работы: 'simple' (Упрощенный) или 'pro' (Профессиональный)
  const [mode, setMode] = useState<"simple" | "pro">("simple");

  // Филиал (для Профессионального режима)
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // Параметры для простого режима
  const [selectedIndustry, setSelectedIndustry] = useState<string>("edtech");

  // Параметры бюджета и юнит-экономики
  const [totalBudget, setTotalBudget] = useState<number | string>(10000);
  const [avgCheck, setAvgCheck] = useState<number | string>(company.avgCheck || 120);
  const [targetMargin, setTargetMargin] = useState<number | string>(company.targetMargin || 40);
  const [ltv, setLtv] = useState<number | string>(company.ltv || 300);

  // Каналы трафика
  const [channels, setChannels] = useState<ChannelInput[]>(DEFAULT_CHANNELS);

  // Состояние запроса
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForecastResult | null>(null);

  // Переключение сферы в простом режиме
  const handleIndustryChange = (industryId: string) => {
    setSelectedIndustry(industryId);
    const preset = INDUSTRY_PRESETS.find((p) => p.id === industryId);
    if (preset) {
      setAvgCheck(preset.avgCheck);
      setTargetMargin(preset.margin);
      setLtv(preset.ltv);
      setChannels(preset.channels);
    }
  };

  // Добавление / удаление / изменение канала
  const handleAddChannel = () => {
    setChannels([
      ...channels,
      { name: `Новый канал ${channels.length + 1}`, historicalCac: 30, conversionRate: 2.0 },
    ]);
  };

  const handleRemoveChannel = (index: number) => {
    if (channels.length <= 1) return;
    setChannels(channels.filter((_, i) => i !== index));
  };

  const handleChannelChange = (
    index: number,
    field: keyof ChannelInput,
    value: string | number
  ) => {
    const updated = [...channels];
    updated[index] = { ...updated[index], [field]: value };
    setChannels(updated);
  };

  // Применение совета от ИИ Copilot
  const handleApplyCopilotAdvice = () => {
    // Оптимизируем Google Ads CAC (делаем его выгоднее на 20%)
    setChannels((prev) =>
      prev.map((ch) =>
        ch.name.toLowerCase().includes("google")
          ? { ...ch, historicalCac: Math.round(Number(ch.historicalCac) * 0.8) }
          : ch
      )
    );
  };

  // Отправка формы без перезагрузки страницы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const budgetNum = Number(totalBudget);
      const avgCheckNum = Number(avgCheck);
      const ltvNum = Number(ltv);
      const marginNum = Number(targetMargin);

      if (!budgetNum || budgetNum <= 0) {
        throw new Error("Укажите корректный общий бюджет");
      }
      if (!avgCheckNum || avgCheckNum <= 0) {
        throw new Error("Укажите корректный средний чек");
      }

      const formattedChannels = channels.map((c) => {
        const cac = Number(c.historicalCac);
        const cr = Number(c.conversionRate) / 100;

        if (!c.name.trim()) throw new Error("У каждого канала должно быть имя");
        if (!cac || cac <= 0) throw new Error(`Некорректный CAC для канала "${c.name}"`);
        if (!cr || cr <= 0 || cr > 1) {
          throw new Error(`Конверсия канала "${c.name}" должна быть от 0.1% до 100%`);
        }

        return {
          name: c.name.trim(),
          historicalCac: cac,
          conversionRate: cr,
        };
      });

      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalBudget: budgetNum,
          avgCheck: avgCheckNum,
          ltv: ltvNum > 0 ? ltvNum : undefined,
          targetMargin: marginNum >= 0 ? marginNum : undefined,
          currency: company.currency,
          branchId: selectedBranchId ? selectedBranchId : undefined,
          channels: formattedChannels,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось рассчитать прогноз");
      }

      setResult(data);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Произошла непредвиденная ошибка";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetChannels = () => {
    setChannels(DEFAULT_CHANNELS);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Левая колонка: Форма симулятора (5 колонок) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-md lg:col-span-5">
          {/* Переключатель режимов: Упрощенный vs Профессиональный */}
          <div className="mb-5">
            <div className="grid grid-cols-2 rounded-xl bg-slate-100/80 p-1 text-xs font-semibold backdrop-blur-xs ring-1 ring-slate-200/60">
              <button
                type="button"
                onClick={() => setMode("simple")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all duration-200 ${
                  mode === "simple"
                    ? "bg-white text-indigo-700 shadow-sm shadow-indigo-500/10"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-indigo-600" />
                Упрощенный
              </button>

              <button
                type="button"
                onClick={() => setMode("pro")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all duration-200 ${
                  mode === "pro"
                    ? "bg-white text-indigo-700 shadow-sm shadow-indigo-500/10"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                Профессиональный
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* УПРОЩЕННЫЙ РЕЖИМ (SIMPLE MODE) */}
            {mode === "simple" && (
              <div className="space-y-4">
                {/* Общий бюджет */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Общий рекламный бюджет ({company.currency})
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-inner outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Сумма, которую вы планируете распределить между источниками трафика
                  </span>
                </div>

                {/* Сфера бизнеса */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Сфера деятельности бизнеса
                  </label>
                  <div className="relative mt-1.5">
                    <select
                      value={selectedIndustry}
                      onChange={(e) => handleIndustryChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-inner outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {INDUSTRY_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Информационный бейдж об автоподборе бенчмарков */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs leading-relaxed text-indigo-900/90">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div>
                      <span className="font-semibold text-indigo-950">Автоматический режим: </span>
                      ИИ подобрал типичные CAC, конверсии и юнит-экономику для ниши{" "}
                      <span className="font-semibold underline">
                        {INDUSTRY_PRESETS.find((p) => p.id === selectedIndustry)?.label}
                      </span>
                      . Для ручной настройки переключитесь в «Профессиональный».
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ПРОФЕССИОНАЛЬНЫЙ РЕЖИМ (PRO MODE) */}
            {mode === "pro" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Экономика и бюджет
                  </span>
                  <button
                    type="button"
                    onClick={resetChannels}
                    title="Сбросить каналы"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Сброс
                  </button>
                </div>

                {/* Выбор филиала сети */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                    Привязка к филиалу (локации)
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 shadow-inner outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Все филиалы / Общий бизнес</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {branches.length === 0 && (
                    <span className="mt-1 block text-[11px] text-slate-400">
                      Филиалы еще не добавлены. Добавьте их в разделе «Филиалы».
                    </span>
                  )}
                </div>

                {/* Общий бюджет и Средний чек */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Общий бюджет ({company.currency})
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Средний чек ({company.currency})
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={avgCheck}
                      onChange={(e) => setAvgCheck(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* LTV и Маржинальность */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      LTV клиента ({company.currency})
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={ltv}
                      onChange={(e) => setLtv(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Маржинальность (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={targetMargin}
                      onChange={(e) => setTargetMargin(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Список каналов трафика */}
                <div className="pt-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Каналы трафика ({channels.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddChannel}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Добавить канал
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {channels.map((channel, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition hover:border-slate-200"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Название канала"
                            value={channel.name}
                            onChange={(e) =>
                              handleChannelChange(idx, "name", e.target.value)
                            }
                            required
                            className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                          />
                          {channels.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveChannel(idx)}
                              className="text-slate-400 hover:text-rose-500"
                              title="Удалить канал"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500">
                              Ист. CAC ({company.currency})
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={channel.historicalCac}
                              onChange={(e) =>
                                handleChannelChange(idx, "historicalCac", e.target.value)
                              }
                              required
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-indigo-400"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">
                              Конверсия (%)
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              min="0.01"
                              max="100"
                              value={channel.conversionRate}
                              onChange={(e) =>
                                handleChannelChange(idx, "conversionRate", e.target.value)
                              }
                              required
                              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-indigo-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Ошибка валидации или запроса */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Кнопка отправки с премиальным градиентом */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/35 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Расчёт предиктивной модели...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  Сгенерировать прогноз
                </>
              )}
            </button>
          </form>
        </div>

        {/* Правая колонка: ИИ-Copilot + Результаты (7 колонок) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Интерактивный виджет ИИ Copilot */}
          <AiCopilot onApplyAdvice={handleApplyCopilotAdvice} />

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-white/80 p-12 text-center shadow-sm backdrop-blur-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                ИИ оптимизирует рекламный бюджет
              </h3>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
                Вычисляем предельную доходность каждого канала с учётом эффекта убывающей отдачи и конверсий...
              </p>
            </div>
          ) : result ? (
            <ResultsView data={result} currency={company.currency} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white/60 p-12 text-center backdrop-blur-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800">
                Результаты прогнозирования
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                Выберите режим и настройте параметры слева, затем нажмите{" "}
                <span className="font-semibold text-indigo-600">«Сгенерировать прогноз»</span>, чтобы увидеть интерактивные графики и расчёт прибыли.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
