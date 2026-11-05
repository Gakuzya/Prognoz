"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Crown,
  ArrowRight,
  Cpu,
  MapPin,
  TrendingUp,
  FileDown,
  Sparkles,
  CheckCircle2,
  Bot,
  BarChart3,
  Rocket,
  Video,
  MessageSquare,
  ShieldCheck,
  Zap,
  Layers,
} from "lucide-react";
import { SPHERE_CATALOG, convertPlanDataToForecastResult } from "@/components/dashboard/planConverter";
import { formatMoney } from "@/components/dashboard/types";

export default function HomePage() {
  const router = useRouter();

  // Живой конфигуратор бизнеса на Первой странице (бесшовно передает проект на Вторую страницу)
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

  // Мгновенный предпросмотр расчетов для выбранной ниши прямо на Главной
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

  // Бесшовный переход со Страницы 1 на Страницу 2 с передачей всех параметров проекта
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
    <div className="relative min-h-screen bg-[#070709] bg-gold-grid font-sans text-zinc-100 selection:bg-amber-500 selection:text-black">
      {/* Золотые атмосферные свечения */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-amber-500/15 via-yellow-600/5 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 top-40 h-[550px] w-[550px] rounded-full bg-gradient-to-bl from-amber-600/15 via-amber-500/5 to-transparent blur-[140px]" />

      {/* НАВИГАЦИОННАЯ ПАНЕЛЬ (Связывает Страницу 1 и Страницу 2) */}
      <header className="sticky top-0 z-50 border-b border-amber-500/20 bg-[#070709]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/25">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  AdForecast
                </span>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                  SOVEREIGN AI 3.0
                </span>
              </div>
              <span className="block text-[10px] text-zinc-400">
                Платформа прогнозирования и ИИ-управления бизнесом
              </span>
            </div>
          </Link>

          {/* Переключатель страниц и модулей */}
          <nav className="hidden items-center gap-2 lg:flex">
            <span className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-extrabold text-amber-300">
              1. Главная Витрина
            </span>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-white transition hover:border-amber-400 hover:bg-amber-500/15 hover:text-amber-300"
            >
              <Bot className="h-3.5 w-3.5 text-amber-400" />
              <span>2. ИИ-Терминал (5 Агентов)</span>
            </Link>

            <Link
              href="/dashboard?tab=simulator"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-zinc-300 transition hover:border-amber-400 hover:text-amber-300"
            >
              <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
              <span>6 Графиков & Симулятор</span>
            </Link>

            <Link
              href="/dashboard?tab=promotion"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-zinc-300 transition hover:border-amber-400 hover:text-amber-300"
            >
              <Rocket className="h-3.5 w-3.5 text-amber-400" />
              <span>Продвижение & Креативы</span>
            </Link>

            <a
              href="#pricing"
              className="px-2.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:text-amber-300"
            >
              Тарифы
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-block text-xs font-bold text-zinc-300 transition hover:text-amber-300"
            >
              Вход / Аккаунт
            </Link>
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 px-4 py-2 text-xs font-extrabold text-black shadow-lg shadow-amber-500/20 transition hover:brightness-110 active:scale-95"
            >
              <span>Открыть Рабочий Терминал</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO-СЕКЦИЯ + ЖИВОЙ КОНФИГУРАТОР ПЕРЕХОДА НА СТРАНИЦУ 2 */}
      <section className="relative overflow-hidden pt-14 pb-24 lg:pt-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              ИИ-Экосистема Полного Цикла для Запуска и Продвижения Бизнеса
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:leading-[1.12]">
              Оцифруйте бизнес, стратегию и{" "}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
                рекламную окупаемость
              </span>{" "}
              до вложения денег
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              5 специализированных ИИ-директоров и математический движок строят 6 графиков окупаемости, воронку продаж, рекламные креативы и скрипты закрытия клиентов под вашу сферу бизнеса за 3 секунды.
            </p>
          </div>

          {/* 👑 ИНТЕРАКТИВНЫЙ МОСТ МЕЖДУ СТРАНИЦЕЙ 1 И СТРАНИЦЕЙ 2 */}
          <div className="mx-auto mt-12 max-w-6xl rounded-3xl border border-amber-500/35 bg-gradient-to-b from-[#14141d] via-[#0e0e14] to-[#0a0a0f] p-5 sm:p-8 shadow-2xl gold-glow">
            <div className="flex flex-col gap-3 border-b border-amber-500/20 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
                  <Layers className="h-5 w-5" />
                </span>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                    Интерактивный Конфигуратор Проекта (Шаг 1 → Шаг 2)
                  </span>
                  <h2 className="text-lg font-extrabold text-white sm:text-xl">
                    Выберите сферу бизнеса и запустите полный расчет на Рабочей Странице
                  </h2>
                </div>
              </div>

              <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-extrabold text-emerald-400">
                Мгновенная синхронизация со 2-й страницей
              </span>
            </div>

            {/* Выбор из 8 сфер бизнеса */}
            <div className="mt-5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
                1. Какую сферу бизнеса вы планируете продвигать?
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                      className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left text-xs font-bold transition-all ${
                        isSelected
                          ? "border-amber-400 bg-gradient-to-r from-amber-500/25 to-yellow-600/10 text-white shadow-md shadow-amber-500/10"
                          : "border-white/10 bg-black/40 text-zinc-300 hover:border-amber-500/40 hover:text-white"
                      }`}
                    >
                      <span className="text-lg">{sp.icon}</span>
                      <div className="min-w-0">
                        <span className="block truncate">{sp.shortName}</span>
                        <span className="block text-[10px] font-normal text-amber-400/90">
                          Чек ~{formatMoney(sp.avgCheck, "KZT")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Поля ввода своей идеи, города и бюджетов */}
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 rounded-2xl border border-white/10 bg-black/50 p-4 lg:col-span-5">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    Или впишите вашу точную нишу / идею проекта:
                  </label>
                  <input
                    type="text"
                    value={customIdea}
                    onChange={(e) => setCustomIdea(e.target.value)}
                    placeholder={`Напр.: ${activeSphere.name} в Астане`}
                    className="w-full rounded-xl border border-white/15 bg-[#12121a] px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Город / Гео запуска
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#12121a] px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Капитал открытия (₸)
                    </label>
                    <input
                      type="number"
                      step={100000}
                      value={openBudget}
                      onChange={(e) => setOpenBudget(Number(e.target.value) || 1000000)}
                      className="w-full rounded-xl border border-white/15 bg-[#12121a] px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-zinc-300">Ежемесячный рекламный бюджет:</span>
                    <span className="font-extrabold text-amber-400">
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
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>150 000 ₸</span>
                    <span>1 500 000 ₸</span>
                    <span>3 500 000 ₸</span>
                  </div>
                </div>
              </div>

              {/* Правая часть конфигуратора: Живой предпросмотр цифр и Кнопки перехода на Страницу 2 */}
              <div className="flex flex-col justify-between rounded-2xl border border-amber-500/25 bg-[#12121a] p-5 lg:col-span-7">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                        Живой предпросмотр вашей ниши:
                      </span>
                      <h3 className="text-base font-extrabold text-white">
                        {customIdea.trim() || activeSphere.name} ({city})
                      </h3>
                    </div>
                    <span className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-extrabold text-emerald-400">
                      Прогноз ROI +{livePreview.totals.roi}%
                    </span>
                  </div>

                  {/* 4 Метрики предпросмотра */}
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <span className="text-[10px] text-zinc-400 block">Прогноз выручки</span>
                      <p className="mt-1 text-sm sm:text-base font-extrabold text-amber-400">
                        {formatMoney(livePreview.totals.revenue, "KZT")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <span className="text-[10px] text-zinc-400 block">Чистая прибыль</span>
                      <p className="mt-1 text-sm sm:text-base font-extrabold text-emerald-400">
                        {formatMoney(livePreview.totals.profit, "KZT")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <span className="text-[10px] text-zinc-400 block">Клиентов в мес</span>
                      <p className="mt-1 text-sm sm:text-base font-extrabold text-white">
                        {livePreview.totals.sales} продаж
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <span className="text-[10px] text-zinc-400 block">Окупаемость старта</span>
                      <p className="mt-1 text-sm sm:text-base font-extrabold text-sky-400">
                        ~{livePreview.paybackMonths} мес.
                      </p>
                    </div>
                  </div>

                  {/* Полоса рекомендованных каналов */}
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5">
                      <span>Рекомендованные каналы продвижения в этой сфере:</span>
                      <span className="text-amber-300 font-bold">Точка безубыточности: {livePreview.breakEvenSales} продаж</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {livePreview.allocations.map((a, i) => (
                        <span
                          key={i}
                          className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200"
                        >
                          {a.channel}: {a.sharePct}% ({formatMoney(a.budget, "KZT")})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Кнопки перехода на Вторую страницу с выбранным проектом */}
                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleLaunchToWorkspace("chat")}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 px-4 py-3 text-xs font-extrabold text-black shadow-lg shadow-amber-500/20 transition hover:brightness-110 active:scale-95"
                  >
                    <Bot className="h-4 w-4 shrink-0" />
                    <span>1. Открыть в ИИ-Штабе →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchToWorkspace("simulator")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-xs font-extrabold text-amber-300 transition hover:bg-amber-500 hover:text-black active:scale-95"
                  >
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    <span>2. Смотреть 6 Графиков →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchToWorkspace("promotion")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold text-white transition hover:border-amber-400 hover:text-amber-300 active:scale-95"
                  >
                    <Rocket className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>3. Креативы & Воронка →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* СЕКЦИЯ: 5 ИИ-ДИРЕКТОРОВ И ПОЛНАЯ ОБРАБОТКА БИЗНЕСА */}
      <section id="features" className="relative border-t border-amber-500/20 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              Архитектура полной обработки бизнеса
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Что внутри платформы AdForecast Sovereign AI
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Вместо разрозненных таблиц и догадок вы получаете 5 синхронизированных ИИ-модулей и 6 математических графиков в едином терминале.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Crown,
                badge: "ИИ-Агент 1",
                title: "Архитектор Бизнеса & УТП",
                desc: "Формирует позиционирование, сегменты целевой аудитории, боли покупателей и триггеры мгновенной покупки под вашу конкретную нишу.",
              },
              {
                icon: Cpu,
                badge: "ИИ-Агент 2",
                title: "Математический Медиапланер (MMM)",
                desc: "Распределяет бюджет между Instagram Reels, 2GIS, TikTok Ads, Google.kz и Kaspi с учетом закона убывающей отдачи Хилла.",
              },
              {
                icon: Video,
                badge: "ИИ-Агент 3",
                title: "Генератор Рекламных Креативов",
                desc: "Пишет готовые посекундные сценарии для Reels/TikTok, заголовки для 2GIS и Google, а также триггерные лид-магниты.",
              },
              {
                icon: MessageSquare,
                badge: "ИИ-Агент 4",
                title: "Воронка Продаж & Скрипты WhatsApp",
                desc: "Выстраивает 6-ступенчатую воронку от показа до повторной покупки (LTV) и дает готовые речевые скрипты закрытия клиентов.",
              },
              {
                icon: TrendingUp,
                badge: "ИИ-Агент 5",
                title: "Финансовый Директор & Смета CAPEX",
                desc: "Считает раскладку стартового капитала, точку безубыточности в клиентах и помесячный график возврата инвестиций на 6 месяцев.",
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
                  className="group relative rounded-3xl border border-white/10 bg-[#101016] p-6 shadow-xl transition-all duration-300 hover:border-amber-500/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-600 group-hover:text-black transition-all">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-extrabold text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* СЕКЦИЯ ТАРИФОВ И ПРОДАЖИ ДОСТУПА (PRICING FOR COMMERCIAL SALE) */}
      <section id="pricing" className="relative border-t border-amber-500/20 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              Коммерческие лицензии и подписка
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Тарифы для предпринимателей, маркетологов и агентств
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Один сэкономленный день рекламного бюджета полностью окупает годовую подписку на платформу.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Тариф 1: Старт */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#101016] p-7">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-white">Founder Start</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-zinc-300">
                    Для запуска 1 ниши
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Идеально для начинающих предпринимателей, проверяющих бизнес-гипотезу перед открытием.
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">19 900 ₸</span>
                  <span className="text-xs text-zinc-400">/ месяц</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Доступ к ИИ-Стратегу и калькулятору окупаемости</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Базовые графики распределения бюджета</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>8 преднастроенных сфер бизнеса РК</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchToWorkspace("chat")}
                className="mt-8 w-full rounded-xl border border-amber-500/40 bg-amber-500/10 py-3 text-xs font-extrabold text-amber-300 transition hover:bg-amber-500 hover:text-black"
              >
                Попробовать бесплатно
              </button>
            </div>

            {/* Тариф 2: Business Sovereign PRO (Хит продаж) */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-[#1a1508] via-[#12121a] to-[#0d0d12] p-7 shadow-2xl gold-glow">
              <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-black shadow-md">
                Выбор 82% клиентов
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-amber-300">Business Sovereign PRO</h3>
                  <Crown className="h-5 w-5 text-amber-400" />
                </div>
                <p className="mt-2 text-xs text-zinc-300">
                  Полный цикл обработки бизнеса: все 5 ИИ-директоров, 6 графиков, креативы, воронка продаж и филиалы.
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">49 900 ₸</span>
                  <span className="text-xs text-amber-300">/ месяц</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-zinc-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Безлимитный доступ ко всем 5 ИИ-Директорам</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Все 6 графиков (включая 6-мес. Cashflow, Воронку и Радар)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Генератор сценариев Reels/TikTok и скриптов WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Экспорт презентационных PDF-отчетов для инвесторов</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchToWorkspace("simulator")}
                className="mt-8 w-full rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 py-3.5 text-xs font-extrabold uppercase tracking-wider text-black shadow-lg shadow-amber-500/25 transition hover:brightness-110"
              >
                Активировать PRO-режим сейчас →
              </button>
            </div>

            {/* Тариф 3: Корпорация / Агентство */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#101016] p-7">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-white">Agency & Enterprise</h3>
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-bold text-amber-300">
                    Мульти-бренд
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Для маркетинговых агентств, франчайзинговых сетей и инвестиционных фондов.
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">149 000 ₸</span>
                  <span className="text-xs text-zinc-400">/ месяц</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>До 25 клиентских проектов и филиальных сетей</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>White-Label PDF-отчеты с логотипом вашего агентства</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Выделенный API-ключ Groq 120B и приоритетный расчет</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/onboarding"
                className="mt-8 block w-full text-center rounded-xl border border-white/15 bg-white/5 py-3 text-xs font-extrabold text-white transition hover:border-amber-400 hover:text-amber-300"
              >
                Подключить компанию
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="border-t border-amber-500/20 bg-[#050507] py-10 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-zinc-300">AdForecast Sovereign AI</span>
            <span>— Интеллектуальная платформа прогнозирования бизнес-проектов</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-amber-400 hover:underline font-semibold">
              ИИ-Терминал (Страница 2)
            </Link>
            <Link href="/onboarding" className="hover:text-zinc-300">
              Настройка бизнеса
            </Link>
            <Link href="/login" className="hover:text-zinc-300">
              Авторизация
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
