import Link from "next/link";
import { Compass, LogOut, UserCheck, Sparkles } from "lucide-react";
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
  let companyName = "ТОО «Nordic Business»";

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
    <div className="flex min-h-screen bg-[#F7F6F2] text-[#1C242B]">
      {/* Боковая панель (Скандинавский лен и хвоя) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#E2DDD3] bg-[#FBF9F5] md:flex">
        <div className="flex h-16 items-center justify-between border-b border-[#E2DDD3] px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1F3A33] text-white shadow-xs">
              <Compass className="h-4 w-4" />
            </span>
            <div>
              <span className="font-bold tracking-tight text-[#1C242B] block text-sm leading-none">
                AdForecast
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#4A6B5D]">
                NORDIC AI
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 p-3.5">
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#7A827E]">
            Навигация платформы
          </div>
          <SidebarNav />
        </div>

        {/* Карточка тарифа в сайдбаре */}
        <div className="m-3.5 rounded-2xl border border-[#E2DDD3] bg-[#F2EFE9] p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1F3A33]">
            <Sparkles className="h-3.5 w-3.5 text-[#B85D3B]" />
            <span>Лицензия: Business PRO</span>
          </div>
          <p className="mt-1 text-[11px] text-[#5C6460] leading-relaxed">
            Все 5 ИИ-директоров, 6 графиков окупаемости и экспорт PDF активны.
          </p>
          <p className="mt-2 truncate border-t border-[#E2DDD3] pt-2 text-[11px] font-semibold text-[#1C242B]">
            🏢 {companyName}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Верхняя шапка */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2DDD3] bg-[#F7F6F2]/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2.5 md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1F3A33] text-white">
                <Compass className="h-4 w-4" />
              </span>
              <span className="font-bold text-[#1C242B] text-sm">AdForecast</span>
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-[#D5CFC4] bg-white px-3.5 py-1 text-[11px] font-semibold text-[#1F3A33]">
              Скандинавская аналитическая система продвижения бизнеса
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#D5CFC4] bg-white px-3 py-1.5 text-xs font-semibold text-[#1C242B] transition hover:border-[#1F3A33]"
            >
              <span>Мастер настройки бизнеса</span>
            </Link>

            {userEmail ? (
              <div className="flex items-center gap-2.5">
                <span className="max-w-[180px] truncate text-xs font-semibold text-[#1F3A33]">
                  {userEmail}
                </span>
                <form action={logout}>
                  <button
                    type="submit"
                    title="Выйти"
                    className="rounded-xl border border-[#D5CFC4] bg-white p-2 text-[#5C6460] transition hover:border-[#1F3A33] hover:text-[#1C242B]"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F3A33] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#162B25]"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Личный кабинет / Вход</span>
              </Link>
            )}
          </div>
        </header>

        {/* Мобильная навигация */}
        <div className="border-b border-[#E2DDD3] bg-[#FBF9F5] px-3 py-2 md:hidden">
          <SidebarNav horizontal />
        </div>

        <main className="flex-1 p-4 sm:p-6 bg-nordic-grid">{children}</main>
      </div>
    </div>
  );
}
