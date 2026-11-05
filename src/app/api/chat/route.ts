import { NextResponse } from "next/server";
import { resolveSphereBenchmark } from "@/components/dashboard/planConverter";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ProjectContext {
  industry?: string;
  openingBudget?: number;
  adBudget?: number;
  avgCheck?: number;
  targetMargin?: number;
  ltv?: number;
  currency?: string;
  location?: string;
  agentMode?: "full_360" | "creatives" | "funnel_scripts" | "competitors_swot" | "finance_capex";
}

interface RequestBody {
  messages: ChatMessage[];
  model?: string;
  apiKey?: string;
  projectContext?: ProjectContext;
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

function buildSystemPrompt(context?: ProjectContext) {
  const mode = context?.agentMode || "full_360";
  const modeInstruction =
    mode === "creatives"
      ? "Сделай особый фокус на ГЕНЕРАЦИИ РЕКЛАМНЫХ КРЕАТИВОВ, сценариев для Instagram Reels / TikTok (посекундно), заголовков для 2GIS и Google.kz, а также триггерных офферов и лид-магнитов."
      : mode === "funnel_scripts"
      ? "Сделай особый фокус на ВОРОНКЕ ПРОДАЖ И СКРИПТАХ ПЕРЕПИСКИ В WHATSAPP / ЗВОНКАХ: распиши этапы касаний, обработку возражений («дорого», «я подумаю»), дожим и механику возврата клиентов (LTV)."
      : mode === "competitors_swot"
      ? "Сделай особый фокус на КОНКУРЕНТНОЙ РАЗВЕДКЕ, SWOT-АНАЛИЗЕ и отстройке: разбери слабые места конкурентов в этой сфере и дай стратегию захвата доли рынка."
      : mode === "finance_capex"
      ? "Сделай особый фокус на ФИНАНСОВОЙ МОДЕЛИ, СМЕТЕ ОТКРЫТИЯ (CAPEX), ежемесячных расходах (OPEX), точке безубыточности и помесячной окупаемости за 6 месяцев."
      : "Выдай ПОЛНЫЙ КОМПЛЕКСНЫЙ РАЗБОР БИЗНЕСА 360° от лица всех 5 ИИ-экспертов.";

  const contextSnippet = context
    ? `
ДАННЫЕ АКТИВНОГО БИЗНЕС-ПРОЕКТА:
- Сфера / Ниша: ${context.industry || "Определи из сообщения пользователя"}
- Город / Локация: ${context.location || "Казахстан (Алматы / Астана)"}
- Инвестиции в открытие (CAPEX): ${context.openingBudget ? `${context.openingBudget} ${context.currency || "KZT"}` : "По эталону ниши"}
- Рекламный бюджет в месяц: ${context.adBudget ? `${context.adBudget} ${context.currency || "KZT"}` : "По эталону ниши"}
- Средний чек: ${context.avgCheck ? `${context.avgCheck} ${context.currency || "KZT"}` : "По эталону ниши"}
- Режим ИИ-задачи: ${modeInstruction}
`
    : "";

  return `Ты — флагманская мультиагентная ИИ-система управления и продвижения бизнеса AdForecast Sovereign AI.
Основная расчетная валюта — Казахстанский тенге (KZT, ₸).
В твоем штабе работают 5 профильных ИИ-директоров:
1. 👑 **ИИ-Архитектор Бизнеса**: позиционирование, УТП, целевая аудитория и дорожная карта запуска.
2. 🎯 **ИИ-Директор по Трафику (Media Mix)**: распределение бюджета между Instagram Reels/Meta, 2GIS, TikTok Ads, Google.kz, Kaspi Магазином, прогноз CPL и CAC.
3. 🎬 **ИИ-Креативный Продюсер**: готовые сценарии видео Reels/TikTok, тексты объявлений и лид-магниты.
4. 🤝 **ИИ-Директор Отдела Продаж (CRO & CRM)**: воронка в WhatsApp, скрипты первого контакта, обработка возражений и рост LTV.
5. 💰 **ИИ-Финансовый Директор (CFO)**: смета CAPEX, точка безубыточности (Break-Even), чистая прибыль и ROI.

${contextSnippet}

ПРАВИЛА ОТВЕТА:
- Пиши максимально конкретно, с цифрами в тенге (₸), готовыми формулировками офферов и скриптов.
- В конце ответа ОБЯЗАТЕЛЬНО прикрепи JSON-блок для построения 6 интерактивных графиков:
\`\`\`json:adforecast_data
{
  "industry": "Название сферы бизнеса",
  "location": "Алматы, Казахстан",
  "openingBudget": 5000000,
  "adBudget": 600000,
  "avgCheck": 42000,
  "targetMargin": 48,
  "ltv": 185000,
  "currency": "KZT",
  "breakEvenSales": 30,
  "estimatedRevenue": 3650000,
  "estimatedProfit": 1152000,
  "estimatedRoi": 192,
  "positioningUsp": "Уникальное торговое предложение бизнеса",
  "channelAllocations": [
    { "channel": "2GIS (Гео-приоритет РК)", "sharePct": 42, "budget": 252000, "estimatedCac": 5800, "expectedSales": 43 },
    { "channel": "Instagram Reels & Lead Ads", "sharePct": 38, "budget": 228000, "estimatedCac": 7400, "expectedSales": 31 },
    { "channel": "Google.kz (Горячий поиск)", "sharePct": 20, "budget": 120000, "estimatedCac": 9200, "expectedSales": 13 }
  ],
  "actionChecklist": [
    { "task": "Упаковать профиль в 2GIS и Instagram с оффером первого визита", "phase": "Неделя 1" },
    { "task": "Запустить 3 креатива Reels и лид-форму на WhatsApp", "phase": "Неделя 2" },
    { "task": "Масштабировать связку-лидера и пройти точку безубыточности", "phase": "Неделя 3" },
    { "task": "Запустить ретаргетинг и базу повторных продаж (LTV)", "phase": "Неделя 4" }
  ]
}
\`\`\``;
}

/**
 * Интеллектуальный генератор полного разбора бизнеса и стратегии продвижения
 * (адаптируется под любую сферу, бюджет, локацию и выбранный режим ИИ-агента)
 */
function generateSovereignStrategy(userPrompt: string, context?: ProjectContext) {
  // Определяем сферу либо из текста запроса, либо из контекста
  const combinedQuery = `${userPrompt} ${context?.industry || ""}`;
  const sphere = resolveSphereBenchmark(combinedQuery);

  // Если пользователь явно назвал свою нишу в запросе, используем красивое имя
  const industry =
    sphere.id !== "custom"
      ? sphere.name
      : context?.industry && context.industry.trim()
      ? context.industry.trim()
      : sphere.name;

  const currency = context?.currency || "KZT";
  const location = context?.location || "Алматы / Астана, Казахстан";
  const openBudget = Number(context?.openingBudget) > 0 ? Number(context?.openingBudget) : sphere.defaultOpenBudget;
  const adBudget = Number(context?.adBudget) > 0 ? Number(context?.adBudget) : sphere.defaultAdBudget;
  const avgCheck = Number(context?.avgCheck) > 0 ? Number(context?.avgCheck) : sphere.avgCheck;
  const marginPct = Number(context?.targetMargin) > 0 ? Number(context?.targetMargin) : sphere.marginPct;
  const ltv = Number(context?.ltv) > 0 ? Number(context?.ltv) : sphere.ltv;
  const mode = context?.agentMode || "full_360";

  const channelAllocations = sphere.channels.map((ch) => {
    const budget = Math.round((adBudget * ch.sharePct) / 100);
    const sales = Math.max(1, Math.round(budget / ch.cac));
    return {
      channel: ch.name,
      sharePct: ch.sharePct,
      budget,
      estimatedCac: ch.cac,
      expectedSales: sales,
      reason: ch.reason,
    };
  });

  const totalSales = channelAllocations.reduce((s, c) => s + c.expectedSales, 0);
  const revenue = totalSales * avgCheck;
  const profit = Math.round(revenue * (marginPct / 100) - adBudget);
  const roi = Math.round((profit / Math.max(1, adBudget)) * 100);
  const breakEven = Math.max(1, Math.ceil(adBudget / (avgCheck * (marginPct / 100))));
  const paybackMonths = profit > 0 ? (openBudget / (profit * 1.2)).toFixed(1) : "8.5";

  const jsonBlock = `\`\`\`json:adforecast_data
${JSON.stringify(
  {
    industry,
    location,
    openingBudget: openBudget,
    adBudget,
    avgCheck,
    targetMargin: marginPct,
    ltv,
    currency,
    breakEvenSales: breakEven,
    estimatedRevenue: revenue,
    estimatedProfit: profit,
    estimatedRoi: roi,
    positioningUsp: sphere.usp,
    channelAllocations: channelAllocations.map((c) => ({
      channel: c.channel,
      sharePct: c.sharePct,
      budget: c.budget,
      estimatedCac: c.estimatedCac,
      expectedSales: c.expectedSales,
    })),
    actionChecklist: [
      { task: `Упаковать УТП «${industry}» в Instagram, 2GIS и WhatsApp Business`, phase: "Неделя 1" },
      { task: "Запустить 3 видео-креатива Reels/TikTok и поисковые кампании", phase: "Неделя 2" },
      { task: `Пройти точку безубыточности (${breakEven} клиентов) и масштабировать лидера`, phase: "Неделя 3" },
      { task: "Внедрить скрипт дожима и возврата базы для роста LTV", phase: "Неделя 4" },
    ],
  },
  null,
  2
)}
\`\`\``;

  if (mode === "creatives") {
    return `### 🎬 ИИ-Креативный Продюсер: Готовые рекламные связки и офферы
**Сфера продвижения:** ${industry} (${location})  
**Главное УТП:** *${sphere.usp}*

${sphere.creatives
  .map(
    (cr, i) => `#### ${i + 1}. Канал: ${cr.channel} (${cr.format})
- **Заголовок (Headline):** «${cr.headline}»
- **Хук первых 3 секунд:** *${cr.hook}*
- **Оффер / Лид-магнит:** **${cr.offer}**
- **Призыв к действию (CTA):** ${cr.cta}
- **Прогнозный CTR:** \`${cr.expectedCtr}\``
  )
  .join("\n\n")}

---
#### 💡 Секрет высокой конверсии в этой нише:
1. Показывайте **живой процесс и результат** в первые 2.5 секунды ролика без долгих заставок.
2. Всегда выносите **конкретную выгоду в тенге (₸) или рассрочку Kaspi 0-0-12** прямо на плашку в видео.
3. Ведите трафик на **WhatsApp с предзаполненным сообщением**, чтобы менеджер сразу видел, с какого креатива пришел лид.

${jsonBlock}`;
  }

  if (mode === "funnel_scripts") {
    return `### 🤝 ИИ-Директор Отдела Продаж: Воронка и Скрипты Закрытия Сделок
**Сфера:** ${industry} | **Средний чек:** ${avgCheck.toLocaleString("ru-KZ")} ${currency} | **LTV клиента:** ${ltv.toLocaleString("ru-KZ")} ${currency}

#### Пошаговый алгоритм обработки заявок (WhatsApp & Звонки):
${sphere.scripts
  .map(
    (s) => `**${s.step}** *(Тайминг: ${s.timing})*
> 💬 **Речевой модуль:** ${s.script}
- 🎯 *Цель этапа:* ${s.goal}`
  )
  .join("\n\n")}

---
#### 🛡️ Отработка топ-2 возражений в сфере «${industry}»:
- **Возражение «Я подумаю / Сравню цены»:**  
  *«Понимаю вас! Давайте я прямо сейчас зафиксирую за вашим номером телефона акционный бонус (действует 48 часов) и пришлю примеры наших работ в WhatsApp, чтобы вы приняли взвешенное решение без потери скидки. Договорились?»*
- **Возражение «Дорого»:**  
  *«Именно поэтому 70% наших клиентов оформляют через рассрочку Kaspi 0-0-12 без переплат — это всего ${Math.round(avgCheck / 12).toLocaleString("ru-KZ")} ${currency} в месяц, при этом вы сразу получаете полную гарантию по договору!»*

${jsonBlock}`;
  }

  if (mode === "competitors_swot") {
    return `### 🛡️ ИИ-Конкурентная Разведка & SWOT-Матрица
**Сфера:** ${industry} (${location})

#### 1. Главные уязвимости 85% конкурентов на рынке:
${sphere.pains.map((p) => `- ❌ **Боль рынка:** ${p}`).join("\n")}

#### 2. Ваша стратегия доминирования (Отстройка от конкурентов):
${sphere.competitorEdge.map((e) => `- ✅ **Преимущество:** ${e}`).join("\n")}

#### 3. Триггеры мгновенного перехвата клиентов:
${sphere.triggers.map((t) => `- 🔥 ${t}`).join("\n")}

#### 4. Рекомендация по захвату локального рынка:
Сфокусируйте **${channelAllocations[0].sharePct}% бюджета (${channelAllocations[0].budget.toLocaleString("ru-KZ")} ${currency})** на канале **${channelAllocations[0].channel}**, параллельно догоняя всю базу ретаргетингом с видео-отзывами реальных клиентов.

${jsonBlock}`;
  }

  if (mode === "finance_capex") {
    return `### 💰 ИИ-Финансовый Директор (CFO): Инвестиционная Смета и Юнит-Экономика
**Сфера:** ${industry} | **Стартовый капитал (CAPEX):** ${openBudget.toLocaleString("ru-KZ")} ${currency}

#### 1. Распределение стартового бюджета (CAPEX — ${openBudget.toLocaleString("ru-KZ")} ${currency}):
${sphere.capexShares
  .map(
    (c) =>
      `- **${c.category}** — **${c.sharePct}% (${Math.round((openBudget * c.sharePct) / 100).toLocaleString("ru-KZ")} ${currency})**  \n  *${c.description}*`
  )
  .join("\n")}

#### 2. Ежемесячная юнит-экономика продвижения:
- **Рекламный бюджет (OPEX маркетинг):** ${adBudget.toLocaleString("ru-KZ")} ${currency} / мес
- **Средний чек:** ${avgCheck.toLocaleString("ru-KZ")} ${currency} (Маржинальность: ${marginPct}%)
- **Точка безубыточности рекламы (Break-Even):** **${breakEven} продаж** в месяц
- **Прогноз первичных продаж:** **${totalSales} клиентов** в месяц
- **Ожидаемая выручка 1-го месяца:** **${revenue.toLocaleString("ru-KZ")} ${currency}**
- **Чистая операционная прибыль:** **${profit.toLocaleString("ru-KZ")} ${currency} / мес** (ROI **+${roi}%**)
- **Расчетный срок полной окупаемости бизнеса (Payback Period):** **~${paybackMonths} мес.** (с учетом накопления базы LTV).

${jsonBlock}`;
  }

  // Полный комплексный план 360°
  return `### 👑 1. Архитектура Бизнеса и Позиционирование (ИИ-Стратег)
**Сфера проекта:** ${industry} (${location})  
**Стартовый капитал (CAPEX):** ${openBudget.toLocaleString("ru-KZ")} ${currency} | **Рекламный бюджет:** ${adBudget.toLocaleString("ru-KZ")} ${currency}/мес

- **Уникальное торговое предложение (УТП):**  
  *«${sphere.usp}»*
- **Целевые сегменты покупателей:**
${sphere.segments.map((s) => `  - 👥 ${s}`).join("\n")}
- **Ключевые триггеры покупки в этой сфере:**
${sphere.triggers.map((t) => `  - ⚡ ${t}`).join("\n")}

---

### 🎯 2. Медиаплан и Каналы Продвижения (ИИ-Директор по Трафику)
Оптимальное распределение бюджета **${adBudget.toLocaleString("ru-KZ")} ${currency}** с учетом емкости аудитории:

${channelAllocations
  .map(
    (c, idx) =>
      `${idx + 1}. **${c.channel}** — **${c.sharePct}% (${c.budget.toLocaleString("ru-KZ")} ${currency})**
   - *Роль в воронке:* ${c.reason}
   - *Юнит-прогноз:* CAC ≈ **${c.estimatedCac.toLocaleString("ru-KZ")} ${currency}** → **~${c.expectedSales} клиентов/мес**`
  )
  .join("\n\n")}

---

### 🎬 3. Лучшая Рекламная Связка для Быстрого Старта (ИИ-Продюсер)
- **Формат:** ${sphere.creatives[0].channel} (${sphere.creatives[0].format})
- **Заголовок:** *«${sphere.creatives[0].headline}»*
- **Оффер первого шага:** **${sphere.creatives[0].offer}**
- **Скрипт первого ответа (до 3 минут):**  
  *${sphere.scripts[0].script}*

---

### 💰 4. Финансовая Модель и Окупаемость (ИИ-Финконтролер)
- **Средний чек:** ${avgCheck.toLocaleString("ru-KZ")} ${currency} | **Маржинальность:** ${marginPct}% | **LTV клиента:** ${ltv.toLocaleString("ru-KZ")} ${currency}
- **Точка безубыточности (Break-Even):** **${breakEven} продаж** в месяц
- **Прогноз продаж:** **${totalSales} новых клиентов** + повторная база
- **Прогнозируемая выручка:** **${revenue.toLocaleString("ru-KZ")} ${currency} / мес**
- **Чистая прибыль (после вычета рекламы):** **${profit.toLocaleString("ru-KZ")} ${currency} / мес**
- **Рентабельность маркетинга (ROI):** **+${roi}%** | **Окупаемость открытия (CAPEX):** **~${paybackMonths} мес.**

> 💡 *Все 6 графиков (Медиамикс, Денежный поток на 6 мес., Воронка продвижения, Кривые отдачи, Радар каналов и Сценарии) уже построены под вашу сферу «${industry}»! Переключитесь во вкладку «Графики» или «Стратегия Продвижения».*

${jsonBlock}`;
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { messages, model = "llama-3.3-70b-versatile", apiKey: clientApiKey, projectContext } = body;

    const headerKey = req.headers.get("x-groq-key");
    const groqKey = clientApiKey || headerKey || process.env.GROQ_API_KEY;

    const systemPrompt = buildSystemPrompt(projectContext);
    const fullMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10),
    ];

    // 1. Запрос через Groq Cloud API (если пользователь указал ключ)
    if (groqKey && model !== "free-ai") {
      const candidateModels = [
        model && model !== "free-ai" ? model : "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
      ];
      const uniqueModels = Array.from(new Set(candidateModels));

      for (const groqModel of uniqueModels) {
        try {
          const groqRes = await fetch(GROQ_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: groqModel,
              messages: fullMessages,
              temperature: 0.65,
              max_tokens: 3500,
            }),
            signal: AbortSignal.timeout(20_000),
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const text = groqData.choices?.[0]?.message?.content;
            if (text) {
              return NextResponse.json({
                content: text,
                provider: "groq",
                model: groqModel,
              });
            }
          }
        } catch (groqErr) {
          console.warn(`[chat/api] Groq call failed for ${groqModel}:`, groqErr);
        }
      }
    }

    // 2. Встроенный экспертный ИИ-движок AdForecast Sovereign AI (мгновенный, точный и с 100% гарантией валидного JSON для всех 6 графиков)
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";
    const sovereignContent = generateSovereignStrategy(lastUserMessage, projectContext);

    return NextResponse.json({
      content: sovereignContent,
      provider: "sovereign-ai",
      model: "AdForecast Sovereign Multi-Agent 3.0",
    });
  } catch (err: unknown) {
    console.error("[api/chat] Error:", err);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервиса чата" },
      { status: 500 }
    );
  }
}
