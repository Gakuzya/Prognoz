"use client";

import { useActionState, useState } from "react";
import { Plus, X, Building2, Loader2, AlertCircle } from "lucide-react";
import { createBranch, type BranchActionState } from "@/app/dashboard/branches/actions";

const initialState: BranchActionState = {};

export default function CreateBranchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: BranchActionState, formData: FormData) => {
      const res = await createBranch(prev, formData);
      if (res.success) {
        setIsOpen(false);
      }
      return res;
    },
    initialState
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        Добавить филиал
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
            {/* Кнопка закрытия */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-inner">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Новый филиал</h3>
                <p className="text-xs text-slate-500">Добавьте филиал или город для раздельного прогнозирования</p>
              </div>
            </div>

            <form action={action} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Название филиала / Город
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Например: Филиал Центр (Алматы) или СПб Невский"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 shadow-inner outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {state.error && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Создать филиал
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
