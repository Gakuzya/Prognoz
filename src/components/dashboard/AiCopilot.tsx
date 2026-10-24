"use client";

import { useState } from "react";
import {
  Bot,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";

interface AiCopilotProps {
  onApplyAdvice?: () => void;
  customTip?: string;
}

export default function AiCopilot({ onApplyAdvice, customTip }: AiCopilotProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [applied, setApplied] = useState(false);

  const defaultText =
    customTip ||
    "Привет! Я твой ИИ-маркетолог. Я проанализировал твои данные и советую перенести 20% бюджета в Google Ads, чтобы снизить стоимость клиента.";

  const handleApply = () => {
    setApplied(true);
    if (onApplyAdvice) onApplyAdvice();
    setTimeout(() => setApplied(false), 3000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white/90 via-indigo-50/50 to-purple-50/60 p-4 shadow-lg shadow-indigo-500/5 backdrop-blur-md transition-all duration-300">
      {/* Фоновое свечение (Glow effect) */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-transparent blur-2xl" />

      {/* Верхняя строка виджета */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30">
            <Bot className="h-4 w-4" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-white"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                AdForecast Copilot
              </span>
              <span className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-1.5 py-0.2 text-[9px] font-bold text-white shadow-xs">
                PRO AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Автономный анализ эффективности</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1 text-slate-400 hover:bg-white/60 hover:text-slate-600 transition"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Раскрывающийся контент */}
      {isOpen && (
        <div className="mt-3.5 space-y-3">
          <div className="relative rounded-xl border border-indigo-100/80 bg-white/80 p-3 text-xs leading-relaxed text-slate-700 shadow-xs backdrop-blur-xs">
            <p>{defaultText}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={applied}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:bg-emerald-600"
            >
              {applied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Совет применен!
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Применить рекомендацию
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-slate-200 bg-white/60 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-800 transition"
            >
              Скрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
