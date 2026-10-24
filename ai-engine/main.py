"""
AdForecast AI Engine: микросервис предиктивной аналитики рекламных бюджетов.

MVP-модель (без внешних API):
  * Отдача канала убывает с ростом вложений (эффект насыщения аудитории):
        customers(x) = (x / CAC) / (1 + x / S)
    где S — масштаб насыщения (доля от общего бюджета).
  * Оптимальные доли ищутся жадным пошаговым алгоритмом: каждый следующий
    «квант» бюджета отправляется в канал с наибольшей предельной прибылью.
  * Лиды = продажи / конверсия (конверсия лид → продажа).
"""

from __future__ import annotations

import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator

app = FastAPI(title="AdForecast AI Engine", version="0.1.0")

STEPS = 400  # на сколько «квантов» делим бюджет при оптимизации
SATURATION_SHARE = 0.6  # S = 60% общего бюджета


# ───────── Схемы запроса ─────────
class Channel(BaseModel):
    name: str = Field(min_length=1)
    historicalCac: float = Field(gt=0, description="Исторический CAC")
    conversionRate: float = Field(gt=0, le=1, description="0.0325 = 3.25%")


class PredictRequest(BaseModel):
    totalBudget: float = Field(gt=0)
    avgCheck: float = Field(gt=0)
    ltv: float | None = Field(default=None, gt=0)
    targetMargin: float | None = Field(default=None, ge=0, le=100, description="%")
    durationDays: int | None = Field(default=None, gt=0)
    currency: str = "USD"
    channels: list[Channel] = Field(min_length=1)

    @field_validator("channels")
    @classmethod
    def unique_names(cls, v: list[Channel]) -> list[Channel]:
        names = [c.name.lower() for c in v]
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
    reasoning: str


class PredictResponse(BaseModel):
    summary: str
    allocations: list[AllocationOut]
    risks: list[str]
    expectedLeads: int
    expectedSales: int
    expectedRevenue: float
    expectedProfit: float
    predictedRoi: float  # %


# ───────── Модель ─────────
def customers(spend: float, cac: float, saturation: float) -> float:
    """Ожидаемое число клиентов с убывающей отдачей."""
    return (spend / cac) / (1 + spend / saturation)


def optimize(req: PredictRequest) -> pd.DataFrame:
    df = pd.DataFrame([c.model_dump() for c in req.channels])
    value = req.ltv or req.avgCheck  # ценность клиента
    margin = (req.targetMargin if req.targetMargin is not None else 100) / 100
    unit_profit = value * margin  # прибыль с одного клиента

    saturation = req.totalBudget * SATURATION_SHARE
    step = req.totalBudget / STEPS
    spend = [0.0] * len(df)

    # Жадное распределение по предельной прибыли
    for _ in range(STEPS):
        gains = []
        for i, cac in enumerate(df["historicalCac"]):
            extra = customers(spend[i] + step, cac, saturation) - customers(
                spend[i], cac, saturation
            )
            gains.append(extra * unit_profit - step)
        best = gains.index(max(gains))
        spend[best] += step

    df["budget"] = spend
    df["sales"] = [
        customers(s, c, saturation) for s, c in zip(df["budget"], df["historicalCac"])
    ]
    df["leads"] = df["sales"] / df["conversionRate"]
    df["revenue"] = df["sales"] * value
    df["profit"] = df["revenue"] * margin - df["budget"]
    df["share"] = df["budget"] / req.totalBudget * 100
    return df


def explain(row: pd.Series, best_name: str) -> str:
    roi = row["profit"] / row["budget"] * 100 if row["budget"] > 0 else 0
    if row["budget"] <= 0:
        return "Канал неэффективен при текущем CAC, бюджет не выделен."
    tag = "Лидер по эффективности. " if row["name"] == best_name else ""
    return f"{tag}CAC {row['historicalCac']:.2f}, ROI канала ≈ {roi:.0f}%."


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    df = optimize(req)

    # Сглаживание округления: доли в сумме строго 100
    shares = df["share"].round(2).tolist()
    shares[shares.index(max(shares))] = round(
        shares[shares.index(max(shares))] + (100 - sum(shares)), 2
    )

    df["roi"] = df.apply(
        lambda r: r["profit"] / r["budget"] * 100 if r["budget"] > 0 else -100,
        axis=1,
    )
    best_name = df.loc[df["roi"].idxmax(), "name"]

    allocations = [
        AllocationOut(
            channel=r["name"],
            sharePct=shares[i],
            budget=round(r["budget"], 2),
            expectedLeads=round(r["leads"]),
            expectedSales=round(r["sales"]),
            expectedRevenue=round(r["revenue"], 2),
            expectedProfit=round(r["profit"], 2),
            reasoning=explain(r, best_name),
        )
        for i, (_, r) in enumerate(df.iterrows())
    ]

    total_budget = float(df["budget"].sum())
    profit = float(df["profit"].sum())
    roi = profit / total_budget * 100 if total_budget else 0.0

    risks: list[str] = []
    top = max(shares)
    if top > 60:
        risks.append(f"Высокая концентрация бюджета в одном канале ({top:.0f}%).")
    if roi < 0:
        risks.append("Прогнозируемый ROI отрицательный: пересмотрите CAC или маржу.")
    if len(req.channels) == 1:
        risks.append("Один канал трафика: нет диверсификации.")

    summary = (
        f"Оптимальное распределение бюджета {req.totalBudget:,.0f} даёт "
        f"≈{round(df['sales'].sum())} продаж и ROI {roi:.0f}%. "
        f"Лучший канал по ROI: {best_name}."
    )

    return PredictResponse(
        summary=summary,
        allocations=allocations,
        risks=risks,
        expectedLeads=round(df["leads"].sum()),
        expectedSales=round(df["sales"].sum()),
        expectedRevenue=round(float(df["revenue"].sum()), 2),
        expectedProfit=round(profit, 2),
        predictedRoi=round(roi, 2),
    )
