import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import { Crown, Building2, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let companyData = {
    name: "ТОО «Sovereign Business»",
    industry: "СТО / Автосервис и Детейлинг",
    currency: "KZT",
    avgCheck: 42000,
    targetMargin: 48,
    ltv: 185000,
  };

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const company = await prisma.company.findUnique({
        where: { userId: user.id },
      });
      if (company) {
        companyData = {
          name: company.name,
          industry: company.industry || "СТО / Автосервис и Детейлинг",
          currency: company.currency,
          avgCheck: Number(company.avgCheck),
          targetMargin: Number(company.targetMargin),
          ltv: Number(company.ltv),
        };
      }
    }
  } catch {
    // Автономный профиль
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
            Конфигурация организации
          </span>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Профиль бизнеса и лицензия ИИ
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Базовые экономические параметры вашей компании, используемые всеми 5 ИИ-директорами.
          </p>
        </div>

        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 px-4 py-2.5 text-xs font-extrabold text-black shadow-lg shadow-amber-500/20 transition hover:brightness-110"
        >
          <Sparkles className="h-4 w-4" />
          <span>Изменить параметры бизнеса</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Карточка параметров компании */}
        <div className="rounded-3xl border border-amber-500/30 bg-[#101016] p-6 shadow-2xl">
          <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">{companyData.name}</h3>
              <p className="text-xs text-amber-300 font-semibold">{companyData.industry}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3.5 text-xs">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <span className="text-zinc-400">Валюта учета</span>
              <p className="mt-1 text-base font-extrabold text-white">{companyData.currency} (₸)</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <span className="text-zinc-400">Базовый средний чек</span>
              <p className="mt-1 text-base font-extrabold text-amber-400">
                {companyData.avgCheck.toLocaleString("ru-KZ")} {companyData.currency}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <span className="text-zinc-400">Целевая маржинальность</span>
              <p className="mt-1 text-base font-extrabold text-emerald-400">
                {companyData.targetMargin}%
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <span className="text-zinc-400">LTV клиента</span>
              <p className="mt-1 text-base font-extrabold text-sky-400">
                {companyData.ltv.toLocaleString("ru-KZ")} {companyData.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Статус коммерческой лицензии */}
        <div className="rounded-3xl border border-amber-500/35 bg-gradient-to-br from-[#1a1508] via-[#12121a] to-[#0c0c10] p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Тариф: Business Sovereign PRO
                </h3>
                <p className="text-xs text-emerald-400 font-semibold">
                  Все модули ИИ и экспорта разблокированы
                </p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-extrabold text-emerald-400">
              ACTIVE
            </span>
          </div>

          <ul className="mt-5 space-y-2.5 text-xs text-zinc-200">
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span>5 специализированных ИИ-директоров (Стратег, Трафик, Креативы, CRO, CFO)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span>6 интерактивных графиков Recharts + закон убывающей отдачи Хилла</span>
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Генератор сценариев Reels/TikTok, 2GIS и скриптов продаж для WhatsApp</span>
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Выгрузка инвестиционных меморандумов в PDF в 1 клик</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
