"use client";

import { useActionState } from "react";
import { AlertCircle, Building2, Loader2 } from "lucide-react";
import { createCompany, type OnboardingState } from "./actions";

const initial: OnboardingState = {};
const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(createCompany, initial);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Профиль бизнеса</h1>
            <p className="text-sm text-slate-500">Эти данные нужны ИИ для точных прогнозов</p>
          </div>
        </div>

        <form action={action} className="space-y-4">
          <Field label="Название компании">
            <input name="name" required className={input} placeholder="ООО «Ромашка»" />
          </Field>
          <Field label="Сфера деятельности">
            <input name="industry" className={input} placeholder="Онлайн-школа, ритейл…" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Валюта">
              <select name="currency" defaultValue="KZT" className={input}>
                <option value="KZT">KZT (₸) — Казахстанский тенге</option>
                <option value="USD">USD ($) — Доллар США</option>
                <option value="RUB">RUB (₽) — Российский рубль</option>
                <option value="EUR">EUR (€) — Евро</option>
              </select>
            </Field>
            <Field label="Средний чек">
              <input name="avgCheck" type="number" step="0.01" min="0" required className={input} />
            </Field>
            <Field label="Маржинальность, %">
              <input name="targetMargin" type="number" step="0.1" min="0" max="100" required className={input} />
            </Field>
            <Field label="LTV клиента">
              <input name="ltv" type="number" step="0.01" min="0" required className={input} />
            </Field>
          </div>

          {state.error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Сохранить и продолжить
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
