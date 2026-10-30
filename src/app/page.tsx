import Link from "next/link";
import {
  LineChart,
  ArrowRight,
  Cpu,
  MapPin,
  TrendingUp,
  FileDown,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Bot,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Фоновые градиентные свечения (Atmospheric Glow) */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-purple-600/20 via-indigo-600/10 to-transparent blur-[140px]" />

      {/* Навигационная панель (Header) */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
              <LineChart className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">
              AdForecast
            </span>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
              AI 2.0
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/dashboard/chat"
              className="flex items-center gap-1.5 text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
            >
              <Bot className="h-4 w-4" />
              <span>ИИ-Консультант</span>
              <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-bold text-indigo-300">
                Groq AI
              </span>
            </Link>
            <a
              href="#features"
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Возможности
            </a>
            <a
              href="#technology"
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              ИИ-модель
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Войти
            </Link>
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/35 active:scale-95"
            >
              <span>Попробовать</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero-секция */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-36">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill бейдж */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Предиктивная аналитика рекламных бюджетов
            </div>

            {/* Главный заголовок */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:leading-[1.15]">
              Хватит сливать рекламный бюджет{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                вслепую.
              </span>
            </h1>

            {/* Подзаголовок */}
            <p className="mt-6 text-base leading-relaxed text-slate-400 sm:text-lg">
              AdForecast рассчитывает оптимальное распределение средств по каналам до запуска рекламы. Собственный математический алгоритм с учетом закона убывающей отдачи, CAC, LTV и филиальной сети.
            </p>

            {/* Кнопки CTA */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-7 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 active:scale-[0.98] sm:w-auto"
              >
                <span>Начать бесплатно</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/dashboard/chat"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-7 text-sm font-semibold text-indigo-300 backdrop-blur-md transition hover:bg-indigo-500/20 hover:text-white sm:w-auto"
              >
                <Bot className="h-4 w-4 text-indigo-400" />
                <span>ИИ-Чат запуска проекта</span>
              </Link>
            </div>

            {/* Преимущества в одну строчку */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Без привязки банковской карты
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Расчет за 2 секунды
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Поддержка любого бизнеса
              </span>
            </div>
          </div>

          {/* Интерактивный тизер продукта / Превью симулятора */}
          <div className="relative mx-auto mt-16 max-w-5xl rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-3 shadow-2xl backdrop-blur-2xl">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-6 sm:p-8">
              {/* Верхняя панель превью */}
              <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Симуляция в реальном времени
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
                    Оптимальный медиаплан: Кампания Q4
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
                    Сбалансированный
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                    Консервативный
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                    Агрессивный
                  </span>
                  <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                    ROI +224%
                  </span>
                </div>
              </div>

              {/* Метрики превью */}
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="text-xs text-slate-400">Бюджет</span>
                  <p className="mt-1 text-xl font-bold text-white">$10,000</p>
                  <span className="text-[11px] text-slate-500">3 канала трафика</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="text-xs text-slate-400">Ожидаемая выручка</span>
                  <p className="mt-1 text-xl font-bold text-indigo-400">$80,990</p>
                  <span className="text-[11px] text-emerald-400">+18% к базовой</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="text-xs text-slate-400">Чистая прибыль</span>
                  <p className="mt-1 text-xl font-bold text-emerald-400">$22,396</p>
                  <span className="text-[11px] text-slate-500">После вычета рекламы</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="text-xs text-slate-400">Клиенты</span>
                  <p className="mt-1 text-xl font-bold text-purple-400">270 продаж</p>
                  <span className="text-[11px] text-slate-500">12 531 лид</span>
                </div>
              </div>

              {/* Мини-распределение каналов */}
              <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Рекомендованное распределение бюджета</span>
                  <span className="text-indigo-400 font-semibold">ИИ Copilot подтвердил</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-indigo-500" style={{ width: "51.25%" }} title="Meta 51%" />
                  <div className="h-full bg-cyan-400" style={{ width: "34.25%" }} title="Google Ads 34%" />
                  <div className="h-full bg-pink-500" style={{ width: "14.5%" }} title="TikTok 15%" />
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    Meta Ads: 51.2% ($5,125)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    Google Ads: 34.3% ($3,425)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-pink-500" />
                    TikTok Ads: 14.5% ($1,450)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Секция возможностей (Features) */}
      <section id="features" className="relative border-t border-white/10 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Архитектура платформы
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Инструменты математической точности для маркетологов и фаундеров
            </h2>
            <p className="mt-4 text-sm text-slate-400">
              Мы объединили машинное обучение, финансовое моделирование и аналитику сетей в единый B2B-комбайн.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Карточка 1: ML-движок */}
            <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">Собственный ML-движок</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Модель на базе закона убывающей отдачи. Вычисляет точку насыщения каждого источника трафика, чтобы ни один доллар не тратился впустую.
              </p>
            </div>

            {/* Карточка 2: Мультифилиальность */}
            <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-purple-500/50 hover:shadow-purple-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/30 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">Мультифилиальность</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Управление сетью точек или франшиз. Сегментируйте прогнозы по городам и локациям без канибализации рекламных аукционов.
              </p>
            </div>

            {/* Карточка 3: Глубокая юнит-экономика */}
            <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-emerald-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">Глубокая юнит-экономика</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Прямой расчет LTV, маржи, исторического CAC и конверсии. Прогноз строится на конечной чистой прибыли, а не на кликах.
              </p>
            </div>

            {/* Карточка 4: Экспорт отчетов */}
            <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-pink-500/50 hover:shadow-pink-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/30 group-hover:bg-pink-500 group-hover:text-white transition-all">
                <FileDown className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">Экспорт отчетов в PDF</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Генерация аккуратных PDF-презентаций с графиками Recharts и выводами ИИ для инвесторов и руководства в один клик.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Баннер */}
      <section className="relative overflow-hidden border-t border-white/10 py-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 p-10 sm:p-14 shadow-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Готовы максимизировать ROI рекламных вложений?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-slate-300">
              Зарегистрируйтесь за 30 секунд и создайте свой первый предиктивный медиаплан прямо сейчас.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-xl transition-all duration-200 hover:bg-slate-100 hover:scale-105 active:scale-95"
              >
                <span>Начать бесплатно</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="border-t border-white/10 py-10 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p>© {new Date().getFullYear()} AdForecast. Предиктивная аналитика рекламных бюджетов.</p>
        </div>
      </footer>
    </div>
  );
}
