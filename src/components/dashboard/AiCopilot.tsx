"use client";

import { useState } from "react";
import {
  Compass,
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
    <div className="relative overflow-hidden rounded-2xl border border-[#D5DFDA] bg-[#EAF0ED]/70 p-4 nordic-shadow transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#1F3A33] text-white shadow-sm">
            <Compass className="h-4 w-4" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4A6B5D] opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1F3A33] ring-1 ring-white"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#1C242B]">
                Nordic AI Copilot
              </span>
              <span className="rounded-full border border-[#D5DFDA] bg-white px-2 py-0.5 text-[9px] font-bold text-[#1F3A33]">
                AUTO-OPTIMIZER
              </span>
            </div>
            <p className="text-[11px] text-[#5C6460]">
              Нейросетевой контроль окупаемости в реальном времени
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1.5 text-[#5C6460] hover:bg-white/60 hover:text-[#1C242B] transition"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3.5 space-y-3">
          <div className="rounded-xl border border-[#D5DFDA] bg-white p-3 text-xs leading-relaxed text-[#1C242B]">
            <p>{defaultText}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={applied}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1F3A33] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#162B25] disabled:bg-[#4A6B5D]"
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
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D5DFDA] bg-white px-3 py-2 text-xs font-bold text-[#1F3A33] hover:bg-[#FBF9F5] transition"
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
