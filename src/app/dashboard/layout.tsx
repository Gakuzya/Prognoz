import Link from "next/link";
import { Crown, LogOut, UserCheck, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import SidebarNav from "@/components/dashboard/SidebarNav";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | null = null;
  let companyName = "ТОО «Sovereign Business»";

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || "Аккаунт активен";
      const company = await prisma.company.findUnique({
        where: { userId: user.id },
        select: { name: true },
      });
      if (company?.name) {
        companyName = company.name;
      }
    }
  } catch {
    // Гостевой / автономный режим
  }

  return (
    <div className="flex min-h-screen bg-[#070709] text-zinc-100">
      {/* Боковая панель (Черно-золотая) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-amber-500/20 bg-[#0b0b10] md:flex">
        <div className="flex h-16 items-center justify-between border-b border-amber-500/20 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-black shadow-md shadow-amber-500/20">
              <Crown className="h-4 w-4" />
            </span>
            <div>
              <span className="font-extrabold tracking-tight text-white block text-sm leading-none">
                AdForecast
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">
                SOVEREIGN AI
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 p-3.5">
          <div className="mb-2 px-2 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
            Навигация платформы
          </div>
          <SidebarNav />
        </div>

        {/* Карточка тарифа в сайдбаре */}
        <div className="m-3.5 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/15 to-transparent p-3.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Лицензия: Business PRO</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
            Все 5 ИИ-директоров, 6 графиков окупаемости и экспорт PDF активны.
          </p>
          <p className="mt-2 truncate border-t border-white/10 pt-2 text-[11px] font-semibold text-white">
            🏢 {companyName}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Верхняя шапка */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-amber-500/20 bg-[#070709]/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2.5 md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black">
                <Crown className="h-4 w-4" />
              </span>
              <span className="font-extrabold text-white text-sm">AdForecast</span>
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300">
              ИИ-Система Продвижения и Прогнозирования Бизнеса
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-amber-500/40 hover:text-amber-300"
            >
              <span>Мастер настройки бизнеса</span>
            </Link>

            {userEmail ? (
              <div className="flex items-center gap-2.5">
                <span className="max-w-[180px] truncate text-xs font-semibold text-amber-300">
                  {userEmail}
                </span>
                <form action={logout}>
                  <button
                    type="submit"
                    title="Выйти"
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:border-amber-500/40 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-3.5 py-1.5 text-xs font-extrabold text-black shadow-md shadow-amber-500/15 transition hover:brightness-110"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Личный кабинет / Вход</span>
              </Link>
            )}
          </div>
        </header>

        {/* Мобильная навигация */}
        <div className="border-b border-amber-500/20 bg-[#0b0b10] px-3 py-2 md:hidden">
          <SidebarNav horizontal />
        </div>

        <main className="flex-1 p-4 sm:p-6 bg-gold-grid">{children}</main>
      </div>
    </div>
  );
}
