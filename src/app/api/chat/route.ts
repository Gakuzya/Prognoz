import { NextResponse } from "next/server";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ProjectContext {
  industry?: string;
  openingBudget?: number;
  adBudget?: number;
  currency?: string;
  location?: string;
  targetAudience?: string;
}

interface RequestBody {
  messages: ChatMessage[];
  model?: string;
  apiKey?: string;
  projectContext?: ProjectContext;
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Системный промпт для мультиагентной команды экспертов:
 * 1. Бизнес-стратег (Архитектура, УТП, дорожная карта)
 * 2. Медиапланер (Сплит каналов трафика, CPL, CAC, креативы)
 * 3. Финансовый аналитик (Точка безубыточности, юнит-экономика, окупаемость)
 */
function buildSystemPrompt(context?: ProjectContext) {
  let contextSnippet = "";
  if (context) {
    contextSnippet = `
ДАННЫЕ О ПРОЕКТЕ ПОЛЬЗОВАТЕЛЯ:
- Сфера / Ниша: ${context.industry || "Не указана (определи из запроса)"}
- Бюджет на открытие (CAPEX): ${context.openingBudget ? `${context.openingBudget} ${context.currency || "KZT"}` : "Не указан"}
- Бюджет на маркетинг/рекламу в месяц: ${context.adBudget ? `${context.adBudget} ${context.currency || "KZT"}` : "Не указан"}
- Локация / Город: ${context.location || "Казахстан (Алматы, Астана, Шымкент и др.)"}
- Валюта: ${context.currency || "KZT"}
`;
  }

  return `Ты — мультиагентная ИИ-система стратегического планирования бизнеса и рекламы платформы AdForecast для рынка Казахстана и Центральной Азии.
Основная расчетная валюта платформы — Казахстанский тенге (KZT, ₸). Все бюджеты, средние чеки, CPL, CAC, выручку и прибыль рассчитывай и указывай в ТЕНГЕ (₸, KZT), если пользователь явно не указал иную валюту.
Учитывай специфику рынка Казахстана:
- Ведущие каналы: Instagram Ads (Reels / Meta) — канал №1 по охвату и вовлечению в РК; 2GIS (критически важен для локального бизнеса в Алматы, Астане, Шымкенте); TikTok Ads РК (высокая динамика); Google.kz (поиск с высоким чеком); продажи и дожим через Kaspi Магазин и WhatsApp Business.

В твоем составе работают 3 виртуальных эксперта высокой квалификации:

1. 🏗️ **Бизнес-Стратег (Business Architect)**:
   - Разрабатывает концепцию запуска, УТП (уникальное торговое предложение) и позиционирование под рынок РК.
   - Определяет, какую площадку готовить в первую очередь (Instagram-аккаунт, профиль в 2GIS, витрина в Kaspi, сайт/квиз, WhatsApp-воронка).
   - Формирует пошаговый план открытия бизнеса по неделям (Roadmap недели 1-4).

2. 🎯 **Медиапланер & Директор по трафику (Ad Media Strategist)**:
   - Рассчитывает оптимальное распределение рекламного бюджета по ключевым каналам Казахстана (Instagram Reels/Stories, 2GIS, TikTok Ads, Google.kz, WhatsApp/Telegram).
   - Оценивает реалистичный CPL (цена лида в тенге ₸), конверсию в покупку и CAC (стоимость привлечения клиента в тенге ₸).
   - Предлагает конкретные офферы и рекламные креативы для первого запуска.

3. 💰 **Финансовый Контролер & Юнит-экономика (Financial Controller)**:
   - Считает точку безубыточности (Break-Even): сколько продаж нужно делать в день/месяц для выхода в ноль.
   - Оценивает ожидаемую выручку в тенге ₸, чистую прибыль и прогнозируемый ROI рекламных вложений.
   - Указывает ключевые финансовые риски и способы их избежать на рынке Казахстана.

${contextSnippet}

ПРАВИЛА ОТВЕТА:
- Пиши четко, структурированно, профессионально и по делу, на русском языке.
- Все суммы по умолчанию приводи в тенге (₸).
- Используй Markdown заголовки, списки, выделения.
- В конце ответа ВСЕГДА добавь скрытый или явный JSON-блок данных в формате:
\`\`\`json:adforecast_data
{
  "industry": "Название сферы",
  "openingBudget": 5000000,
  "adBudget": 600000,
  "currency": "KZT",
  "breakEvenSales": 35,
  "estimatedRevenue": 3850000,
  "estimatedProfit": 1100000,
  "estimatedRoi": 183,
  "channelAllocations": [
    { "channel": "Instagram Ads (Reels / Meta)", "sharePct": 45, "budget": 270000, "estimatedCac": 8500, "expectedSales": 32 },
    { "channel": "2GIS (Казахстан)", "sharePct": 35, "budget": 210000, "estimatedCac": 6500, "expectedSales": 32 },
    { "channel": "TikTok Ads (Казахстан)", "sharePct": 20, "budget": 120000, "estimatedCac": 7200, "expectedSales": 17 }
  ],
  "actionChecklist": [
    { "task": "Оформить Instagram и карточку в 2GIS с акцией для новых клиентов", "phase": "Неделя 1" }
  ]
}
\`\`\`
Этот JSON будет автоматически прочитан интерактивными виджетами платформы для построения визуальных графиков и передачи в симулятор!`;
}

/**
 * Локальный генератор стратегии на случай отсутствия связи с внешними API
 */
function generateLocalStrategy(userPrompt: string, context?: ProjectContext) {
  const currency = context?.currency || "KZT";
  const adBudget = context?.adBudget || 600000;
  const openBudget = context?.openingBudget || 5000000;
  const industry =
    context?.industry ||
    (userPrompt.toLowerCase().includes("сто")
      ? "Автосервис / СТО"
      : userPrompt.toLowerCase().includes("инстаграм") ||
        userPrompt.toLowerCase().includes("одежд") ||
        userPrompt.toLowerCase().includes("kaspi")
      ? "Instagram-магазин / Kaspi"
      : "Малый бизнес в РК");

  const ch1Share = 45;
  const ch2Share = 35;
  const ch3Share = 20;

  const ch1Budget = Math.round(adBudget * (ch1Share / 100));
  const ch2Budget = Math.round(adBudget * (ch2Share / 100));
  const ch3Budget = Math.round(adBudget * (ch3Share / 100));

  let ch1Name = "Instagram Ads (Reels / Meta)";
  let ch2Name = "2GIS (Алматы / Астана / Шымкент)";
  let ch3Name = "TikTok Ads (Казахстан)";
  let cac1 = 8500;
  let cac2 = 6500;
  let cac3 = 7200;

  if (
    industry.toLowerCase().includes("инстаграм") ||
    industry.toLowerCase().includes("магазин") ||
    industry.toLowerCase().includes("kaspi")
  ) {
    ch1Name = "Instagram Reels & Таргетированная реклама";
    ch2Name = "Kaspi Магазин & Продвижение витрины";
    ch3Name = "TikTok Ads & Локальные блогеры Алматы/Астаны";
    cac1 = 4500;
    cac2 = 3200;
    cac3 = 4800;
  } else if (industry.toLowerCase().includes("b2b") || industry.toLowerCase().includes("онлайн-школ")) {
    ch1Name = "Google.kz (Поисковая реклама)";
    ch2Name = "Meta Ads (Лид-формы Instagram / Facebook)";
    ch3Name = "WhatsApp / Telegram (Прямой маркетинг)";
    cac1 = 16000;
    cac2 = 12000;
    cac3 = 8500;
  }

  const sales1 = Math.round(ch1Budget / Math.max(cac1, 1));
  const sales2 = Math.round(ch2Budget / Math.max(cac2, 1));
  const sales3 = Math.round(ch3Budget / Math.max(cac3, 1));
  const totalSales = sales1 + sales2 + sales3;

  const avgCheck = industry.includes("СТО")
    ? 35000
    : industry.includes("магазин")
    ? 18000
    : industry.includes("b2b") || industry.includes("онлайн-школ")
    ? 120000
    : 22000;
  const revenue = totalSales * avgCheck;
  const marginPct = 45;
  const profit = Math.round((revenue * marginPct) / 100) - adBudget;
  const roi = Math.round((profit / adBudget) * 100);
  const breakEven = Math.round(adBudget / (avgCheck * (marginPct / 100)));

  return `### 🏗️ Агент 1: Бизнес-Стратег (Архитектура запуска)

**Сфера:** ${industry}  
**Инвестиционный план:** ${openBudget.toLocaleString("ru-KZ")} ${currency} на запуск, ${adBudget.toLocaleString("ru-KZ")} ${currency} на маркетинг.

1. **Позиционирование и УТП**:
   - Четкая специализация и отстройка от конкурентов: скорость выполнения, прозрачные цены и гарантия качества.
   - Лид-магнит для первого визита / заказа: приветственный бонус (скидка 15-20% или бесплатная сопутствующая услуга).
2. **Подготовка посадочных площадок**:
   - Оформление профилей, подключение онлайн-записи / чат-бота для моментального ответа клиентам в течение 5 минут.
   - Запуск сбора отзывов с первых клиентов через систему мотивации.
3. **Дорожная карта (Roadmap)**:
   - **Неделя 1**: Упаковка оффера, подготовка рекламных креативов, настройка аналитики (UTM-метки, цели).
   - **Неделя 2**: Тестовый запуск каналов с 25% бюджета, отсечение неэффективных связок.
   - **Неделя 3**: Масштабирование связок-победителей, усиление ретаргетинга на теплую базу.
   - **Неделя 4**: Фиксация фактического CAC, анализ повторных продаж (LTV).

---

### 🎯 Агент 2: Медиапланер & Директор по трафику

Рекомендованный медиамикс на рекламный бюджет **${adBudget.toLocaleString("ru-KZ")} ${currency}**:

1. **${ch1Name}** — **${ch1Share}% (${ch1Budget.toLocaleString("ru-KZ")} ${currency})**
   - *Роль*: Горячий спрос пользователей, которые ищут прямо сейчас.
   - *Прогноз*: CAC ≈ ${cac1} ${currency}, ожидаемый объем: ~${sales1} клиентов.
2. **${ch2Name}** — **${ch2Share}% (${ch2Budget.toLocaleString("ru-KZ")} ${currency})**
   - *Роль*: Локальный и визуальный трафик, доверие и узнаваемость бренда.
   - *Прогноз*: CAC ≈ ${cac2} ${currency}, ожидаемый объем: ~${sales2} клиентов.
3. **${ch3Name}** — **${ch3Share}% (${ch3Budget.toLocaleString("ru-KZ")} ${currency})**
   - *Роль*: Дополнительный охват и дожим сомневающейся аудитории.
   - *Прогноз*: CAC ≈ ${cac3} ${currency}, ожидаемый объем: ~${sales3} клиентов.

---

### 💰 Агент 3: Финансовый Контролер & Юнит-экономика

- **Точка безубыточности (Break-Even)**: **${breakEven} клиентов/заказов** в месяц для полного покрытия маркетинговых вложений.
- **Прогнозируемый объем продаж**: **~${totalSales} заказов/клиентов** в месяц.
- **Ожидаемая выручка**: **${revenue.toLocaleString("ru-KZ")} ${currency}**.
- **Чистая операционная прибыль после вычета рекламы**: **${profit.toLocaleString("ru-KZ")} ${currency}**.
- **Прогнозируемый ROI маркетинга**: **+${roi}%**.

**Рекомендации по снижению рисков:**
- Не сливайте весь бюджет в первую неделю: распределяйте по формуле 15% (тест) -> 40% (масштабирование) -> 30% (пик) -> 15% (дожим).
- Контролируйте скорость ответа на заявки: если лид ждет более 15 минут, конверсия падает в 3 раза.

\`\`\`json:adforecast_data
{
  "industry": "${industry}",
  "openingBudget": ${openBudget},
  "adBudget": ${adBudget},
  "currency": "${currency}",
  "breakEvenSales": ${breakEven},
  "estimatedRevenue": ${revenue},
  "estimatedProfit": ${profit},
  "estimatedRoi": ${roi},
  "channelAllocations": [
    { "channel": "${ch1Name}", "sharePct": ${ch1Share}, "budget": ${ch1Budget}, "estimatedCac": ${cac1}, "expectedSales": ${sales1} },
    { "channel": "${ch2Name}", "sharePct": ${ch2Share}, "budget": ${ch2Budget}, "estimatedCac": ${cac2}, "expectedSales": ${sales2} },
    { "channel": "${ch3Name}", "sharePct": ${ch3Share}, "budget": ${ch3Budget}, "estimatedCac": ${cac3}, "expectedSales": ${sales3} }
  ],
  "actionChecklist": [
    { "task": "Упаковать посадочную страницу и УТП с лид-магнитом", "phase": "Неделя 1" },
    { "task": "Настроить пиксели конверсий и UTM-разметку", "phase": "Неделя 1" },
    { "task": "Запустить тестовую рекламу в 3 каналах с лимитом", "phase": "Неделя 2" },
    { "task": "Отключить неэффективные объявления и удвоить бюджет на лидере", "phase": "Неделя 3" },
    { "task": "Запустить ретаргетинг и цепочку повторных покупок", "phase": "Неделя 4" }
  ]
}
\`\`\``;
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { messages, model = "llama-3.3-70b-versatile", apiKey: clientApiKey, projectContext } = body;

    // Пользователь может передать API-ключ в теле запроса, через заголовок или через .env
    const headerKey = req.headers.get("x-groq-key");
    const groqKey = clientApiKey || headerKey || process.env.GROQ_API_KEY;

    const systemPrompt = buildSystemPrompt(projectContext);
    const fullMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10), // последние сообщения для контекста беседы
    ];

    // 1. Попытка запроса через Groq API, если есть ключ
    if (groqKey && model !== "free-ai") {
      const candidateModels = [
        model && model !== "free-ai" ? model : "openai/gpt-oss-120b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "llama-3.3-70b-versatile",
      ];
      // Убираем дубликаты
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
              temperature: 0.7,
              max_tokens: 3500,
            }),
            signal: AbortSignal.timeout(25_000),
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
          } else {
            console.warn(`[chat/api] Groq error on ${groqModel}:`, groqRes.status, await groqRes.text());
          }
        } catch (groqErr) {
          console.warn(`[chat/api] Groq call failed for ${groqModel}:`, groqErr);
        }
      }
    }

    // 2. Бесплатный AI провайдер (Pollinations AI - свободный доступ без ключа)
    try {
      const freeRes = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: fullMessages,
          model: "openai",
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(8_000),
      });

      if (freeRes.ok) {
        const text = await freeRes.text();
        if (text && text.trim().length > 50) {
          return NextResponse.json({
            content: text,
            provider: "free-ai",
            model: "Free Cloud AI (Llama/OpenAI)",
          });
        }
      }
    } catch (freeErr) {
      console.warn("[chat/api] Free endpoint failed or timed out, using local engine:", freeErr);
    }

    // 3. Локальный надежный движок стратегического планирования (гарантия 100% ответа)
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";
    const localContent = generateLocalStrategy(lastUserMessage, projectContext);

    return NextResponse.json({
      content: localContent,
      provider: "local-engine",
      model: "AdForecast Business Intelligence Engine",
    });
  } catch (err: unknown) {
    console.error("[api/chat] Error:", err);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервиса чата" },
      { status: 500 }
    );
  }
}
