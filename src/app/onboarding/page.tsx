"use client";

import { useState, useActionState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  Loader2,
  Bot,
  Compass,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { createCompany, skipOnboarding, type OnboardingState } from "./actions";
import { SPHERE_CATALOG } from "@/components/dashboard/planConverter";

const initial: OnboardingState = {};
const inputClass =
  "w-full rounded-xl border border-[#D8D2C5] bg-[#FBF9F5] px-3.5 py-2.5 text-sm text-[#1C242B] outline-none transition placeholder:text-[#7A827E] focus:border-[#1F3A33]";

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
    <main className="relative flex min-h-screen items-center justify-center bg-[#F7F6F2] bg-nordic-grid px-4 py-12 text-[#1C242B] font-sans">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#E2DDD3] bg-white p-6 sm:p-8 nordic-shadow">
        <div className="mb-4 flex items-center justify-between text-xs">
          <Link href="/" className="flex items-center gap-1 text-[#5C6460] hover:text-[#1F3A33]">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>На Витрину</span>
          </Link>
          <Link href="/dashboard" className="font-bold text-[#1F3A33] hover:underline">
            В Терминал →
          </Link>
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1F3A33] text-white shadow-sm">
            <Compass className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#1C242B] sm:text-2xl">
            Мастер Калибровки Бизнеса
          </h1>
          <p className="mt-1.5 text-xs text-[#5C6460]">
            Выберите формат работы с платформой AdForecast Nordic AI:
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#E2DDD3] bg-[#F2EFE9] p-1.5">
          <button
            type="button"
            onClick={() => setMode("plan")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition-all ${mode === "plan"
              ? "bg-[#1F3A33] text-white shadow-sm"
              : "text-[#5C6460] hover:text-[#1C242B]"
              }`}
          >
            <Bot className="h-4 w-4" />
            <span>Только планирую</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition-all ${mode === "existing"
              ? "bg-[#1F3A33] text-white shadow-sm"
              : "text-[#5C6460] hover:text-[#1C242B]"
              }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Действующий бизнес</span>
          </button>
        </div>

        {mode === "plan" && (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-[#D5DFDA] bg-[#EAF0ED]/60 p-5">
              <div className="flex items-center gap-2 text-[#1F3A33] font-extrabold text-xs uppercase tracking-wider">
                <Compass className="h-4 w-4 text-[#1F3A33]" />
                <span>Мгновенный запуск с 5 ИИ-директорами</span>
              </div>
              <h3 className="mt-2 text-base font-bold text-[#1C242B]">
                Спланируйте открытие и продвижение с нуля
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#5C6460]">
                Вам не нужно знать точный CAC или конверсию заранее. ИИ-терминал автоматически:
              </p>

              <ul className="mt-3.5 space-y-2 text-xs text-[#1C242B]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#1F3A33] shrink-0" />
                  <span>Рассчитает смету открытия (CAPEX) и окупаемость в тенге (₸)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#1F3A33] shrink-0" />
                  <span>Построит все 6 графиков, воронку продаж и 5D-радар каналов</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#1F3A33] shrink-0" />
                  <span>Напишет сценарии Reels, офферы для 2GIS и скрипты для WhatsApp</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isSkipping}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F3A33] py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#162B25] disabled:opacity-60"
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
                  defaultValue="ТОО «Nordic Business»"
                  className={inputClass}
                  placeholder="ТОО «Мой бизнес»"
                />
              </Field>

              <Field label="Сфера деятельности">
                <select name="industry" className={inputClass}>
                  {SPHERE_CATALOG.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Валюта расчетов">
                  <select name="currency" defaultValue="KZT" className={inputClass}>
                    <option value="KZT">KZT (₸) — Тенге</option>
                    <option value="USD">USD ($) — Доллар</option>
                    <option value="RUB">RUB (₽) — Рубль</option>
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
                  className="flex items-start gap-2 rounded-xl bg-[#FAF2EE] border border-[#E6CFC4] p-3 text-xs text-[#B85D3B]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B85D3B]" />
                  <span>{state.error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F3A33] py-3.5 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#162B25] disabled:opacity-60"
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
      <span className="mb-1 block text-xs font-semibold text-[#5C6460]">{label}</span>
      {children}
    </label>
  );
}
