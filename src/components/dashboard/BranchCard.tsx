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
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-amber-500/25 bg-[#101016] p-5 shadow-xl transition-all duration-200 hover:border-amber-400">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white group-hover:text-amber-300 transition-colors">
                {branch.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                <Calendar className="h-3 w-3 text-amber-400" />
                <span>Подключен: {formattedDate}</span>
              </div>
            </div>
          </div>

          {!branch.id.startsWith("demo-") && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/15 hover:text-rose-400 transition-all"
              title="Удалить филиал"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/40 p-3.5 text-xs">
          <div>
            <span className="text-zinc-400">Кампаний привязано</span>
            <div className="mt-0.5 flex items-center gap-1.5 font-extrabold text-white">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>{branch._count.campaigns}</span>
            </div>
          </div>

          <div>
            <span className="text-zinc-400">Статус точки</span>
            <div className="mt-0.5 flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Активен</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
