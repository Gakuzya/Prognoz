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

// Предустановленные шаблоны для сфер бизнеса в Казахстане (тенге, KZT)
const INDUSTRY_PRESETS = [
  {
    id: "edtech",
    label: "Онлайн-школы / EdTech (Казахстан)",
    avgCheck: 65000,
    margin: 50,
    ltv: 180000,
    channels: [
      { name: "Instagram Ads (Reels / Meta)", historicalCac: 9500, conversionRate: 2.8 },
      { name: "TikTok Ads (Казахстан)", historicalCac: 8200, conversionRate: 2.2 },
      { name: "Google Search (Google.kz)", historicalCac: 14000, conversionRate: 3.5 },
    ],
  },
  {
    id: "ecommerce",
    label: "E-commerce / Ритейл & Kaspi",
    avgCheck: 22000,
    margin: 35,
    ltv: 65000,
    channels: [
      { name: "Instagram Shopping / Каталог", historicalCac: 4800, conversionRate: 3.6 },
      { name: "TikTok Ads (Казахстан)", historicalCac: 4200, conversionRate: 2.9 },
      { name: "Google Shopping / Поиск", historicalCac: 5500, conversionRate: 3.2 },
    ],
  },
  {
    id: "b2b_saas",
    label: "B2B SaaS / IT-услуги РК",
    avgCheck: 180000,
    margin: 80,
    ltv: 850000,
    channels: [
      { name: "Google Search Ads (B2B Казахстан)", historicalCac: 32000, conversionRate: 4.0 },
      { name: "Meta / Instagram Lead Ads", historicalCac: 24000, conversionRate: 2.5 },
      { name: "Telegram / Бизнес-сообщества", historicalCac: 28000, conversionRate: 2.2 },
    ],
  },
  {
    id: "services",
    label: "СТО / Услуги / Недвижимость",
    avgCheck: 250000,
    margin: 50,
    ltv: 700000,
    channels: [
      { name: "2GIS (Алматы / Астана / Шымкент)", historicalCac: 18000, conversionRate: 4.5 },
      { name: "Instagram Direct / WhatsApp", historicalCac: 19000, conversionRate: 3.2 },
      { name: "Google Search (Горячий спрос)", historicalCac: 26000, conversionRate: 3.8 },
    ],
  },
  {
    id: "horeca",
    label: "HoReCa / Рестораны & Доставка",
    avgCheck: 14000,
    margin: 40,
    ltv: 90000,
    channels: [
      { name: "2GIS & Яндекс.Карты (Гео Казахстан)", historicalCac: 3200, conversionRate: 6.0 },
      { name: "Instagram Stories / Reels (Локально)", historicalCac: 4500, conversionRate: 3.5 },
      { name: "TikTok фуд-блогеры / обзоры", historicalCac: 3800, conversionRate: 4.0 },
    ],
  },
  {
    id: "medtech",
    label: "Медицина / Клиники / Стоматология",
    avgCheck: 85000,
    margin: 55,
    ltv: 380000,
    channels: [
      { name: "2GIS (Медицина / Стоматология)", historicalCac: 12000, conversionRate: 5.2 },
      { name: "Google Search (Запись к врачу)", historicalCac: 18000, conversionRate: 4.2 },
      { name: "Instagram (Узнаваемость клиники)", historicalCac: 14000, conversionRate: 2.8 },
    ],
  },
];

const DEFAULT_CHANNELS: ChannelInput[] = [
  { name: "Instagram Ads (Reels / Meta)", historicalCac: 9500, conversionRate: 2.8 },
  { name: "2GIS (Казахстан)", historicalCac: 7500, conversionRate: 4.5 },
  { name: "TikTok Ads (Казахстан)", historicalCac: 8200, conversionRate: 2.2 },
];

export default function SimulatorClient({ company, branches = [] }: SimulatorClientProps) {
  // Режим работы: 'simple' (Упрощенный) или 'pro' (Профессиональный)
  const [mode, setMode] = useState<"simple" | "pro">("simple");

  // Филиал (для Профессионального режима)
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // Параметры для простого режима
  const [selectedIndustry, setSelectedIndustry] = useState<string>("services");

  // Параметры бюджета и юнит-экономики (в тенге)
  const [totalBudget, setTotalBudget] = useState<number | string>(1000000);
  const [avgCheck, setAvgCheck] = useState<number | string>(company.avgCheck || 250000);
  const [targetMargin, setTargetMargin] = useState<number | string>(company.targetMargin || 50);
  const [ltv, setLtv] = useState<number | string>(company.ltv || 700000);

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
      { name: `Новый канал ${channels.length + 1}`, historicalCac: 7500, conversionRate: 2.5 },
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

                    {/* Быстрые шаблоны каналов */}
                    <div className="mb-3">
                      <span className="text-[10px] text-slate-400 block mb-1.5">
                        Быстрое добавление проверенных каналов:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: "Instagram Ads (Reels)", cac: 8500, cr: 2.8 },
                          { name: "2GIS (Казахстан)", cac: 6500, cr: 4.5 },
                          { name: "TikTok Ads (РК)", cac: 7200, cr: 2.4 },
                          { name: "Google.kz (Поиск)", cac: 12500, cr: 3.6 },
                          { name: "WhatsApp / Telegram", cac: 5800, cr: 4.0 },
                          { name: "Яндекс.Директ (РК)", cac: 11000, cr: 3.2 },
                        ].map((q) => {
                          const isAlreadyAdded = channels.some(
                            (c) => c.name.toLowerCase() === q.name.toLowerCase()
                          );
                          return (
                            <button
                              key={q.name}
                              type="button"
                              disabled={isAlreadyAdded}
                              onClick={() => {
                                setChannels([
                                  ...channels,
                                  { name: q.name, historicalCac: q.cac, conversionRate: q.cr },
                                ]);
                              }}
                              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                                isAlreadyAdded
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 border border-indigo-200/50"
                              }`}
                            >
                              + {q.name}
                            </button>
                          );
                        })}
                      </div>
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
