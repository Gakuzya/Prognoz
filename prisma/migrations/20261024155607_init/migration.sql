-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "avgCheck" DECIMAL(12,2) NOT NULL,
    "targetMargin" DECIMAL(5,2) NOT NULL,
    "ltv" DECIMAL(12,2) NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalBudget" DECIMAL(14,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdChannel" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "historicalCac" DECIMAL(12,2) NOT NULL,
    "conversionRate" DECIMAL(6,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forecast" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "predictedRoi" DECIMAL(8,2) NOT NULL,
    "expectedLeads" INTEGER NOT NULL,
    "expectedSales" INTEGER,
    "expectedRevenue" DECIMAL(14,2),
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastAllocation" (
    "id" TEXT NOT NULL,
    "forecastId" TEXT NOT NULL,
    "adChannelId" TEXT NOT NULL,
    "allocatedBudget" DECIMAL(14,2) NOT NULL,
    "expectedProfit" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "ForecastAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"("userId");

-- CreateIndex
CREATE INDEX "Campaign_companyId_status_idx" ON "Campaign"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AdChannel_companyId_name_key" ON "AdChannel"("companyId", "name");

-- CreateIndex
CREATE INDEX "Forecast_campaignId_createdAt_idx" ON "Forecast"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "ForecastAllocation_adChannelId_idx" ON "ForecastAllocation"("adChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastAllocation_forecastId_adChannelId_key" ON "ForecastAllocation"("forecastId", "adChannelId");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdChannel" ADD CONSTRAINT "AdChannel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastAllocation" ADD CONSTRAINT "ForecastAllocation_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "Forecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastAllocation" ADD CONSTRAINT "ForecastAllocation_adChannelId_fkey" FOREIGN KEY ("adChannelId") REFERENCES "AdChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
