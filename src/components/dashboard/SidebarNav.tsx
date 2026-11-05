"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  Settings,
  Crown,
  MapPin,
  Globe,
  type LucideIcon,
} from "lucide-react";

const items: { href: string; label: string; icon: LucideIcon; badge?: string }[] = [
  { href: "/dashboard", label: "ИИ-Терминал & Графики", icon: Crown, badge: "PRO 3.0" },
  { href: "/dashboard/history", label: "Архив прогнозов", icon: History },
  { href: "/dashboard/branches", label: "Филиалы сети", icon: MapPin },
  { href: "/dashboard/settings", label: "Профиль бизнеса", icon: Settings },
  { href: "/", label: "Витрина (Страница 1)", icon: Globe },
];

export default function SidebarNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={horizontal ? "flex gap-1.5 overflow-x-auto pb-1" : "flex flex-col gap-1.5"}>
      {items.map(({ href, label, icon: Icon, badge }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : href === "/"
            ? pathname === "/"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 ${
              active
                ? "bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 ring-1 ring-amber-500/40 shadow-md shadow-amber-500/5"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon
                className={`h-4 w-4 transition-colors ${
                  active ? "text-amber-400" : "text-zinc-500 group-hover:text-amber-400"
                }`}
              />
              <span className="whitespace-nowrap">{label}</span>
            </div>

            {badge && (
              <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[9px] font-extrabold text-amber-300">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
