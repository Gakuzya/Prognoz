"use client";

import { useState, useActionState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  Loader2,
  Bot,
  Crown,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { createCompany, skipOnboarding, type OnboardingState } from "./actions";
import { SPHERE_CATALOG } from "@/components/dashboard/planConverter";

const initial: OnboardingState = {};
const inputClass =
  "w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-400";

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
    <main className="relative flex min-h-screen items-center justify-center bg-[#070709] bg-gold-grid px-4 py-12 text-zinc-100 font-sans">
      <div className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl" />

      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/35 bg-[#101016] p-6 sm:p-8 shadow-2xl gold-glow">
        <div className="mb-4 flex items-center justify-between text-xs">
          <Link href="/" className="flex items-center gap-1 text-zinc-400 hover:text-amber-300">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>На Витрину</span>
          </Link>
          <Link href="/dashboard" className="font-bold text-amber-400 hover:underline">
            В Терминал →
          </Link>
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/25">
            <Crown className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Мастер Калибровки Бизнеса
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400">
            Выберите формат работы с платформой AdForecast Sovereign AI:
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/50 p-1.5">
          <button
            type="button"
            onClick={() => setMode("plan")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition-all ${mode === "plan"
              ? "bg-gradient-to-r from-amber-400 to-yellow-600 text-black shadow-md"
              : "text-zinc-400 hover:text-white"
              }`}
          >
            <Bot className="h-4 w-4" />
            <span>Только планирую</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition-all ${mode === "existing"
              ? "bg-gradient-to-r from-amber-400 to-yellow-600 text-black shadow-md"
              : "text-zinc-400 hover:text-white"
              }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Действующий бизнес</span>
          </button>
        </div>

        {mode === "plan" && (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/15 to-transparent p-5">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
                <Crown className="h-4 w-4 text-amber-400" />
                <span>Мгновенный запуск с 5 ИИ-директорами</span>
              </div>
              <h3 className="mt-2 text-base font-bold text-white">
                Спланируйте открытие и продвижение с нуля
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
                Вам не нужно знать точный CAC или конверсию заранее. ИИ-терминал автоматически:
              </p>

              <ul className="mt-3.5 space-y-2 text-xs text-zinc-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Рассчитает смету открытия (CAPEX) и окупаемость в тенге (₸)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Построит все 6 графиков, воронку продаж и 5D-радар каналов</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Напишет сценарии Reels, офферы для 2GIS и скрипты для WhatsApp</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isSkipping}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 py-3.5 text-xs font-extrabold uppercase tracking-wider text-black shadow-xl shadow-amber-500/20 transition-all hover:brightness-110 disabled:opacity-60"
            >
              {isSkipping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Запуск терминала...</span>
                </>
              ) : (
                <>
                  <span>Перейти сразу в ИИ-Штаб и Графики</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        )}

        {mode === "existing" && (
          <div className="mt-6">
            <form action={action} className="space-y-4">
              <Field label="Название компании или бренда">
                <input
                  name="name"
                  required
                  defaultValue="ТОО «Sovereign Business»"
                  className={inputClass}
                  placeholder="ТОО «Мой бизнес»"
                />
              </Field>

              <Field label="Сфера деятельности">
                <select name="industry" className={inputClass}>
                  {SPHERE_CATALOG.map((s) => (
                    <option key={s.id} value={s.name} className="bg-[#12121a] text-white">
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Валюта расчетов">
                  <select name="currency" defaultValue="KZT" className={inputClass}>
                    <option value="KZT" className="bg-[#12121a]">KZT (₸) — Тенге</option>
                    <option value="USD" className="bg-[#12121a]">USD ($) — Доллар</option>
                    <option value="RUB" className="bg-[#12121a]">RUB (₽) — Рубль</option>
                  </select>
                </Field>

                <Field label="Средний чек (₸)">
                  <input
                    name="avgCheck"
                    type="number"
                    step="500"
                    min="1"
                    defaultValue="42000"
                    required
                    className={inputClass}
                  />
                </Field>

                <Field label="Маржинальность (%)">
                  <input
                    name="targetMargin"
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    defaultValue="48"
                    required
                    className={inputClass}
                  />
                </Field>

                <Field label="LTV клиента (₸)">
                  <input
                    name="ltv"
                    type="number"
                    step="1000"
                    min="1"
                    defaultValue="185000"
                    required
                    className={inputClass}
                  />
                </Field>
              </div>

              {state.error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span>{state.error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 py-3.5 text-xs font-extrabold uppercase tracking-wider text-black transition hover:brightness-110 disabled:opacity-60"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Сохранить и открыть ИИ-Терминал</span>
              </button>
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
      <span className="mb-1 block text-xs font-semibold text-zinc-300">{label}</span>
      {children}
    </label>
  );
}
