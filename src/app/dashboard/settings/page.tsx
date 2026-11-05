import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import { Compass, Building2, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let companyData = {
    name: "ТОО «Nordic Business»",
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
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#1F3A33]">
            Конфигурация организации
          </span>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-[#1C242B] sm:text-2xl">
            Профиль бизнеса и лицензия ИИ
          </h1>
          <p className="mt-1 text-xs text-[#5C6460]">
            Базовые экономические параметры вашей компании, используемые всеми 5 ИИ-директорами.
          </p>
        </div>

        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1F3A33] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#162B25]"
        >
          <Sparkles className="h-4 w-4" />
          <span>Изменить параметры бизнеса</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Карточка параметров компании */}
        <div className="rounded-3xl border border-[#E2DDD3] bg-white p-6 nordic-shadow">
          <div className="flex items-center gap-3.5 border-b border-[#ECE9E2] pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF0ED] text-[#1F3A33]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1C242B]">{companyData.name}</h3>
              <p className="text-xs text-[#1F3A33] font-semibold">{companyData.industry}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3.5 text-xs">
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-4">
              <span className="text-[#7A827E]">Валюта учета</span>
              <p className="mt-1 text-base font-extrabold text-[#1C242B]">{companyData.currency} (₸)</p>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-4">
              <span className="text-[#7A827E]">Базовый средний чек</span>
              <p className="mt-1 text-base font-extrabold text-[#1F3A33]">
                {companyData.avgCheck.toLocaleString("ru-KZ")} {companyData.currency}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-4">
              <span className="text-[#7A827E]">Целевая маржинальность</span>
              <p className="mt-1 text-base font-extrabold text-[#3B6E8C]">
                {companyData.targetMargin}%
              </p>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-4">
              <span className="text-[#7A827E]">LTV клиента</span>
              <p className="mt-1 text-base font-extrabold text-[#B85D3B]">
                {companyData.ltv.toLocaleString("ru-KZ")} {companyData.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Статус коммерческой лицензии */}
        <div className="rounded-3xl border border-[#D5DFDA] bg-[#EAF0ED]/60 p-6 nordic-shadow">
          <div className="flex items-center justify-between border-b border-[#D5DFDA] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1F3A33] text-white shadow-sm">
                <Compass className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1C242B]">
                  Тариф: Business Nordic PRO
                </h3>
                <p className="text-xs text-[#1F3A33] font-semibold">
                  Все модули ИИ и экспорта разблокированы
                </p>
              </div>
            </div>
            <span className="rounded-full border border-[#D5DFDA] bg-white px-3 py-1 text-xs font-extrabold text-[#1F3A33]">
              ACTIVE
            </span>
          </div>

          <ul className="mt-5 space-y-2.5 text-xs text-[#1C242B]">
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#1F3A33] shrink-0" />
              <span>5 специализированных ИИ-директоров (Стратег, Трафик, Креативы, CRO, CFO)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#1F3A33] shrink-0" />
              <span>6 интерактивных графиков Recharts + закон убывающей отдачи Хилла</span>
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#1F3A33] shrink-0" />
              <span>Генератор сценариев Reels/TikTok, 2GIS и скриптов продаж для WhatsApp</span>
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#1F3A33] shrink-0" />
              <span>Выгрузка инвестиционных меморандумов в PDF в 1 клик</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
