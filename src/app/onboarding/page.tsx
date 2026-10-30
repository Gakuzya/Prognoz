"use client";

import { useState, useActionState, useTransition } from "react";
import {
  AlertCircle,
  Building2,
  Loader2,
  Bot,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { createCompany, skipOnboarding, type OnboardingState } from "./actions";

const initial: OnboardingState = {};
const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

export default function OnboardingPage() {
  const [mode, setMode] = useState<"plan" | "existing">("plan");
  const [state, action, pending] = useActionState(createCompany, initial);
  const [isSkipping, startSkipTransition] = useTransition();

  const handleSkip = () => {
    startSkipTransition(async () => {
      await skipOnboarding();
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-12 text-slate-100 font-sans">
      {/* Фоновые градиентные свечения */}
      <div className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />

      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        {/* Заголовок онбординга */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Добро пожаловать в AdForecast!
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
            Выберите, с чего вы хотите начать работу с платформой:
          </p>
        </div>

        {/* Переключатель режимов: Планирую бизнес VS Действующий бизнес */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1.5 border border-white/10">
          <button
            type="button"
            onClick={() => setMode("plan")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === "plan"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 scale-100"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>Только планирую</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
              mode === "existing"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 scale-100"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Действующий бизнес</span>
          </button>
        </div>

        {/* ВАРИАНТ 1: ТОЛЬКО ПЛАНИРУЮ (ПРОПУСК ВВОДА КОМПАНИИ) */}
        {mode === "plan" && (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent p-5">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Быстрый старт без заполнения анкет</span>
              </div>
              <h3 className="mt-2 text-base font-bold text-white">
                Спланируйте проект с ИИ-Стратегом
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Вам не нужно сейчас придумывать название компании, высчитывать точный средний чек или LTV.
                ИИ-ассистент в интерактивном диалоге поможет вам:
              </p>

              <ul className="mt-3.5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Подобрать прибыльную нишу под ваш стартовый бюджет</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Рассчитать окупаемость в тенге (₸) и каналы трафика</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Построить интерактивные графики окупаемости в 1 клик</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isSkipping}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-98 disabled:opacity-60"
            >
              {isSkipping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Создание проекта...</span>
                </>
              ) : (
                <>
                  <span>Пропустить и перейти в ИИ-Штаб</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400">
              * Вы всегда сможете указать реквизиты компании позже в настройках профиля.
            </p>
          </div>
        )}

        {/* ВАРИАНТ 2: ДЕЙСТВУЮЩИЙ БИЗНЕС (ПОЛНАЯ ФОРМА) */}
        {mode === "existing" && (
          <div className="mt-6">
            <form action={action} className="space-y-4">
              <Field label="Название компании">
                <input
                  name="name"
                  required
                  className={input}
                  placeholder="ТОО «Мой бизнес» или название бренда"
                />
              </Field>

              <Field label="Сфера деятельности">
                <input
                  name="industry"
                  className={input}
                  placeholder="Автосервис, Ритейл, Кофейня, Онлайн-курсы…"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Валюта расчетов">
                  <select name="currency" defaultValue="KZT" className={input}>
                    <option value="KZT">KZT (₸) — Казахстан</option>
                    <option value="USD">USD ($) — Доллар США</option>
                    <option value="RUB">RUB (₽) — Рубль</option>
                    <option value="EUR">EUR (€) — Евро</option>
                  </select>
                </Field>

                <Field label="Средний чек (₸)">
                  <input
                    name="avgCheck"
                    type="number"
                    step="1"
                    min="1"
                    defaultValue="25000"
                    required
                    className={input}
                  />
                </Field>

                <Field label="Маржинальность (%)">
                  <input
                    name="targetMargin"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    defaultValue="45"
                    required
                    className={input}
                  />
                </Field>

                <Field label="LTV клиента (₸)">
                  <input
                    name="ltv"
                    type="number"
                    step="1"
                    min="1"
                    defaultValue="75000"
                    required
                    className={input}
                  />
                </Field>
              </div>

              {state.error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span>{state.error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Сохранить профиль бизнеса</span>
              </button>

              {/* Быстрая кнопка пропуска внизу формы */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSkipping}
                  className="text-xs text-slate-400 hover:text-indigo-300 underline underline-offset-4 transition"
                >
                  У вас пока нет точных цифр? Пропустить и перейти к ИИ
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="mb-1 block text-xs font-semibold text-slate-300">{label}</span>
      {children}
    </label>
  );
}
