"""
AdForecast AI Engine 2.0: микросервис предиктивной аналитики и Media Mix Modeling (MMM).

Возможности:
  1. Нелинейная модель насыщения каналов (Закон убывающей отдачи / Hill-like saturation curve).
  2. Сценарный анализ What-If:
     - Balanced (Оптимальный по чистой прибыли)
     - Conservative (Диверсифицированный, защита от волатильности, cap на долю канала)
     - Aggressive (Максимизация выручки и доли рынка / customer acquisition)
  3. Response Curves (Кривые насыщения каналов: зависимость Spend -> Revenue -> CAC).
  4. Понедельный календарный медиаплан (Flight Plan с фазами тестирования, масштабирования и ретаргетинга).
"""

from __future__ import annotations

import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator

app = FastAPI(title="AdForecast AI Engine", version="2.0.0")

STEPS = 400


# ───────── Схемы запроса ─────────
class Channel(BaseModel):
    name: str = Field(min_length=1)
    historicalCac: float = Field(gt=0, description="Исторический CAC")
    conversionRate: float = Field(gt=0, le=1, description="Конверсия лид -> клиент (напр. 0.035 = 3.5%)")


class PredictRequest(BaseModel):
    totalBudget: float = Field(gt=0)
    avgCheck: float = Field(gt=0)
    ltv: float | None = Field(default=None, gt=0)
    targetMargin: float | None = Field(default=None, ge=0, le=100, description="Маржинальность в %")
    durationDays: int | None = Field(default=30, gt=0)
    currency: str = "USD"
    channels: list[Channel] = Field(min_length=1)

    @field_validator("channels")
    @classmethod
    def unique_names(cls, v: list[Channel]) -> list[Channel]:
        names = [c.name.strip().lower() for c in v]
        if len(names) != len(set(names)):
            raise ValueError("Названия каналов должны быть уникальными")
        return v


# ───────── Схемы ответа ─────────
class AllocationOut(BaseModel):
    channel: str
    sharePct: float
    budget: float
    expectedLeads: int
    expectedSales: int
    expectedRevenue: float
    expectedProfit: float
    effectiveCac: float
    saturationPoint: float
    reasoning: str


class ScenarioDetail(BaseModel):
    name: str
    label: str
    description: str
    expectedSales: int
    expectedRevenue: float
    expectedProfit: float
    predictedRoi: float
    allocations: list[AllocationOut]


class CurvePoint(BaseModel):
    spend: float
    revenue: float
    profit: float
    effectiveCac: float


class ResponseCurveRow(BaseModel):
    spendPct: int
    totalSpend: float
    channels: dict[str, CurvePoint]


class FlightPlanWeek(BaseModel):
    week: int
    title: str
    sharePct: float
    budget: float
    goal: str
    actionItems: list[str]


class PredictResponse(BaseModel):
    summary: str
    allocations: list[AllocationOut]
    risks: list[str]
    expectedLeads: int
    expectedSales: int
    expectedRevenue: float
    expectedProfit: float
    predictedRoi: float
    scenarios: dict[str, ScenarioDetail]
    responseCurves: list[ResponseCurveRow]
    flightPlan: list[FlightPlanWeek]


# ───────── Математическое ядро моделирования ─────────
def customers(spend: float, cac: float, saturation: float) -> float:
    """Нелинейная функция отдачи с учетом емкости канала."""
    if spend <= 0 or cac <= 0:
        return 0.0
    return (spend / cac) / (1.0 + spend / max(saturation, 1.0))


def run_allocation(
    channels: list[Channel],
    total_budget: float,
    unit_profit: float,
    unit_value: float,
    margin: float,
    saturation_share: float = 0.6,
    max_channel_share: float = 1.0,
    volume_bias: float = 0.0,
) -> tuple[pd.DataFrame, float, float]:
    """
    Жадный шаг оптимизации с ограничениями долей и поддержкой целевых функций.
    volume_bias > 0 смещает оптимизацию в сторону общего числа клиентов (агрессивный рост).
    """
    df = pd.DataFrame([c.model_dump() for c in channels])
    saturation = total_budget * saturation_share
    step = total_budget / STEPS
    spend = [0.0] * len(df)
    max_allowed_spend = total_budget * max_channel_share

    for _ in range(STEPS):
        gains = []
        for i, cac in enumerate(df["historicalCac"]):
            if spend[i] + step > max_allowed_spend:
                gains.append(-1e9)  # Превышен лимит доли
                continue
            extra_cust = customers(spend[i] + step, cac, saturation) - customers(spend[i], cac, saturation)
            # Взвешенная предельная отдача: чистая прибыль + надбавка за объем продаж
            gain = extra_cust * unit_profit - step + (extra_cust * unit_value * volume_bias)
            gains.append(gain)

        best = gains.index(max(gains))
        if gains[best] < -1e8:
            # Если все каналы достигли потолка, распределяем остаток равномерно
            eligible = [i for i in range(len(df)) if spend[i] + step <= max_allowed_spend + 1e-4]
            best = eligible[0] if eligible else 0
        spend[best] += step

    df["budget"] = [round(s, 2) for s in spend]
    df["sales"] = [
        customers(s, c, saturation) for s, c in zip(df["budget"], df["historicalCac"])
    ]
    df["leads"] = [
        s / max(cr, 0.0001) for s, cr in zip(df["sales"], df["conversionRate"])
    ]
    df["revenue"] = df["sales"] * unit_value
    df["profit"] = df["revenue"] * margin - df["budget"]
    df["share"] = df["budget"] / total_budget * 100
    df["effectiveCac"] = [
        round(b / max(s, 0.001), 2) for b, s in zip(df["budget"], df["sales"])
    ]
    df["saturationPoint"] = [round(c * 12, 0) for c in df["historicalCac"]]

    # Коррекция суммы долей до 100%
    shares = df["share"].round(1).tolist()
    diff = round(100.0 - sum(shares), 1)
    if shares:
        max_idx = shares.index(max(shares))
        shares[max_idx] = round(shares[max_idx] + diff, 1)
    df["share"] = shares

    tot_revenue = float(df["revenue"].sum())
    tot_profit = float(df["profit"].sum())
    return df, tot_revenue, tot_profit


def explain(row: pd.Series, best_name: str) -> str:
    roi = row["profit"] / row["budget"] * 100 if row["budget"] > 0 else 0
    if row["budget"] <= 0:
        return "Канал исключен из базового распределения из-за высокого начального CAC."
    tag = "Ключевой драйвер прибыли. " if row["name"] == best_name else ""
    return (
        f"{tag}Бюджет {row['share']:.1f}%, эффективный CAC ≈ {row['effectiveCac']:.1f}, "
        f"прогнозируемый ROI ≈ {roi:.0f}%."
    )


def build_scenario(
    name: str,
    label: str,
    description: str,
    df: pd.DataFrame,
    tot_revenue: float,
    tot_profit: float,
    total_budget: float,
    best_name: str,
) -> ScenarioDetail:
    roi = (tot_profit / total_budget) * 100 if total_budget > 0 else 0.0
    allocations = [
        AllocationOut(
            channel=r["name"],
            sharePct=float(r["share"]),
            budget=float(r["budget"]),
            expectedLeads=int(round(r["leads"])),
            expectedSales=int(round(r["sales"])),
            expectedRevenue=round(float(r["revenue"]), 2),
            expectedProfit=round(float(r["profit"]), 2),
            effectiveCac=float(r["effectiveCac"]),
            saturationPoint=float(r["saturationPoint"]),
            reasoning=explain(r, best_name),
        )
        for _, r in df.iterrows()
    ]
    return ScenarioDetail(
        name=name,
        label=label,
        description=description,
        expectedSales=int(round(df["sales"].sum())),
        expectedRevenue=round(tot_revenue, 2),
        expectedProfit=round(tot_profit, 2),
        predictedRoi=round(roi, 1),
        allocations=allocations,
    )


# ───────── Роуты ─────────
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "2.0.0"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    value = req.ltv or req.avgCheck
    margin = (req.targetMargin if req.targetMargin is not None else 100) / 100
    unit_profit = value * margin

    # 1. Оптимальный (Balanced) сценарий
    df_bal, rev_bal, prof_bal = run_allocation(
        req.channels,
        req.totalBudget,
        unit_profit,
        value,
        margin,
        saturation_share=0.6,
        max_channel_share=1.0,
        volume_bias=0.0,
    )
    df_bal["roi"] = df_bal.apply(
        lambda r: r["profit"] / r["budget"] * 100 if r["budget"] > 0 else -100, axis=1
    )
    best_channel_name = df_bal.loc[df_bal["roi"].idxmax(), "name"]

    bal_scenario = build_scenario(
        name="balanced",
        label="Сбалансированный (ML-Оптимум)",
        description="Максимизация чистой прибыли с учетом насыщения каналов.",
        df=df_bal,
        tot_revenue=rev_bal,
        tot_profit=prof_bal,
        total_budget=req.totalBudget,
        best_name=best_channel_name,
    )

    # 2. Консервативный (Conservative) сценарий: лимит доли 35-40%, высокая диверсификация
    max_cap = 0.40 if len(req.channels) >= 3 else (0.65 if len(req.channels) == 2 else 1.0)
    df_cons, rev_cons, prof_cons = run_allocation(
        req.channels,
        req.totalBudget,
        unit_profit,
        value,
        margin,
        saturation_share=0.45,
        max_channel_share=max_cap,
        volume_bias=0.0,
    )
    cons_scenario = build_scenario(
        name="conservative",
        label="Консервативный (Min-Risk)",
        description="Сниженный риск просадки, жесткая диверсификация между источниками.",
        df=df_cons,
        tot_revenue=rev_cons,
        tot_profit=prof_cons,
        total_budget=req.totalBudget,
        best_name=best_channel_name,
    )

    # 3. Агрессивный (Aggressive) сценарий: фокус на захват рынка и число клиентов
    df_agg, rev_agg, prof_agg = run_allocation(
        req.channels,
        req.totalBudget,
        unit_profit,
        value,
        margin,
        saturation_share=0.85,
        max_channel_share=1.0,
        volume_bias=0.25,
    )
    agg_scenario = build_scenario(
        name="aggressive",
        label="Агрессивный (Scale / Доля рынка)",
        description="Максимизация потока клиентов и выручки при допустимом пороге окупаемости.",
        df=df_agg,
        tot_revenue=rev_agg,
        tot_profit=prof_agg,
        total_budget=req.totalBudget,
        best_name=best_channel_name,
    )

    scenarios = {
        "balanced": bal_scenario,
        "conservative": cons_scenario,
        "aggressive": agg_scenario,
    }

    # 4. Построение Response Curves (Кривых отдачи от 10% до 150% бюджета)
    response_curves: list[ResponseCurveRow] = []
    percentages = [15, 30, 50, 75, 100, 125, 150]
    for pct in percentages:
        scale = pct / 100.0
        cur_total = req.totalBudget * scale
        ch_points: dict[str, CurvePoint] = {}
        for c in req.channels:
            ch_spend = (cur_total / len(req.channels))  # контрольный срез
            c_sales = customers(ch_spend, c.historicalCac, cur_total * 0.6)
            c_rev = c_sales * value
            c_prof = c_rev * margin - ch_spend
            c_eff_cac = ch_spend / max(c_sales, 0.001)
            ch_points[c.name] = CurvePoint(
                spend=round(ch_spend, 2),
                revenue=round(c_rev, 2),
                profit=round(c_prof, 2),
                effectiveCac=round(c_eff_cac, 2),
            )
        response_curves.append(
            ResponseCurveRow(
                spendPct=pct,
                totalSpend=round(cur_total, 2),
                channels=ch_points,
            )
        )

    # 5. Понедельный календарный медиаплан (Flight Plan)
    flight_plan = [
        FlightPlanWeek(
            week=1,
            title="Калибровка и A/B-тестирование креативов",
            sharePct=15.0,
            budget=round(req.totalBudget * 0.15, 2),
            goal="Выявление связок с минимальным CPL, обучение пикселей и аудит аудиторий.",
            actionItems=[
                "Запуск по 3-5 вариаций креативов на каждый канал трафика",
                "Фиксация стартового CTR и первичной конверсии посадочной страницы",
                "Отключение объявлений с CPL выше медианного на 40%",
            ],
        ),
        FlightPlanWeek(
            week=2,
            title="Масштабирование лидеров (ТОП-каналы)",
            sharePct=40.0,
            budget=round(req.totalBudget * 0.40, 2),
            goal="Перераспределение основного объема бюджета в наиболее прибыльные источники.",
            actionItems=[
                f"Повышение дневного лимита в канале-лидере ({best_channel_name})",
                "Подключение Lookalike-аудиторий и расширение геотаргетинга",
                "Контроль эффективного CAC, предотвращение выгорания объявлений",
            ],
        ),
        FlightPlanWeek(
            week=3,
            title="Пиковый охват и оптимизация CPO",
            sharePct=30.0,
            budget=round(req.totalBudget * 0.30, 2),
            goal="Достижение максимального объема продаж и удержание целевой рентабельности.",
            actionItems=[
                "Активация офферов с ограничением по времени (дедлайны)",
                "Усиление ретаргетинга на пользователей, не завершивших заказ",
                "Ежедневный мониторинг маржинальности закрытых сделок",
            ],
        ),
        FlightPlanWeek(
            week=4,
            title="Финальный ретаргетинг и LTV-дожим",
            sharePct=15.0,
            budget=round(req.totalBudget * 0.15, 2),
            goal="Сбор отложенного спроса и максимизация повторных покупок.",
            actionItems=[
                "Ретаргетинг теплой базы лидов через узкие персонализированные месседжи",
                "Email/SMS/Мессенджер-цепочки по собранным контактам",
                "Итоговый финансовый срез план/факт и подготовка следующего спринта",
            ],
        ),
    ]

    # Анализ рисков
    risks: list[str] = []
    top_share = max(df_bal["share"])
    if top_share > 60:
        risks.append(f"Высокая концентрация бюджета в лидере ({top_share:.0f}%): уязвимость к изменениям аукциона.")
    if bal_scenario.predictedRoi < 0:
        risks.append("Отрицательный ожидаемый ROI: требуются оптимизация CAC или повышение среднего чека/LTV.")
    if len(req.channels) == 1:
        risks.append("Единственный канал трафика: отсутствие диверсификации повышает риски просадки.")

    summary = (
        f"Оптимальный медиаплан на {req.totalBudget:,.0f} {req.currency} прогнозирует "
        f"≈{bal_scenario.expectedSales} продаж и чистую прибыль {bal_scenario.expectedProfit:,.0f} {req.currency} "
        f"(ROI +{bal_scenario.predictedRoi:.0f}%). Лидер по окупаемости: {best_channel_name}."
    )

    return PredictResponse(
        summary=summary,
        allocations=bal_scenario.allocations,
        risks=risks,
        expectedLeads=int(round(df_bal["leads"].sum())),
        expectedSales=bal_scenario.expectedSales,
        expectedRevenue=bal_scenario.expectedRevenue,
        expectedProfit=bal_scenario.expectedProfit,
        predictedRoi=bal_scenario.predictedRoi,
        scenarios=scenarios,
        responseCurves=response_curves,
        flightPlan=flight_plan,
    )
