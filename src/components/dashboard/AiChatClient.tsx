"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  Key,
  Sliders,
  ArrowRight,
  Trash2,
  ExternalLink,
  Crown,
  Video,
  MessageSquare,
  ShieldAlert,
  Briefcase,
  BarChart3,
  Rocket,
} from "lucide-react";
import { formatMoney } from "./types";
import { StructuredPlanData, SPHERE_CATALOG } from "./planConverter";

export type AiAgentMode =
  | "full_360"
  | "creatives"
  | "funnel_scripts"
  | "competitors_swot"
  | "finance_capex";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  model?: string;
  createdAt: string;
  parsedData?: StructuredPlanData | null;
}

interface ProjectContext {
  industry: string;
  openingBudget: number | string;
  adBudget: number | string;
  avgCheck: number | string;
  currency: string;
  location: string;
}

interface AiChatClientProps {
  initialCompany?: {
    name?: string;
    industry?: string;
    currency?: string;
    avgCheck?: number;
  };
  onPlanGenerated?: (plan: StructuredPlanData) => void;
  onOpenCharts?: (plan?: StructuredPlanData) => void;
  onOpenPromotion?: (plan?: StructuredPlanData) => void;
  onResetProject?: () => void;
  activeProjectName?: string;
  externalPromptTrigger?: { prompt: string; mode?: AiAgentMode; timestamp: number } | null;
}

const AGENT_MODES: {
  id: AiAgentMode;
  label: string;
  shortDesc: string;
  icon: typeof Crown;
  promptPrefix: string;
}[] = [
  {
    id: "full_360",
    label: "1. Разбор Бизнеса 360°",
    shortDesc: "УТП + Трафик + Окупаемость",
    icon: Crown,
    promptPrefix: "Разработай полный комплексный бизнес-план 360°, стратегию продвижения, медиаплан и расчет окупаемости для сферы:",
  },
  {
    id: "creatives",
    label: "2. Креативы & Reels",
    shortDesc: "Сценарии роликов и офферы",
    icon: Video,
    promptPrefix: "Напиши 3 убойных рекламных креатива (сценарии Reels/TikTok, тексты для 2GIS и Google, офферы и лид-магниты) для сферы:",
  },
  {
    id: "funnel_scripts",
    label: "3. Воронка & Скрипты",
    shortDesc: "Продажи в WhatsApp и CRM",
    icon: MessageSquare,
    promptPrefix: "Построй воронку продаж и напиши пошаговые скрипты переписки в WhatsApp и закрытия возражений для сферы:",
  },
  {
    id: "competitors_swot",
    label: "4. Обход Конкурентов",
    shortDesc: "SWOT-анализ и захват рынка",
    icon: ShieldAlert,
    promptPrefix: "Проведи конкурентную разведку, SWOT-анализ и дай стратегию отстройки от конкурентов для сферы:",
  },
  {
    id: "finance_capex",
    label: "5. Смета CAPEX & ROI",
    shortDesc: "Куда вложить стартовый бюджет",
    icon: Briefcase,
    promptPrefix: "Рассчитай детальную инвестиционную смету открытия (CAPEX), точку безубыточности и окупаемость для сферы:",
  },
];

let idCounter = 0;
function createMsgId(prefix = "msg") {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

const DEFAULT_WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  content: `👑 **Добро пожаловать в ИИ-Штаб Управления и Продвижения Бизнеса AdForecast Sovereign AI!**

В вашем распоряжении **5 специализированных ИИ-директоров**, которые полностью оцифруют и упакуют ваш бизнес:
1. 👑 **ИИ-Архитектор Бизнеса**: позиционирование, УТП, сегменты ЦА и дорожная карта открытия.
2. 🎯 **ИИ-Директор по Трафику**: медиамикс (Instagram Reels, 2GIS, TikTok Ads, Google.kz, Kaspi), прогноз лидов и CAC.
3. 🎬 **ИИ-Креативный Продюсер**: готовые сценарии видеороликов, заголовки объявлений и триггерные офферы.
4. 🤝 **ИИ-Директор Продаж (CRO)**: воронка в WhatsApp, скрипты первого касания, дожим и возврат базы (LTV).
5. 💰 **ИИ-Финансовый Директор (CFO)**: смета открытия (CAPEX), точка безубыточности и 6 интерактивных графиков.

Напишите вашу задачу в свободной форме или выберите **Сферу бизнеса** и **Режим ИИ** ниже!`,
  createdAt: "2026-01-01T00:00:00.000Z",
  provider: "Sovereign Multi-Agent AI 3.0",
};

function extractStructuredData(text: string): StructuredPlanData | null {
  try {
    const match = text.match(/```json:adforecast_data\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
  } catch {
    return null;
  }
  return null;
}

export default function AiChatClient({
  initialCompany,
  onPlanGenerated,
  onOpenCharts,
  onOpenPromotion,
  onResetProject,
  externalPromptTrigger,
}: AiChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adforecast_chat_history");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return [DEFAULT_WELCOME_MSG];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAgentMode, setActiveAgentMode] = useState<AiAgentMode>("full_360");
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const [groqKey, setGroqKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adforecast_groq_key") || "";
    }
    return "";
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adforecast_chat_model") || "openai/gpt-oss-120b";
    }
    return "openai/gpt-oss-120b";
  });

  const [context, setContext] = useState<ProjectContext>({
    industry: initialCompany?.industry || "СТО / Автосервис и Детейлинг",
    openingBudget: 5000000,
    adBudget: 600000,
    avgCheck: initialCompany?.avgCheck || 42000,
    currency: initialCompany?.currency || "KZT",
    location: "Алматы, Казахстан",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<number>(0);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("adforecast_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Реакция на внешний триггер (например, переход с Первой страницы или из вкладки Продвижение)
  useEffect(() => {
    if (
      externalPromptTrigger &&
      externalPromptTrigger.timestamp > lastTriggerRef.current
    ) {
      lastTriggerRef.current = externalPromptTrigger.timestamp;
      if (externalPromptTrigger.mode) {
        setActiveAgentMode(externalPromptTrigger.mode);
      }
      handleSend(externalPromptTrigger.prompt, externalPromptTrigger.mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPromptTrigger]);

  const handleSaveKey = (key: string, model: string) => {
    setGroqKey(key);
    setSelectedModel(model);
    localStorage.setItem("adforecast_groq_key", key);
    localStorage.setItem("adforecast_chat_model", model);
    setIsKeyModalOpen(false);
  };

  const handleClearHistory = () => {
    if (confirm("Очистить историю диалога и сбросить параметры проекта?")) {
      localStorage.removeItem("adforecast_chat_history");
      setMessages([
        {
          id: createMsgId("reset"),
          role: "assistant",
          content:
            "Память очищена. Выберите сферу бизнеса или напишите вашу идею — я мгновенно рассчитаю стратегию, креативы и все 6 графиков!",
          createdAt: new Date().toISOString(),
        },
      ]);
      if (onResetProject) onResetProject();
    }
  };

  const handleSend = async (
    customPrompt?: string,
    overrideMode?: AiAgentMode,
    overrideContext?: Partial<ProjectContext>
  ) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const currentMode = overrideMode || activeAgentMode;
    const mergedContext = { ...context, ...overrideContext };

    const userMsg: Message = {
      id: createMsgId("user"),
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(groqKey ? { "x-groq-key": groqKey } : {}),
        },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          model: groqKey ? selectedModel : "free-ai",
          apiKey: groqKey,
          projectContext: {
            industry: mergedContext.industry,
            openingBudget: Number(mergedContext.openingBudget) || undefined,
            adBudget: Number(mergedContext.adBudget) || undefined,
            avgCheck: Number(mergedContext.avgCheck) || undefined,
            currency: mergedContext.currency,
            location: mergedContext.location,
            agentMode: currentMode,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Ошибка получения ответа от сервера");
      }

      const data = await res.json();
      const parsedData = extractStructuredData(data.content);

      if (parsedData && onPlanGenerated) {
        onPlanGenerated(parsedData);
      }

      const assistantMsg: Message = {
        id: createMsgId("ai"),
        role: "assistant",
        content: data.content,
        provider: data.provider,
        model: data.model,
        createdAt: new Date().toISOString(),
        parsedData,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: createMsgId("err"),
          role: "assistant",
          content: "⚠️ Ошибка связи с сервером ИИ. Пожалуйста, повторите запрос.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgentFunction = (modeObj: (typeof AGENT_MODES)[0]) => {
    setActiveAgentMode(modeObj.id);
    const promptText = `${modeObj.promptPrefix} «${context.industry}» (${context.location}). Бюджет на открытие: ${Number(context.openingBudget).toLocaleString("ru-KZ")} ${context.currency}, реклама: ${Number(context.adBudget).toLocaleString("ru-KZ")} ${context.currency}/мес, средний чек: ${Number(context.avgCheck).toLocaleString("ru-KZ")} ${context.currency}.`;
    handleSend(promptText, modeObj.id);
  };

  const handleSelectSphereQuick = (sphere: (typeof SPHERE_CATALOG)[0]) => {
    const updatedCtx: ProjectContext = {
      industry: sphere.name,
      openingBudget: sphere.defaultOpenBudget,
      adBudget: sphere.defaultAdBudget,
      avgCheck: sphere.avgCheck,
      currency: context.currency || "KZT",
      location: context.location || "Алматы, Казахстан",
    };
    setContext(updatedCtx);
    const prompt = `Запускаем бизнес в сфере «${sphere.name}» (${updatedCtx.location}). Стартовый капитал: ${sphere.defaultOpenBudget.toLocaleString("ru-KZ")} ₸, рекламный бюджет: ${sphere.defaultAdBudget.toLocaleString("ru-KZ")} ₸/мес, средний чек: ${sphere.avgCheck.toLocaleString("ru-KZ")} ₸. Сделай полный разбор продвижения и построй все графики!`;
    handleSend(prompt, activeAgentMode, updatedCtx);
  };

  return (
    <div className="flex flex-col gap-3.5 font-sans">
      {/* 1. ВЕРХНЯЯ ПАНЕЛЬ ИИ-ШТАБА С ВЫБОРОМ 5 ИИ-ФУНКЦИЙ */}
      <div className="rounded-2xl border border-amber-500/25 bg-[#101016] p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Мультиагентный ИИ-Терминал Обработки Бизнеса
                </h2>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                  5 AI-ДИРЕКТОРОВ
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Выберите нужную функцию ИИ ниже — система мгновенно перестроит стратегию и все 6 графиков
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-amber-500/40 hover:text-amber-300"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  groqKey ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span>{groqKey ? `Groq Cloud` : "Sovereign AI 3.0"}</span>
              <Key className="h-3.5 w-3.5 text-amber-400" />
            </button>

            <button
              type="button"
              onClick={() => setIsParamsOpen(!isParamsOpen)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                isParamsOpen
                  ? "border-amber-400 bg-amber-500/20 text-amber-300"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-amber-500/40"
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              <span>Параметры бизнеса</span>
            </button>

            <button
              type="button"
              onClick={handleClearHistory}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:border-rose-500/40 hover:text-rose-400"
              title="Очистить историю"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 5 КНОПОК СПЕЦИАЛИЗИРОВАННЫХ ИИ-ФУНКЦИЙ (В 1 клик запускают нужного ИИ-директора) */}
        <div className="mt-3.5">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-amber-400/90">
            Выберите режим работы ИИ (нажмите для мгновенной генерации по вашему бизнесу):
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {AGENT_MODES.map((m) => {
              const Icon = m.icon;
              const isActive = activeAgentMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleRunAgentFunction(m)}
                  className={`group flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all ${
                    isActive
                      ? "border-amber-400 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent text-white shadow-md shadow-amber-500/10"
                      : "border-white/10 bg-black/40 text-zinc-300 hover:border-amber-500/40 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white group-hover:text-amber-300">
                      {m.label}
                    </span>
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-amber-400" : "text-zinc-500 group-hover:text-amber-400"
                      }`}
                    />
                  </div>
                  <span className="mt-1 text-[10px] text-zinc-400">{m.shortDesc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Раскрывающаяся панель точной настройки параметров бизнеса */}
      {isParamsOpen && (
        <div className="rounded-2xl border border-amber-500/30 bg-[#12121a] p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Финансовый паспорт вашего проекта
            </span>
            <span className="text-[11px] text-zinc-400">
              Все 5 ИИ-агентов используют эти цифры для расчетов
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-zinc-400 font-medium mb-1">Сфера бизнеса / Ниша</label>
              <input
                type="text"
                value={context.industry}
                onChange={(e) => setContext({ ...context, industry: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 font-semibold text-white outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Капитал старта (₸)</label>
              <input
                type="number"
                value={context.openingBudget}
                onChange={(e) => setContext({ ...context, openingBudget: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 font-semibold text-white outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Реклама в мес (₸)</label>
              <input
                type="number"
                value={context.adBudget}
                onChange={(e) => setContext({ ...context, adBudget: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 font-semibold text-white outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Средний чек (₸)</label>
              <input
                type="number"
                value={context.avgCheck}
                onChange={(e) => setContext({ ...context, avgCheck: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 font-semibold text-white outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Город / Локация</label>
              <input
                type="text"
                value={context.location}
                onChange={(e) => setContext({ ...context, location: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 font-semibold text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Быстрый выбор из 8 готовых сфер бизнеса */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 shrink-0">
          Сферы бизнеса:
        </span>
        {SPHERE_CATALOG.map((sp) => (
          <button
            key={sp.id}
            type="button"
            disabled={loading}
            onClick={() => handleSelectSphereQuick(sp)}
            className={`flex items-center gap-1.5 shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
              context.industry === sp.name
                ? "border-amber-400 bg-amber-500/20 text-amber-200"
                : "border-white/10 bg-[#121218] text-zinc-300 hover:border-amber-500/40 hover:text-white"
            }`}
          >
            <span>{sp.icon}</span>
            <span>{sp.shortName}</span>
          </button>
        ))}
      </div>

      {/* Зона сообщений ИИ-чата */}
      <div className="h-[460px] overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0b10] p-4 sm:p-5 space-y-4 shadow-inner">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-4xl rounded-2xl p-4 sm:p-5 text-sm ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-semibold rounded-br-xs shadow-lg shadow-amber-500/10"
                  : "border border-amber-500/20 bg-[#13131b] text-zinc-100 rounded-bl-xs shadow-xl"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Crown className="h-3.5 w-3.5" />
                    <span>Стратегический Меморандум ИИ-Штаба</span>
                  </div>
                  {msg.provider && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                      {msg.model || msg.provider}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2 whitespace-pre-wrap leading-relaxed">
                {msg.content
                  .replace(/```json:adforecast_data[\s\S]*?```/g, "")
                  .trim()}
              </div>

              {/* Интерактивная карточка оцифрованного проекта в ответе ИИ */}
              {msg.parsedData && (
                <div className="mt-5 space-y-4 rounded-2xl border border-amber-500/30 bg-black/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      📊 Сводка оцифрованного проекта: {msg.parsedData.industry}
                    </span>
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 text-xs font-extrabold text-emerald-400">
                      Прогноз ROI +{msg.parsedData.estimatedRoi}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-[#14141c] p-3">
                      <span className="text-[10px] text-zinc-400 block">Безубыточность</span>
                      <p className="mt-0.5 font-extrabold text-white text-sm">
                        {msg.parsedData.breakEvenSales} продаж
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#14141c] p-3">
                      <span className="text-[10px] text-zinc-400 block">Прогноз выручки</span>
                      <p className="mt-0.5 font-extrabold text-amber-400 text-sm">
                        {formatMoney(msg.parsedData.estimatedRevenue || 0, msg.parsedData.currency)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#14141c] p-3">
                      <span className="text-[10px] text-zinc-400 block">Чистая прибыль</span>
                      <p className="mt-0.5 font-extrabold text-emerald-400 text-sm">
                        {formatMoney(msg.parsedData.estimatedProfit || 0, msg.parsedData.currency)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#14141c] p-3">
                      <span className="text-[10px] text-zinc-400 block">Рекламный бюджет</span>
                      <p className="mt-0.5 font-extrabold text-white text-sm">
                        {formatMoney(msg.parsedData.adBudget || 0, msg.parsedData.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Кнопки мгновенного перехода к 6 Графикам и к Продвижению */}
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => (onOpenCharts ? onOpenCharts(msg.parsedData || undefined) : null)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 px-4 py-2.5 text-xs font-extrabold text-black shadow-lg shadow-amber-500/20 transition hover:brightness-110 active:scale-95"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Открыть все 6 графиков («{msg.parsedData.industry}»)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    {onOpenPromotion && (
                      <button
                        type="button"
                        onClick={() => onOpenPromotion(msg.parsedData || undefined)}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20 active:scale-95"
                      >
                        <Rocket className="h-4 w-4" />
                        <span>Перейти к Креативам и Воронке продаж</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="mt-1 text-[10px] text-zinc-500 px-1">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex flex-col items-start">
            <div className="rounded-2xl border border-amber-500/30 bg-[#13131b] p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                <span className="text-xs font-bold text-amber-300">
                  ИИ-Директора рассчитывают юнит-экономику, медиаплан и графики...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода запроса */}
      <div className="rounded-2xl border border-amber-500/30 bg-[#111118] p-2 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Опишите ваш бизнес или вопрос (например: Хочу открыть кофейню в Астане, бюджет 4 млн ₸, как продвигать?)..."
            disabled={loading}
            className="flex-1 rounded-xl bg-transparent px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-11 px-5 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-xs font-extrabold text-black shadow-lg shadow-amber-500/20 transition hover:brightness-110 active:scale-95 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Рассчитать</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Модальное окно настройки внешнего API-ключа */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-[#12121a] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                  <Key className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-white">
                  Настройки ИИ-ядра (Groq / Sovereign AI)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Groq Cloud API Key (опционально)
                </label>
                <input
                  type="password"
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-400"
                />
                <p className="mt-1.5 text-[11px] text-zinc-400">
                  Ключ можно получить бесплатно на{" "}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-amber-400 font-semibold hover:underline"
                  >
                    console.groq.com
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Выбор языковой модели
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#181822] px-3 py-2 text-xs font-medium text-white outline-none focus:border-amber-400"
                >
                  <option value="openai/gpt-oss-120b">GPT-OSS 120B (Максимальный интеллект)</option>
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                  <option value="free-ai">Встроенный движок AdForecast Sovereign 3.0</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveKey("", "free-ai")}
                  className="rounded-xl border border-white/15 px-3 py-2 font-semibold text-zinc-300 hover:bg-white/5"
                >
                  Автономный режим
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveKey(groqKey, selectedModel)}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-4 py-2 font-bold text-black"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
