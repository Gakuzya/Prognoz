import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import DashboardHub from "@/components/dashboard/DashboardHub";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: "chat" | "simulator" | "report" }>;
}) {
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

  const params = searchParams ? await searchParams : undefined;
  const initialTab =
    params?.tab === "simulator"
      ? "simulator"
      : params?.tab === "report"
      ? "report"
      : "chat";

  return (
    <DashboardHub
      company={{
        name: company.name,
        industry: company.industry || undefined,
        currency: company.currency,
        avgCheck: Number(company.avgCheck),
        targetMargin: Number(company.targetMargin),
        ltv: Number(company.ltv),
      }}
      branches={branches}
      initialTab={initialTab}
    />
  );
}
