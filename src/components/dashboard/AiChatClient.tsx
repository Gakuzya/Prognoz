"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { formatMoney } from "./types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  model?: string;
  createdAt: string;
  parsedData?: StructuredPlanData | null;
}

interface ChannelAllocation {
  channel: string;
  sharePct: number;
  budget: number;
  estimatedCac: number;
  expectedSales: number;
}

interface ActionTask {
  task: string;
  phase: string;
}

interface StructuredPlanData {
  industry?: string;
  openingBudget?: number;
  adBudget?: number;
  currency?: string;
  breakEvenSales?: number;
  estimatedRevenue?: number;
  estimatedProfit?: number;
  estimatedRoi?: number;
  channelAllocations?: ChannelAllocation[];
  actionChecklist?: ActionTask[];
}

interface ProjectContext {
  industry: string;
  openingBudget: number | string;
  adBudget: number | string;
  currency: string;
  location: string;
}

interface AiChatClientProps {
  initialCompany?: {
    name?: string;
    industry?: string;
    currency?: string;
  };
}

const TEMPLATES = [
  {
    title: "СТО / Автосервис",
    icon: "🚗",
    prompt:
      "Хочу открыть автосервис / СТО. Бюджет на открытие 800 000 руб, на рекламу 150 000 руб в месяц. Город 500k+ жителей. Распишите пошаговый запуск и рекламные каналы.",
    context: { industry: "СТО / Автосервис", open: 800000, ad: 150000, currency: "RUB", loc: "Город 500k+" },
  },
  {
    title: "Instagram-магазин одежды",
    icon: "👗",
    prompt:
      "Планирую запустить Instagram-магазин женской одежды. Бюджет на закупку и запуск 250 000 руб, на рекламу 60 000 руб в месяц. С каких связок и блогеров начать?",
    context: { industry: "Instagram-магазин", open: 250000, ad: 60000, currency: "RUB", loc: "Онлайн / РФ" },
  },
  {
    title: "Кофейня формата To-Go",
    icon: "☕",
    prompt:
      "Открываю небольшую кофейню to-go у метро. Бюджет на запуск 550 000 руб, на маркетинг и промо 70 000 руб. Как быстро привлечь первых 100 постоянных клиентов?",
    context: { industry: "Кофейня / Общепит", open: 550000, ad: 70000, currency: "RUB", loc: "У метро" },
  },
  {
    title: "B2B Услуги / Онлайн-школа",
    icon: "💻",
    prompt:
      "Запуск онлайн-школы по IT-профессиям. Бюджет на рекламу 200 000 руб в месяц, средний чек курса 45 000 руб. Нужен медиаплан и расчет окупаемости.",
    context: { industry: "Онлайн-школа / EdTech", open: 300000, ad: 200000, currency: "RUB", loc: "Онлайн" },
  },
];

let idCounter = 0;
function createMsgId(prefix = "msg") {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

const DEFAULT_WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  content: `👋 **Добро пожаловать в ИИ-Штаб запуска бизнеса и рекламы AdForecast!**

Я координирую команду из 3 специализированных ИИ-экспертов:
1. 🏗️ **Бизнес-Стратег**: разработает пошаговый план открытия, УТП и формат позиционирования.
2. 🎯 **Директор по трафику**: подберет самые окупаемые рекламные каналы под вашу сферу и рассчитает стоимость клиента (CAC).
3. 💰 **Финансовый Контролер**: рассчитает точку безубыточности (Break-Even) и ожидаемую прибыль.

Напишите вашу идею, например: **«Хочу открыть СТО с бюджетом 800 000 руб на открытие и 150 000 руб на рекламу»** или выберите один из готовых шаблонов ниже.`,
  createdAt: "2026-01-01T00:00:00.000Z",
  provider: "AdForecast Multi-AI",
};

/**
 * Извлекает структурированный JSON из ответа ассистента, если он там есть
 */
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

export default function AiChatClient({ initialCompany }: AiChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adforecast_chat_history");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Игнорируем
        }
      }
    }
    return [DEFAULT_WELCOME_MSG];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Настройки провайдера и ключа
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

  // Параметры проекта
  const [context, setContext] = useState<ProjectContext>({
    industry: initialCompany?.industry || "СТО / Автосервис",
    openingBudget: 800000,
    adBudget: 150000,
    currency: initialCompany?.currency || "RUB",
    location: "Москва",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Сохранение истории в localStorage при изменении
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("adforecast_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSaveKey = (key: string, model: string) => {
    setGroqKey(key);
    setSelectedModel(model);
    localStorage.setItem("adforecast_groq_key", key);
    localStorage.setItem("adforecast_chat_model", model);
    setIsKeyModalOpen(false);
  };

  const handleClearHistory = () => {
    if (confirm("Очистить историю диалога?")) {
      localStorage.removeItem("adforecast_chat_history");
      setMessages([
        {
          id: createMsgId("reset"),
          role: "assistant",
          content: "Диалог очищен. О каком проекте вы хотите поговорить?",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

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
            industry: context.industry,
            openingBudget: Number(context.openingBudget) || undefined,
            adBudget: Number(context.adBudget) || undefined,
            currency: context.currency,
            location: context.location,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Ошибка получения ответа от сервера");
      }

      const data = await res.json();
      const parsedData = extractStructuredData(data.content);

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
          content: "⚠️ Произошла ошибка связи с сервером ИИ. Пожалуйста, попробуйте еще раз.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (tpl: typeof TEMPLATES[0]) => {
    setContext({
      industry: tpl.context.industry,
      openingBudget: tpl.context.open,
      adBudget: tpl.context.ad,
      currency: tpl.context.currency,
      location: tpl.context.loc,
    });
    handleSend(tpl.prompt);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col gap-3 font-sans">
      {/* Шапка чата с индикатором статуса и кнопками настройки */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-md shadow-indigo-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                ИИ-Консультант по запуску проектов
              </h1>
              <span className="rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20">
                Multi-AI v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Координирует работу Бизнес-Стратега, Медиапланера и Финконтролера
            </p>
          </div>
        </div>

        {/* Индикатор модели и кнопки */}
        <div className="flex items-center gap-2">
          {/* Индикатор текущего провайдера */}
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            title="Настроить Groq API Key или выбрать модель"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                groqKey ? "bg-emerald-500 animate-pulse" : "bg-indigo-500"
              }`}
            />
            <span>{groqKey ? `Groq: ${selectedModel.split("-")[0]}` : "Бесплатный ИИ"}</span>
            <Key className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Кнопка открытия параметров проекта */}
          <button
            type="button"
            onClick={() => setIsParamsOpen(!isParamsOpen)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isParamsOpen
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Параметры</span>
          </button>

          {/* Очистить диалог */}
          <button
            type="button"
            onClick={handleClearHistory}
            className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            title="Очистить историю"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Панель параметров проекта (выдвижная или раскрывающаяся) */}
      {isParamsOpen && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm backdrop-blur-xs">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
              Экономический контекст проекта
            </span>
            <span className="text-[11px] text-indigo-600">
              Эти данные автоматически учитываются всеми 3 ИИ-агентами
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Сфера / Ниша</label>
              <input
                type="text"
                value={context.industry}
                onChange={(e) => setContext({ ...context, industry: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Запуск (CAPEX)</label>
              <input
                type="number"
                value={context.openingBudget}
                onChange={(e) => setContext({ ...context, openingBudget: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Реклама в месяц</label>
              <input
                type="number"
                value={context.adBudget}
                onChange={(e) => setContext({ ...context, adBudget: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Город / Гео</label>
              <input
                type="text"
                value={context.location}
                onChange={(e) => setContext({ ...context, location: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Валюта</label>
              <select
                value={context.currency}
                onChange={(e) => setContext({ ...context, currency: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-900 outline-none focus:border-indigo-500"
              >
                <option value="RUB">RUB (₽)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="KZT">KZT (₸)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Основная зона сообщений */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-inner backdrop-blur-md space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* Пузырь сообщения */}
            <div
              className={`max-w-3xl rounded-2xl p-4 shadow-sm text-sm ${
                msg.role === "user"
                  ? "bg-slate-900 text-white rounded-br-xs"
                  : "bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs"
              }`}
            >
              {/* Бейдж ИИ-агентов */}
              {msg.role === "assistant" && (
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Сводный отчет команды ИИ-агентов</span>
                  </div>
                  {msg.provider && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      {msg.model || msg.provider}
                    </span>
                  )}
                </div>
              )}

              {/* Текст сообщения с форматированием заголовков и списков */}
              <div className="space-y-2 whitespace-pre-wrap leading-relaxed">
                {msg.content
                  .replace(/```json:adforecast_data[\s\S]*?```/g, "")
                  .trim()}
              </div>

              {/* Визуальный блок результатов (если ИИ вернул структурированные данные) */}
              {msg.parsedData && (
                <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      📊 Интерактивная сводка проекта
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      ROI +{msg.parsedData.estimatedRoi}%
                    </span>
                  </div>

                  {/* 4 Карточки KPI */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
                      <span className="text-[10px] text-slate-400 block">Точка безубыточности</span>
                      <p className="mt-0.5 font-bold text-slate-900 text-sm">
                        {msg.parsedData.breakEvenSales} клиентов
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
                      <span className="text-[10px] text-slate-400 block">Прогноз выручки</span>
                      <p className="mt-0.5 font-bold text-indigo-600 text-sm">
                        {formatMoney(msg.parsedData.estimatedRevenue || 0, msg.parsedData.currency)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
                      <span className="text-[10px] text-slate-400 block">Чистая прибыль</span>
                      <p className="mt-0.5 font-bold text-emerald-600 text-sm">
                        {formatMoney(msg.parsedData.estimatedProfit || 0, msg.parsedData.currency)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
                      <span className="text-[10px] text-slate-400 block">Маркетинг план</span>
                      <p className="mt-0.5 font-bold text-purple-600 text-sm">
                        {formatMoney(msg.parsedData.adBudget || 0, msg.parsedData.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Сплит рекламных каналов */}
                  {msg.parsedData.channelAllocations && msg.parsedData.channelAllocations.length > 0 && (
                    <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                      <span className="text-[11px] font-semibold text-slate-700 block">
                        Распределение рекламного бюджета по источникам:
                      </span>
                      <div className="space-y-1.5">
                        {msg.parsedData.channelAllocations.map((ch, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-slate-800">{ch.channel}</span>
                              <span className="font-semibold text-slate-900">
                                {ch.sharePct}% (
                                {formatMoney(ch.budget, msg.parsedData?.currency)})
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${ch.sharePct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Кнопка перехода в симулятор с параметрами */}
                  <div className="pt-1">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:shadow-indigo-500/35 active:scale-95"
                    >
                      <span>Открыть детальный медиаплан в симуляторе AdForecast</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <span className="mt-1 text-[10px] text-slate-400 px-1">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}

        {/* Анимация мышления мультиагентной системы */}
        {loading && (
          <div className="flex flex-col items-start space-y-2">
            <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-950">
                  Мультиагентная система координирует запуск...
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1">
                  🏗️ Стратег: концепция и УТП
                </span>
                <span className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1">
                  🎯 Медиапланер: аудит каналов
                </span>
                <span className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1">
                  💰 Финконтролер: окупаемость
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Шаблоны быстрых запросов (Quick Prompts) */}
      {messages.length <= 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-medium text-slate-400 shrink-0">Популярное:</span>
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectTemplate(tpl)}
              className="flex items-center gap-1.5 shrink-0 rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:border-indigo-400 hover:text-indigo-600 active:scale-95"
            >
              <span>{tpl.icon}</span>
              <span>{tpl.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Поле ввода сообщения */}
      <div className="relative rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-md shadow-slate-200/50">
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
            placeholder="Например: Хочу открыть СТО / магазин в Инстаграм, бюджет 300 000 руб..."
            disabled={loading}
            className="flex-1 rounded-xl bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-95 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>

      {/* Модальное окно настройки Groq API Key */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Key className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Настройки Groq Cloud API
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Groq API Key (gsk_...)
                </label>
                <input
                  type="password"
                  placeholder="Вставьте ваш gsk_ ключ"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Бесплатный ключ можно создать за 10 секунд на{" "}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-indigo-600 font-semibold hover:underline"
                  >
                    console.groq.com
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  . Без привязки банковской карты!
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Модель нейросети
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                >
                  <option value="openai/gpt-oss-120b">
                    GPT-OSS 120B (Флагман Groq, максимальный интеллект)
                  </option>
                  <option value="openai/gpt-oss-20b">
                    GPT-OSS 20B (Сверхбыстрая скорость ~800 токенов/сек)
                  </option>
                  <option value="qwen/qwen3.8-27b">
                    Qwen 3.8 27B (Alibaba Cloud)
                  </option>
                  <option value="free-ai">
                    Бесплатный режим (Без API-ключа)
                  </option>
                </select>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-[11px] text-emerald-900 leading-relaxed">
                ✅ Если ключ не указан, система автоматически использует бесплатный ИИ-сервер и локальный стратегический движок AdForecast. Никаких сбоев!
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveKey("", "free-ai")}
                  className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Сбросить (Бесплатный режим)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveKey(groqKey, selectedModel)}
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
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
