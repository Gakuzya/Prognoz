"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  ArrowRight,
  Cpu,
  TrendingUp,
  FileDown,
  Sparkles,
  CheckCircle2,
  Bot,
  BarChart3,
  Rocket,
  Video,
  MessageSquare,
  Layers,
} from "lucide-react";
import { SPHERE_CATALOG, convertPlanDataToForecastResult } from "@/components/dashboard/planConverter";
import { formatMoney } from "@/components/dashboard/types";

export default function HomePage() {
  const router = useRouter();

  const [selectedSphereId, setSelectedSphereId] = useState<string>(SPHERE_CATALOG[0].id);
  const [customIdea, setCustomIdea] = useState<string>("");
  const [openBudget, setOpenBudget] = useState<number>(SPHERE_CATALOG[0].defaultOpenBudget);
  const [adBudget, setAdBudget] = useState<number>(SPHERE_CATALOG[0].defaultAdBudget);
  const [city, setCity] = useState<string>("Алматы, Казахстан");

  const activeSphere =
    SPHERE_CATALOG.find((s) => s.id === selectedSphereId) || SPHERE_CATALOG[0];

  const handleSelectSphere = (id: string) => {
    setSelectedSphereId(id);
    const found = SPHERE_CATALOG.find((s) => s.id === id);
    if (found) {
      setOpenBudget(found.defaultOpenBudget);
      setAdBudget(found.defaultAdBudget);
    }
  };

  const livePreview = convertPlanDataToForecastResult(
    {
      industry: customIdea.trim() || activeSphere.name,
      location: city,
      openingBudget: openBudget,
      adBudget,
      avgCheck: activeSphere.avgCheck,
      targetMargin: activeSphere.marginPct,
      ltv: activeSphere.ltv,
      currency: "KZT",
    },
    "KZT"
  );

  const handleLaunchToWorkspace = (targetTab: "chat" | "simulator" | "promotion" | "report") => {
    const industryTitle = customIdea.trim() || activeSphere.name;
    const payload = {
      industry: industryTitle,
      location: city,
      openingBudget: openBudget,
      adBudget,
      avgCheck: activeSphere.avgCheck,
      currency: "KZT",
      targetTab,
      prompt:
        targetTab === "chat"
          ? `Запускаем и продвигаем бизнес в сфере «${industryTitle}» (${city}). Стартовый капитал: ${openBudget.toLocaleString("ru-KZ")} ₸, рекламный бюджет: ${adBudget.toLocaleString("ru-KZ")} ₸/мес. Разработай стратегию 360°, рекламные связки и построй все 6 графиков!`
          : undefined,
    };

    try {
      localStorage.setItem("adforecast_quick_launch", JSON.stringify(payload));
    } catch {
      // ignore
    }

    router.push(`/dashboard?tab=${targetTab}`);
  };

  return (
    <div className="relative min-h-screen bg-[#F7F6F2] bg-nordic-grid font-sans text-[#1C242B]">
      {/* Мягкое северное световое пятно */}
      <div className="pointer-events-none absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-[#DCE6E1]/50 blur-[130px]" />
      <div className="pointer-events-none absolute -right-32 top-36 h-[500px] w-[500px] rounded-full bg-[#EADFD5]/55 blur-[130px]" />

      {/* НАВИГАЦИОННАЯ ПАНЕЛЬ (Скандинавский минимализм) */}
      <header className="sticky top-0 z-50 border-b border-[#E2DDD3] bg-[#F7F6F2]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F3A33] text-white shadow-sm">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-[#1C242B]">
                  AdForecast
                </span>
                <span className="rounded-full border border-[#1F3A33]/20 bg-[#1F3A33]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#1F3A33]">
                  NORDIC AI 3.0
                </span>
              </div>
              <span className="block text-[10px] text-[#5C6460]">
                Чистая архитектура прогнозирования бизнеса
              </span>
            </div>
          </Link>

          {/* Навигация между 1-й и 2-й страницей */}
          <nav className="hidden items-center gap-2 lg:flex">
            <span className="rounded-xl border border-[#1F3A33]/25 bg-[#1F3A33]/10 px-3 py-1.5 text-xs font-semibold text-[#1F3A33]">
              1. Главная Витрина
            </span>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1C242B] transition hover:border-[#1F3A33] hover:text-[#1F3A33]"
            >
              <Bot className="h-3.5 w-3.5 text-[#1F3A33]" />
              <span>2. ИИ-Терминал (5 Агентов)</span>
            </Link>

            <Link
              href="/dashboard?tab=simulator"
              className="flex items-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-white px-3.5 py-1.5 text-xs font-medium text-[#5C6460] transition hover:border-[#1F3A33] hover:text-[#1C242B]"
            >
              <BarChart3 className="h-3.5 w-3.5 text-[#2F5D50]" />
              <span>6 Графиков & Симулятор</span>
            </Link>

            <Link
              href="/dashboard?tab=promotion"
              className="flex items-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-white px-3.5 py-1.5 text-xs font-medium text-[#5C6460] transition hover:border-[#1F3A33] hover:text-[#1C242B]"
            >
              <Rocket className="h-3.5 w-3.5 text-[#B85D3B]" />
              <span>Продвижение & Креативы</span>
            </Link>

            <a
              href="#pricing"
              className="px-2.5 py-1.5 text-xs font-medium text-[#5C6460] transition hover:text-[#1C242B]"
            >
              Тарифы
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-block text-xs font-semibold text-[#5C6460] transition hover:text-[#1C242B]"
            >
              Вход / Аккаунт
            </Link>
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-xl bg-[#1F3A33] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#162B25] active:scale-95"
            >
              <span>Открыть Рабочий Терминал</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO-СЕКЦИЯ И ЖИВОЙ КОНФИГУРАТОР ПЕРЕХОДА НА СТРАНИЦУ 2 */}
      <section className="relative overflow-hidden pt-14 pb-24 lg:pt-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D5CFC4] bg-white px-4 py-1.5 text-xs font-semibold text-[#1F3A33] shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#B85D3B]" />
              Скандинавская ясность в аналитике и продвижении бизнеса
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#1C242B] sm:text-6xl lg:leading-[1.12]">
              Прозрачный прогноз{" "}
              <span className="text-[#1F3A33] underline decoration-[#B85D3B]/40 decoration-2 underline-offset-8">
                окупаемости и роста
              </span>{" "}
              вашего бизнеса
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#5C6460] sm:text-lg">
              Никакого визуального шума — только точная математика, 5 профильных ИИ-директоров, 6 интерактивных графиков, готовые сценарии рекламы и воронка продаж под вашу нишу.
            </p>
          </div>

          {/* 🌿 ИНТЕРАКТИВНЫЙ МОСТ МЕЖДУ СТРАНИЦЕЙ 1 И СТРАНИЦЕЙ 2 */}
          <div className="mx-auto mt-12 max-w-6xl rounded-3xl border border-[#E2DDD3] bg-white p-5 sm:p-8 nordic-shadow">
            <div className="flex flex-col gap-3 border-b border-[#ECE9E2] pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2EFE9] text-[#1F3A33] border border-[#E2DDD3]">
                  <Layers className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C6460]">
                    Интерактивный конфигуратор проекта (Страница 1 → Страница 2)
                  </span>
                  <h2 className="text-lg font-bold text-[#1C242B] sm:text-xl">
                    Выберите сферу бизнеса и откройте полный расчет в рабочем терминале
                  </h2>
                </div>
              </div>

              <span className="rounded-full border border-[#1F3A33]/20 bg-[#EAF0ED] px-3.5 py-1.5 text-xs font-semibold text-[#1F3A33]">
                Мгновенная синхронизация со 2-й страницей
              </span>
            </div>

            {/* Выбор из 8 сфер бизнеса */}
            <div className="mt-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5C6460] block mb-2.5">
                1. Выберите сферу вашего бизнеса:
              </span>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {SPHERE_CATALOG.map((sp) => {
                  const isSelected = selectedSphereId === sp.id && !customIdea;
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => {
                        setCustomIdea("");
                        handleSelectSphere(sp.id);
                      }}
                      className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-[#1F3A33] bg-[#1F3A33] text-white shadow-sm"
                          : "border-[#E2DDD3] bg-[#F9F8F5] text-[#1C242B] hover:border-[#1F3A33]/50 hover:bg-white"
                      }`}
                    >
                      <span className="text-lg">{sp.icon}</span>
                      <div className="min-w-0">
                        <span className="block truncate">{sp.shortName}</span>
                        <span
                          className={`block text-[10px] font-normal ${
                            isSelected ? "text-[#DCE6E1]" : "text-[#5C6460]"
                          }`}
                        >
                          Чек ~{formatMoney(sp.avgCheck, "KZT")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Поля ввода своей идеи, города и бюджетов */}
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="space-y-4 rounded-2xl border border-[#E2DDD3] bg-[#F7F6F2] p-5 lg:col-span-5">
                <div>
                  <label className="block text-xs font-semibold text-[#1C242B] mb-1">
                    Или укажите свою индивидуальную нишу:
                  </label>
                  <input
                    type="text"
                    value={customIdea}
                    onChange={(e) => setCustomIdea(e.target.value)}
                    placeholder={`Напр.: ${activeSphere.name} в Астане`}
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1C242B] outline-none focus:border-[#1F3A33]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#5C6460] mb-1">
                      Город / Локация
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs font-semibold text-[#1C242B] outline-none focus:border-[#1F3A33]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#5C6460] mb-1">
                      Стартовый капитал (₸)
                    </label>
                    <input
                      type="number"
                      step={100000}
                      value={openBudget}
                      onChange={(e) => setOpenBudget(Number(e.target.value) || 1000000)}
                      className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs font-semibold text-[#1C242B] outline-none focus:border-[#1F3A33]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#5C6460]">Рекламный бюджет в месяц:</span>
                    <span className="font-bold text-[#1F3A33]">
                      {formatMoney(adBudget, "KZT")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={150000}
                    max={3500000}
                    step={50000}
                    value={adBudget}
                    onChange={(e) => setAdBudget(Number(e.target.value))}
                    className="w-full accent-[#1F3A33] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#7A827E]">
                    <span>150 000 ₸</span>
                    <span>1 500 000 ₸</span>
                    <span>3 500 000 ₸</span>
                  </div>
                </div>
              </div>

              {/* Правая часть конфигуратора: Живой предпросмотр и переход на 2-ю страницу */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-5 lg:col-span-7">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE9E2] pb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5C6460] block">
                        Предварительный расчет модели:
                      </span>
                      <h3 className="text-base font-bold text-[#1C242B]">
                        {customIdea.trim() || activeSphere.name} ({city})
                      </h3>
                    </div>
                    <span className="rounded-full border border-[#1F3A33]/25 bg-[#EAF0ED] px-3 py-1 text-xs font-bold text-[#1F3A33]">
                      Ожидаемый ROI +{livePreview.totals.roi}%
                    </span>
                  </div>

                  {/* 4 Метрики предпросмотра */}
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-[#E2DDD3] bg-white p-3">
                      <span className="text-[10px] text-[#5C6460] block">Прогноз выручки</span>
                      <p className="mt-1 text-sm sm:text-base font-bold text-[#1C242B]">
                        {formatMoney(livePreview.totals.revenue, "KZT")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#E2DDD3] bg-white p-3">
                      <span className="text-[10px] text-[#5C6460] block">Чистая прибыль</span>
                      <p className="mt-1 text-sm sm:text-base font-bold text-[#1F3A33]">
                        {formatMoney(livePreview.totals.profit, "KZT")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#E2DDD3] bg-white p-3">
                      <span className="text-[10px] text-[#5C6460] block">Клиентов в мес</span>
                      <p className="mt-1 text-sm sm:text-base font-bold text-[#1C242B]">
                        {livePreview.totals.sales} продаж
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#E2DDD3] bg-white p-3">
                      <span className="text-[10px] text-[#5C6460] block">Окупаемость старта</span>
                      <p className="mt-1 text-sm sm:text-base font-bold text-[#B85D3B]">
                        ~{livePreview.paybackMonths} мес.
                      </p>
                    </div>
                  </div>

                  {/* Полоса рекомендованных каналов */}
                  <div className="mt-4 rounded-xl border border-[#E2DDD3] bg-white p-3.5">
                    <div className="flex justify-between text-[11px] text-[#5C6460] mb-2">
                      <span>Рекомендованные каналы продвижения:</span>
                      <span className="text-[#1F3A33] font-semibold">
                        Точка безубыточности: {livePreview.breakEvenSales} продаж
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {livePreview.allocations.map((a, i) => (
                        <span
                          key={i}
                          className="rounded-lg border border-[#E2DDD3] bg-[#F7F6F2] px-2.5 py-1 text-[11px] font-medium text-[#1C242B]"
                        >
                          {a.channel}: <strong>{a.sharePct}%</strong> ({formatMoney(a.budget, "KZT")})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Кнопки перехода на Вторую страницу */}
                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleLaunchToWorkspace("chat")}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#1F3A33] px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#162B25] active:scale-95"
                  >
                    <Bot className="h-4 w-4 shrink-0" />
                    <span>1. Открыть в ИИ-Штабе →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchToWorkspace("simulator")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#1F3A33] bg-[#EAF0ED] px-4 py-3 text-xs font-semibold text-[#1F3A33] transition hover:bg-[#1F3A33] hover:text-white active:scale-95"
                  >
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    <span>2. Смотреть 6 Графиков →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchToWorkspace("promotion")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#D5CFC4] bg-white px-4 py-3 text-xs font-semibold text-[#1C242B] transition hover:border-[#1F3A33] active:scale-95"
                  >
                    <Rocket className="h-4 w-4 shrink-0 text-[#B85D3B]" />
                    <span>3. Креативы & Воронка →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* СЕКЦИЯ: 5 ИИ-ДИРЕКТОРОВ И ПОЛНАЯ ОБРАБОТКА БИЗНЕСА */}
      <section id="features" className="relative border-t border-[#E2DDD3] bg-[#F2EFE9]/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B85D3B]">
              Функциональная архитектура
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1C242B] sm:text-4xl">
              Полный цикл оцифровки и продвижения вашего проекта
            </h2>
            <p className="mt-3 text-sm text-[#5C6460]">
              5 профильных ИИ-директоров и 6 интерактивных графиков объединены в единую рабочую среду.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Compass,
                badge: "ИИ-Агент 1",
                title: "Архитектор Бизнеса & УТП",
                desc: "Формирует позиционирование, сегменты целевой аудитории, боли покупателей и триггеры быстрой покупки под вашу сферу.",
              },
              {
                icon: Cpu,
                badge: "ИИ-Агент 2",
                title: "Математический Медиапланер (MMM)",
                desc: "Распределяет бюджет между Instagram Reels, 2GIS, TikTok Ads, Google.kz и Kaspi с учетом кривых насыщения Хилла.",
              },
              {
                icon: Video,
                badge: "ИИ-Агент 3",
                title: "Продюсер Рекламных Креативов",
                desc: "Пишет готовые посекундные сценарии для Reels/TikTok, заголовки для 2GIS и Google, а также триггерные лид-магниты.",
              },
              {
                icon: MessageSquare,
                badge: "ИИ-Агент 4",
                title: "Воронка Продаж & Скрипты WhatsApp",
                desc: "Выстраивает 6-ступенчатую воронку от показа до повторной покупки (LTV) и дает речевые модули закрытия лидов.",
              },
              {
                icon: TrendingUp,
                badge: "ИИ-Агент 5",
                title: "Финансовый Директор & Смета CAPEX",
                desc: "Считает раскладку стартового капитала, точку безубыточности и помесячный возврат инвестиций на 6 месяцев.",
              },
              {
                icon: FileDown,
                badge: "B2B-Экспорт",
                title: "6 Графиков & PDF Питч-Дек",
                desc: "Строит Donut-сплит, Bar-отдачу, 6-месячный Cashflow, Воронку конверсий, 5D-Радар каналов и выгружает отчет в PDF.",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="group relative rounded-3xl border border-[#E2DDD3] bg-white p-6 nordic-shadow transition-all duration-300 hover:border-[#1F3A33]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2EFE9] text-[#1F3A33] group-hover:bg-[#1F3A33] group-hover:text-white transition-all">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-[#E2DDD3] bg-[#F7F6F2] px-2.5 py-0.5 text-[10px] font-semibold text-[#5C6460]">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[#1C242B]">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#5C6460]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* СЕКЦИЯ ТАРИФОВ (PRICING) */}
      <section id="pricing" className="relative border-t border-[#E2DDD3] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1F3A33]">
              Коммерческие тарифы
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1C242B] sm:text-4xl">
              Прозрачные условия для бизнеса и агентств
            </h2>
            <p className="mt-3 text-sm text-[#5C6460]">
              Выберите подходящий уровень доступа к предиктивной платформе AdForecast Nordic AI.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Тариф 1 */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#E2DDD3] bg-white p-7 nordic-shadow">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#1C242B]">Founder Start</h3>
                  <span className="rounded-full bg-[#F2EFE9] px-3 py-1 text-[10px] font-semibold text-[#5C6460]">
                    Для 1 проекта
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5C6460]">
                  Для предпринимателей, проверяющих бизнес-модель и смету перед запуском.
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#1C242B]">19 900 ₸</span>
                  <span className="text-xs text-[#5C6460]">/ месяц</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-[#1C242B]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1F3A33] shrink-0" />
                    <span>Доступ к ИИ-Стратегу и калькулятору окупаемости</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1F3A33] shrink-0" />
                    <span>Графики распределения рекламного бюджета</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1F3A33] shrink-0" />
                    <span>8 эталонных сфер бизнеса Казахстана</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchToWorkspace("chat")}
                className="mt-8 w-full rounded-xl border border-[#1F3A33] bg-white py-3 text-xs font-semibold text-[#1F3A33] transition hover:bg-[#1F3A33] hover:text-white"
              >
                Попробовать бесплатно
              </button>
            </div>

            {/* Тариф 2: PRO */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-[#1F3A33] bg-[#1F3A33] p-7 text-white shadow-xl">
              <div className="absolute -top-3.5 right-6 rounded-full bg-[#B85D3B] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Рекомендуемый выбор
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Business Nordic PRO</h3>
                  <Compass className="h-5 w-5 text-[#DCE6E1]" />
                </div>
                <p className="mt-2 text-xs text-[#DCE6E1]">
                  Полное сопровождение бизнеса: все 5 ИИ-директоров, 6 графиков, креативы, воронка продаж и филиалы.
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">49 900 ₸</span>
                  <span className="text-xs text-[#DCE6E1]">/ месяц</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-[#F2EFE9]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#A3D9C9] shrink-0" />
                    <span>Безлимитный доступ ко всем 5 ИИ-Директорам</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#A3D9C9] shrink-0" />
                    <span>Все 6 графиков (6-мес. Cashflow, Воронка, 5D-Радар)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#A3D9C9] shrink-0" />
                    <span>Генератор сценариев Reels/TikTok и скриптов WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#A3D9C9] shrink-0" />
                    <span>Экспорт презентационных PDF-отчетов для инвесторов</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchToWorkspace("simulator")}
                className="mt-8 w-full rounded-xl bg-white py-3.5 text-xs font-bold uppercase tracking-wider text-[#1F3A33] shadow-md transition hover:bg-[#F2EFE9]"
              >
                Открыть PRO-Терминал →
              </button>
            </div>

            {/* Тариф 3 */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#E2DDD3] bg-white p-7 nordic-shadow">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#1C242B]">Agency & Enterprise</h3>
                  <span className="rounded-full bg-[#F2EFE9] px-3 py-1 text-[10px] font-semibold text-[#1F3A33]">
                    Мульти-бренд
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5C6460]">
                  Для маркетинговых агентств, сетей филиалов и консалтинговых групп.
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#1C242B]">149 000 ₸</span>
                  <span className="text-xs text-[#5C6460]">/ месяц</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-[#1C242B]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1F3A33] shrink-0" />
                    <span>До 25 клиентских проектов и филиальных сетей</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1F3A33] shrink-0" />
                    <span>White-Label PDF-отчеты для защиты перед заказчиками</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1F3A33] shrink-0" />
                    <span>Индивидуальная калибровка моделей 120B</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/onboarding"
                className="mt-8 block w-full text-center rounded-xl border border-[#D5CFC4] bg-[#F7F6F2] py-3 text-xs font-semibold text-[#1C242B] transition hover:border-[#1F3A33]"
              >
                Подключить организацию
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="border-t border-[#E2DDD3] bg-[#EFECE6] py-10 text-xs text-[#5C6460]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#1F3A33]" />
            <span className="font-bold text-[#1C242B]">AdForecast Nordic AI</span>
            <span>— Предиктивная аналитика и продвижение бизнес-проектов</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-[#1F3A33] hover:underline font-semibold">
              ИИ-Терминал (Страница 2)
            </Link>
            <Link href="/onboarding" className="hover:text-[#1C242B]">
              Настройка бизнеса
            </Link>
            <Link href="/login" className="hover:text-[#1C242B]">
              Авторизация
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
