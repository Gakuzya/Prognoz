"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Settings, Sparkles, MapPin, type LucideIcon } from "lucide-react";

const items: { href: string; label: string; icon: LucideIcon; badge?: string }[] = [
  { href: "/dashboard", label: "Новый прогноз", icon: Sparkles },
  { href: "/dashboard/history", label: "История", icon: History },
  { href: "/dashboard/branches", label: "Филиалы", icon: MapPin },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
];

/**
 * Навигация дашборда с поддержкой филиалов и активных состояний
 */
export default function SidebarNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={horizontal ? "flex gap-1 overflow-x-auto" : "flex flex-col gap-1.5"}>
      {items.map(({ href, label, icon: Icon, badge }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent font-semibold text-indigo-600 shadow-sm ring-1 ring-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon
                className={`h-4 w-4 transition-colors ${
                  active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span className="whitespace-nowrap">{label}</span>
            </div>

            {badge && (
              <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-500/20">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
