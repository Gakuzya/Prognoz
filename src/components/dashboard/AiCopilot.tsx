"use client";

import { useState } from "react";
import {
  Crown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Bot,
} from "lucide-react";

interface AiCopilotProps {
  onApplyAdvice?: () => void;
  onOpenChat?: () => void;
  customTip?: string;
  activeIndustry?: string;
}

export default function AiCopilot({
  onApplyAdvice,
  onOpenChat,
  customTip,
  activeIndustry,
}: AiCopilotProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [applied, setApplied] = useState(false);

  const defaultText =
    customTip ||
    `ИИ-алгоритм проанализировал сферу «${activeIndustry || "Бизнес в РК"}» и выявил резерв снижения стоимости клиента (CAC) на 18% за счет оптимизации связки 2GIS + Reels и подключения быстрых скриптов в WhatsApp.`;

  const handleApply = () => {
    setApplied(true);
    if (onApplyAdvice) onApplyAdvice();
    setTimeout(() => setApplied(false), 3000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#14141d] via-[#101017] to-[#1a1508] p-4 shadow-xl transition-all duration-300">
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-500/15 blur-2xl" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-black shadow-md shadow-amber-500/25">
            <Crown className="h-4 w-4" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-black"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                Sovereign AI Copilot
              </span>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                AUTO-OPTIMIZER
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Нейросетевой контроль окупаемости в реальном времени
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-amber-300 transition"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3.5 space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-zinc-200">
            <p>{defaultText}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={applied}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 px-3.5 py-2 text-xs font-extrabold text-black shadow-md shadow-amber-500/20 transition hover:brightness-110 disabled:from-emerald-500 disabled:to-emerald-600 disabled:text-black"
            >
              {applied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  ИИ-оптимизация применена!
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Оптимизировать CAC (-18%) и пересчитать
                </>
              )}
            </button>

            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-white/5 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/15 transition"
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Задать вопрос ИИ-Штабу</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
