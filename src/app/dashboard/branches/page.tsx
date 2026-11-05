import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";
import CreateBranchModal from "@/components/dashboard/CreateBranchModal";
import BranchCard from "@/components/dashboard/BranchCard";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  let branches: {
    id: string;
    name: string;
    createdAt: Date;
    _count: { campaigns: number };
  }[] = [
    {
      id: "demo-1",
      name: "Филиал Алматы (пр. Аль-Фараби / Достык)",
      createdAt: new Date("2026-01-15T10:00:00Z"),
      _count: { campaigns: 4 },
    },
    {
      id: "demo-2",
      name: "Филиал Астана (Левый берег / Есиль)",
      createdAt: new Date("2026-02-10T10:00:00Z"),
      _count: { campaigns: 3 },
    },
    {
      id: "demo-3",
      name: "Филиал Шымкент (Центральный)",
      createdAt: new Date("2026-03-05T10:00:00Z"),
      _count: { campaigns: 2 },
    },
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
        const dbBranches = await prisma.branch.findMany({
          where: { companyId: company.id },
          include: {
            _count: {
              select: { campaigns: true },
            },
          },
          orderBy: { createdAt: "asc" },
        });
        if (dbBranches.length > 0) {
          branches = dbBranches;
        }
      }
    }
  } catch {
    // Используем демонстрационные филиалы
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#1F3A33]">
            Масштабирование бизнеса
          </span>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-[#1C242B] sm:text-2xl">
              Филиалы и региональная сеть
            </h1>
            <span className="rounded-full border border-[#D5DFDA] bg-[#EAF0ED] px-3 py-0.5 text-xs font-extrabold text-[#1F3A33]">
              {branches.length} активных точек
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5C6460]">
            Управляйте рекламными бюджетами конкретных филиалов, франшиз или городов без каннибализации трафика.
          </p>
        </div>

        <CreateBranchModal />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <BranchCard key={branch.id} branch={branch} />
        ))}
      </div>
    </div>
  );
}
