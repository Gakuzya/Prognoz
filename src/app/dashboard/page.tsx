import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import DashboardHub, { DashboardTab } from "@/components/dashboard/DashboardHub";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  let companyData = {
    name: "ТОО «Sovereign Business»",
    industry: "СТО / Автосервис и Детейлинг",
    currency: "KZT",
    avgCheck: 42000,
    targetMargin: 48,
    ltv: 185000,
  };
  let branches: { id: string; name: string }[] = [
    { id: "demo-almaty", name: "Филиал Алматы (Центр)" },
    { id: "demo-astana", name: "Филиал Астана (Левый берег)" },
  ];

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

        const dbBranches = await prisma.branch.findMany({
          where: { companyId: company.id },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        if (dbBranches.length > 0) {
          branches = dbBranches;
        }
      }
    }
  } catch {
    // Используем эталонные параметры в демо-режиме
  }

  const params = searchParams ? await searchParams : undefined;
  const rawTab = params?.tab;
  const initialTab: DashboardTab =
    rawTab === "simulator"
      ? "simulator"
      : rawTab === "promotion"
      ? "promotion"
      : rawTab === "report"
      ? "report"
      : "chat";

  return (
    <DashboardHub
      company={companyData}
      branches={branches}
      initialTab={initialTab}
    />
  );
}
