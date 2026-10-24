import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import SimulatorClient from "@/components/dashboard/SimulatorClient";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Получаем профиль компании текущего пользователя
  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  });

  if (!company) {
    redirect("/onboarding");
  }

  // Получаем список филиалов компании для выбора в симуляторе
  const branches = await prisma.branch.findMany({
    where: { companyId: company.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Симулятор рекламных бюджетов
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Смоделируйте оптимальное распределение бюджета по каналам на основе машинного обучения и формулы убывающей отдачи.
        </p>
      </div>

      {/* Интерактивный симулятор (клиентский компонент) */}
      <SimulatorClient
        company={{
          currency: company.currency,
          avgCheck: Number(company.avgCheck),
          targetMargin: Number(company.targetMargin),
          ltv: Number(company.ltv),
        }}
        branches={branches}
      />
    </div>
  );
}
