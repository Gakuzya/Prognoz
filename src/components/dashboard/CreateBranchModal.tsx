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
        className="inline-flex items-center gap-2 rounded-xl bg-[#1F3A33] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#162B25] active:scale-95"
      >
        <Plus className="h-4 w-4" />
        Добавить филиал сети
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C242B]/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E2DDD3] bg-white p-6 nordic-shadow">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[#7A827E] hover:bg-[#F2EFE9] hover:text-[#1C242B] transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0ED] text-[#1F3A33]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1C242B]">Новый филиал / Локация</h3>
                <p className="text-xs text-[#5C6460]">
                  Для раздельного прогнозирования бюджетов по городам
                </p>
              </div>
            </div>

            <form action={action} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5C6460]">
                  Название филиала или города
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Например: Филиал Алматы Медеу или Астана Есиль"
                  className="mt-1.5 w-full rounded-xl border border-[#D8D2C5] bg-[#FBF9F5] px-3.5 py-2.5 text-sm text-[#1C242B] outline-none transition focus:border-[#1F3A33]"
                />
              </div>

              {state.error && (
                <div className="flex items-start gap-2 rounded-xl border border-[#E6CFC4] bg-[#FAF2EE] p-3 text-xs text-[#B85D3B]">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#B85D3B]" />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-[#D8D2C5] px-4 py-2 text-xs font-semibold text-[#5C6460] hover:bg-[#F2EFE9] transition"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1F3A33] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#162B25] disabled:opacity-60"
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
