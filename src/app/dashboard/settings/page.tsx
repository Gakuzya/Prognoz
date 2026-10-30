import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import { Building2 } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Настройки профиля
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Базовые экономические параметры вашего бизнеса.
        </p>
      </div>

      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{company?.name || "Ваша компания"}</h3>
            <p className="text-xs text-slate-500">{company?.industry || "Сфера деятельности не указана"}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-slate-400">Валюта расчетов</span>
            <p className="mt-1 font-semibold text-slate-800">{company?.currency || "KZT"}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-slate-400">Базовый средний чек</span>
            <p className="mt-1 font-semibold text-slate-800">{Number(company?.avgCheck || 0)} {company?.currency}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-slate-400">Целевая маржинальность</span>
            <p className="mt-1 font-semibold text-slate-800">{Number(company?.targetMargin || 0)}%</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-slate-400">LTV клиента</span>
            <p className="mt-1 font-semibold text-slate-800">{Number(company?.ltv || 0)} {company?.currency}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
