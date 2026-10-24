-- DropForeignKey
ALTER TABLE "ForecastAllocation" DROP CONSTRAINT "ForecastAllocation_adChannelId_fkey";

-- AddForeignKey
ALTER TABLE "ForecastAllocation" ADD CONSTRAINT "ForecastAllocation_adChannelId_fkey" FOREIGN KEY ("adChannelId") REFERENCES "AdChannel"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
