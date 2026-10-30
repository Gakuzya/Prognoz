import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import CreateBranchModal from "@/components/dashboard/CreateBranchModal";
import BranchCard from "@/components/dashboard/BranchCard";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  });

  if (!company) redirect("/onboarding");

  // Загружаем список всех филиалов компании с подсчетом связанных кампаний
  const branches = await prisma.branch.findMany({
    where: { companyId: company.id },
    include: {
      _count: {
        select: { campaigns: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Шапка страницы */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Филиалы и локации
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              {branches.length} {branches.length === 1 ? "филиал" : "филиалов"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Управляйте рекламными бюджетами конкретных филиалов, франшиз или городов вашей сети.
          </p>
        </div>

        <CreateBranchModal />
      </div>

      {/* Список филиалов или пустое состояние */}
      {branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-sm backdrop-blur-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
            <Building2 className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            Филиалы еще не добавлены
          </h3>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
            Добавьте филиалы вашей сети (например, «Алматы Центр», «Астана Левый берег»), чтобы сегментировать прогнозы и рекламные бюджеты по локациям.
          </p>
          <div className="mt-5">
            <CreateBranchModal />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      )}
    </div>
  );
}
