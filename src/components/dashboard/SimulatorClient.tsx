"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sliders,
  Zap,
  Info,
  MapPin,
  Crown,
} from "lucide-react";
import ResultsView from "./ResultsView";
import AiCopilot from "./AiCopilot";
import { ForecastResult } from "./types";
import {
  SPHERE_CATALOG,
  convertPlanDataToForecastResult,
  resolveSphereBenchmark,
} from "./planConverter";

interface ChannelInput {
  name: string;
  historicalCac: number | string;
  conversionRate: number | string;
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
  externalResult?: ForecastResult | null;
  externalParams?: {
    industry?: string;
    openingBudget?: number;
    totalBudget?: number;
    avgCheck?: number;
    channels?: ChannelInput[];
  } | null;
  onForecastUpdated?: (
    newResult: ForecastResult,
    meta: {
      industry: string;
      openingBudget: number;
      adBudget: number;
      avgCheck: number;
      channels: { name: string; historicalCac: number; conversionRate: number }[];
    }
  ) => void;
  onSwitchToChat?: () => void;
}

export default function SimulatorClient({
  company,
  branches = [],
  externalResult,
  externalParams,
  onForecastUpdated,
  onSwitchToChat,
}: SimulatorClientProps) {
  const [mode, setMode] = useState<"simple" | "pro">("simple");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const initialSphere = resolveSphereBenchmark(externalParams?.industry);
  const [selectedSphereId, setSelectedSphereId] = useState<string>(
    initialSphere.id === "custom" ? SPHERE_CATALOG[0].id : initialSphere.id
  );
  const [customIndustryName, setCustomIndustryName] = useState<string>(
    externalParams?.industry || initialSphere.name
  );

  const [openingBudget, setOpeningBudget] = useState<number | string>(
    externalParams?.openingBudget || initialSphere.defaultOpenBudget
  );
  const [totalBudget, setTotalBudget] = useState<number | string>(
    externalParams?.totalBudget || initialSphere.defaultAdBudget
  );
  const [avgCheck, setAvgCheck] = useState<number | string>(
    externalParams?.avgCheck || company.avgCheck || initialSphere.avgCheck
  );
  const [targetMargin, setTargetMargin] = useState<number | string>(
    company.targetMargin || initialSphere.marginPct
  );
  const [ltv, setLtv] = useState<number | string>(company.ltv || initialSphere.ltv);

  const [channels, setChannels] = useState<ChannelInput[]>(
    externalParams?.channels && externalParams.channels.length > 0
      ? externalParams.channels
      : initialSphere.channels.map((c) => ({
          name: c.name,
          historicalCac: c.cac,
          conversionRate: c.cr,
        }))
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Всегда показываем готовые графики (либо переданные извне, либо мгновенно рассчитанные по текущей сфере)
  const [result, setResult] = useState<ForecastResult>(() => {
    if (externalResult) return externalResult;
    return convertPlanDataToForecastResult(
      {
        industry: customIndustryName,
        openingBudget: Number(openingBudget),
        adBudget: Number(totalBudget),
        avgCheck: Number(avgCheck),
        targetMargin: Number(targetMargin),
        ltv: Number(ltv),
        currency: company.currency,
      },
      company.currency
    );
  });

  useEffect(() => {
    if (externalResult) {
      setResult(externalResult);
    }
  }, [externalResult]);

  useEffect(() => {
    if (externalParams) {
      if (externalParams.industry) {
        setCustomIndustryName(externalParams.industry);
        const matched = resolveSphereBenchmark(externalParams.industry);
        if (matched.id !== "custom") setSelectedSphereId(matched.id);
      }
      if (externalParams.openingBudget) setOpeningBudget(externalParams.openingBudget);
      if (externalParams.totalBudget) setTotalBudget(externalParams.totalBudget);
      if (externalParams.avgCheck) setAvgCheck(externalParams.avgCheck);
      if (externalParams.channels && externalParams.channels.length > 0) {
        setChannels(externalParams.channels);
      }
    }
  }, [externalParams]);

  // Выбор сферы бизнеса из каталога — мгновенно обновляет параметры и перестраивает все 6 графиков!
  const handleSphereSelect = (sphereId: string) => {
    setSelectedSphereId(sphereId);
    const preset = SPHERE_CATALOG.find((p) => p.id === sphereId);
    if (preset) {
      setCustomIndustryName(preset.name);
      setOpeningBudget(preset.defaultOpenBudget);
      setTotalBudget(preset.defaultAdBudget);
      setAvgCheck(preset.avgCheck);
      setTargetMargin(preset.marginPct);
      setLtv(preset.ltv);
      const newChannels = preset.channels.map((c) => ({
        name: c.name,
        historicalCac: c.cac,
        conversionRate: c.cr,
      }));
      setChannels(newChannels);

      const instantForecast = convertPlanDataToForecastResult(
        {
          industry: preset.name,
          openingBudget: preset.defaultOpenBudget,
          adBudget: preset.defaultAdBudget,
          avgCheck: preset.avgCheck,
          targetMargin: preset.marginPct,
          ltv: preset.ltv,
          currency: company.currency,
        },
        company.currency
      );
      setResult(instantForecast);
      if (onForecastUpdated) {
        onForecastUpdated(instantForecast, {
          industry: preset.name,
          openingBudget: preset.defaultOpenBudget,
          adBudget: preset.defaultAdBudget,
          avgCheck: preset.avgCheck,
          channels: newChannels,
        });
      }
    }
  };

  const handleAddChannel = () => {
    setChannels([
      ...channels,
      { name: `Доп. канал ${channels.length + 1}`, historicalCac: 6500, conversionRate: 3.0 },
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

  const handleApplyCopilotAdvice = () => {
    const optimizedChannels = channels.map((ch) => ({
      ...ch,
      name: ch.name,
      historicalCac: Math.round(Number(ch.historicalCac) * 0.82),
      conversionRate: Number((Number(ch.conversionRate) * 1.12).toFixed(1)),
    }));
    setChannels(optimizedChannels);

    const updatedForecast = convertPlanDataToForecastResult(
      {
        industry: customIndustryName,
        openingBudget: Number(openingBudget),
        adBudget: Number(totalBudget),
        avgCheck: Number(avgCheck),
        targetMargin: Number(targetMargin),
        ltv: Number(ltv),
        currency: company.currency,
        channelAllocations: optimizedChannels.map((c) => ({
          channel: c.name,
          sharePct: Math.round(100 / optimizedChannels.length),
          budget: Math.round(Number(totalBudget) / optimizedChannels.length),
          estimatedCac: Number(c.historicalCac),
          expectedSales: Math.max(
            1,
            Math.round(
              Math.round(Number(totalBudget) / optimizedChannels.length) /
                Number(c.historicalCac)
            )
          ),
        })),
      },
      company.currency
    );
    setResult(updatedForecast);
    if (onForecastUpdated) {
      onForecastUpdated(updatedForecast, {
        industry: customIndustryName,
        openingBudget: Number(openingBudget),
        adBudget: Number(totalBudget),
        avgCheck: Number(avgCheck),
        channels: optimizedChannels,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const budgetNum = Number(totalBudget);
      const openBudgetNum = Number(openingBudget) || budgetNum * 5;
      const avgCheckNum = Number(avgCheck);
      const ltvNum = Number(ltv);
      const marginNum = Number(targetMargin);

      if (!budgetNum || budgetNum <= 0) {
        throw new Error("Укажите корректный рекламный бюджет");
      }
      if (!avgCheckNum || avgCheckNum <= 0) {
        throw new Error("Укажите корректный средний чек");
      }

      const formattedChannels = channels.map((c) => {
        const cac = Number(c.historicalCac);
        const cr = Number(c.conversionRate) / 100;

        if (!c.name.trim()) throw new Error("У каждого канала должно быть название");
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
          industry: customIndustryName,
          openingBudget: openBudgetNum,
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
      if (onForecastUpdated) {
        onForecastUpdated(data, {
          industry: customIndustryName,
          openingBudget: openBudgetNum,
          adBudget: budgetNum,
          avgCheck: avgCheckNum,
          channels: channels.map((c) => ({
            name: c.name,
            historicalCac: Number(c.historicalCac),
            conversionRate: Number(c.conversionRate),
          })),
        });
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Ошибка при расчете";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* ЛЕВАЯ КОЛОНКА: ПУЛЬТ УПРАВЛЕНИЯ ПАРАМЕТРАМИ БИЗНЕСА (4 колонки) */}
        <div className="rounded-3xl border border-amber-500/25 bg-[#101016] p-5 shadow-2xl lg:col-span-4">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                Конфигуратор Проекта
              </span>
            </div>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              Hill MMM v3.0
            </span>
          </div>

          {/* Переключатель: Быстрый / Профессиональный */}
          <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/10 bg-black/50 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode("simple")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
                mode === "simple"
                  ? "bg-gradient-to-r from-amber-400 to-yellow-600 text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              По сфере бизнеса
            </button>

            <button
              type="button"
              onClick={() => setMode("pro")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
                mode === "pro"
                  ? "bg-gradient-to-r from-amber-400 to-yellow-600 text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              PRO-настройка
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Выбор сферы из 8 эталонов */}
            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1.5">
                1. Выберите сферу продвигаемого бизнеса:
              </label>
              <select
                value={selectedSphereId}
                onChange={(e) => handleSphereSelect(e.target.value)}
                className="w-full rounded-xl border border-amber-500/30 bg-[#181822] px-3.5 py-2.5 text-xs font-bold text-white outline-none transition focus:border-amber-400"
              >
                {SPHERE_CATALOG.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Точное название бизнеса / ниши */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Название вашего направления / ниши
              </label>
              <input
                type="text"
                value={customIndustryName}
                onChange={(e) => setCustomIndustryName(e.target.value)}
                placeholder="Например: Детейлинг-студия в Алматы"
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-amber-400"
              />
            </div>

            {/* Бюджеты: Реклама и Открытие */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Реклама в мес ({company.currency})
                </label>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  required
                  className="w-full rounded-xl border border-amber-500/30 bg-black/60 px-3 py-2 text-sm font-extrabold text-amber-300 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Капитал старта ({company.currency})
                </label>
                <input
                  type="number"
                  min="50000"
                  step="50000"
                  value={openingBudget}
                  onChange={(e) => setOpeningBudget(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm font-bold text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Быстрый слайдер рекламного бюджета */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                <span>Быстрая шкала рекламы:</span>
                <span className="font-bold text-amber-300">
                  {Number(totalBudget).toLocaleString("ru-KZ")} {company.currency}
                </span>
              </div>
              <input
                type="range"
                min={100000}
                max={5000000}
                step={50000}
                value={Math.min(5000000, Math.max(100000, Number(totalBudget) || 500000))}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                <span>100 тыс ₸</span>
                <span>1.5 млн ₸</span>
                <span>5 млн ₸</span>
              </div>
            </div>

            {/* Средний чек и Маржинальность */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Средний чек ({company.currency})
                </label>
                <input
                  type="number"
                  min="500"
                  value={avgCheck}
                  onChange={(e) => setAvgCheck(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Маржинальность (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="95"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {mode === "simple" && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-zinc-300">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <span className="font-bold text-amber-300">Авто-калибровка ниши: </span>
                    Для сферы «{customIndustryName}» подключены {channels.length} ключевых канала с реальными бенчмарками CAC и конверсии.
                  </div>
                </div>
              </div>
            )}

            {/* ПРОФЕССИОНАЛЬНЫЙ РЕЖИМ: Филиал, LTV и детальная настройка каждого канала */}
            {mode === "pro" && (
              <div className="space-y-4 border-t border-white/10 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      LTV клиента ({company.currency})
                    </label>
                    <input
                      type="number"
                      min="1000"
                      value={ltv}
                      onChange={(e) => setLtv(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300 mb-1">
                      <MapPin className="h-3 w-3 text-amber-400" />
                      Филиал сети
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#181822] px-2.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                    >
                      <option value="">Вся сеть / Головной</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Список каналов трафика */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Каналы продвижения ({channels.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSphereSelect(selectedSphereId)}
                        className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Сброс
                      </button>
                      <button
                        type="button"
                        onClick={handleAddChannel}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Добавить
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {channels.map((channel, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/10 bg-black/40 p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={channel.name}
                            onChange={(e) =>
                              handleChannelChange(idx, "name", e.target.value)
                            }
                            required
                            className="w-full bg-transparent text-xs font-bold text-white outline-none"
                          />
                          {channels.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveChannel(idx)}
                              className="text-zinc-500 hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-zinc-400">
                              Базовый CAC ({company.currency})
                            </span>
                            <input
                              type="number"
                              step="100"
                              min="100"
                              value={channel.historicalCac}
                              onChange={(e) =>
                                handleChannelChange(idx, "historicalCac", e.target.value)
                              }
                              required
                              className="mt-0.5 w-full rounded-lg border border-white/10 bg-[#14141d] px-2 py-1 text-xs text-amber-300 font-semibold outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400">
                              Конверсия (%)
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              max="100"
                              value={channel.conversionRate}
                              onChange={(e) =>
                                handleChannelChange(idx, "conversionRate", e.target.value)
                              }
                              required
                              className="mt-0.5 w-full rounded-lg border border-white/10 bg-[#14141d] px-2 py-1 text-xs text-emerald-300 font-semibold outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 py-3.5 text-xs font-extrabold uppercase tracking-wider text-black shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 active:scale-98 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Математический пересчёт...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Пересчитать все 6 графиков
                </>
              )}
            </button>
          </form>
        </div>

        {/* ПРАВАЯ КОЛОНКА: ИИ-COPILOT И 6 ИНТЕРАКТИВНЫХ ГРАФИКОВ (8 колонок) */}
        <div className="space-y-5 lg:col-span-8">
          <AiCopilot
            activeIndustry={customIndustryName}
            onApplyAdvice={handleApplyCopilotAdvice}
            onOpenChat={onSwitchToChat}
          />

          <ResultsView data={result} currency={company.currency} />
        </div>
      </div>
    </div>
  );
}
