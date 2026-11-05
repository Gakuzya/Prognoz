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
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 px-4 py-2.5 text-xs font-extrabold text-black shadow-lg shadow-amber-500/20 transition hover:brightness-110 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        Добавить филиал сети
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/35 bg-[#12121a] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Новый филиал / Локация</h3>
                <p className="text-xs text-zinc-400">
                  Для раздельного прогнозирования бюджетов по городам
                </p>
              </div>
            </div>

            <form action={action} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300">
                  Название филиала или города
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Например: Филиал Алматы Медеу или Астана Есиль"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-amber-400"
                />
              </div>

              {state.error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5 transition"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-4 py-2 text-xs font-extrabold text-black shadow-md transition hover:brightness-110 disabled:opacity-60"
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
