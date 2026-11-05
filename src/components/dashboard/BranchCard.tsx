"use client";

import { useTransition } from "react";
import { Building2, Calendar, Trash2, Layers, Loader2 } from "lucide-react";
import { deleteBranch } from "@/app/dashboard/branches/actions";

interface BranchCardProps {
  branch: {
    id: string;
    name: string;
    createdAt: Date;
    _count: {
      campaigns: number;
    };
  };
}

export default function BranchCard({ branch }: BranchCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Удалить филиал "${branch.name}"?`)) {
      startTransition(async () => {
        await deleteBranch(branch.id);
      });
    }
  };

  const formattedDate = new Date(branch.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E2DDD3] bg-white p-5 nordic-shadow transition-all duration-200 hover:border-[#1F3A33]/40">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0ED] text-[#1F3A33]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1C242B] group-hover:text-[#1F3A33] transition-colors">
                {branch.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#5C6460]">
                <Calendar className="h-3 w-3 text-[#1F3A33]" />
                <span>Подключен: {formattedDate}</span>
              </div>
            </div>
          </div>

          {!branch.id.startsWith("demo-") && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg p-1.5 text-[#7A827E] hover:bg-[#FAF2EE] hover:text-[#B85D3B] transition-all"
              title="Удалить филиал"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-3.5 text-xs">
          <div>
            <span className="text-[#7A827E]">Кампаний привязано</span>
            <div className="mt-0.5 flex items-center gap-1.5 font-extrabold text-[#1C242B]">
              <Layers className="h-3.5 w-3.5 text-[#1F3A33]" />
              <span>{branch._count.campaigns}</span>
            </div>
          </div>

          <div>
            <span className="text-[#7A827E]">Статус точки</span>
            <div className="mt-0.5 flex items-center gap-1.5 text-[#1F3A33] font-bold">
              <span className="h-2 w-2 rounded-full bg-[#1F3A33]" />
              <span>Активен</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
