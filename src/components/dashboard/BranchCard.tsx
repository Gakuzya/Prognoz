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
    if (confirm(`Вы уверены, что хотите удалить филиал "${branch.name}"?`)) {
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
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 text-indigo-600 ring-1 ring-indigo-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {branch.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="h-3 w-3" />
                <span>Создан {formattedDate}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition-all duration-150 disabled:opacity-50"
            title="Удалить филиал"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Статистика по филиалу */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/70 p-3 text-xs">
          <div>
            <span className="text-slate-400">Кампаний привязано</span>
            <div className="mt-0.5 flex items-center gap-1.5 font-bold text-slate-800">
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              <span>{branch._count.campaigns}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400">Статус филиала</span>
            <div className="mt-0.5 flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Активен</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
