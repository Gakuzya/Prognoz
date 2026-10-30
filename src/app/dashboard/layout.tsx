import { redirect } from "next/navigation";
import { LineChart, LogOut } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import SidebarNav from "@/components/dashboard/SidebarNav";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

/**
 * Общий макет дашборда: боковая панель + шапка.
 * Серверный компонент: берёт пользователя из сессии Supabase и проверяет,
 * что профиль компании создан (иначе отправляет на онбординг).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
    select: { name: true },
  });
  if (!company) redirect("/onboarding");

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Боковая панель (от md и шире) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">
            <LineChart className="h-4 w-4" />
          </span>
          <span className="font-semibold text-slate-900">AdForecast</span>
        </div>
        <div className="flex-1 p-3">
          <SidebarNav />
        </div>
        <p className="truncate border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
          {company.name}
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Шапка */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">
              <LineChart className="h-4 w-4" />
            </span>
            <span className="font-semibold text-slate-900">AdForecast</span>
          </div>
          <p className="hidden text-sm text-slate-500 md:block">
            Предиктивная аналитика рекламных бюджетов
          </p>

          <div className="flex items-center gap-3">
            <span className="max-w-[200px] truncate text-sm text-slate-600">
              {user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                title="Выйти"
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        {/* Мобильная навигация */}
        <div className="border-b border-slate-200 bg-white px-3 py-2 md:hidden">
          <SidebarNav horizontal />
        </div>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
